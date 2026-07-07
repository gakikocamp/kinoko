/**
 * 本番用データアクセス実装(Supabase)。
 * 認可の本体はDB側のRLS(supabase/migrations 参照)。
 */
import { createClient } from "@/lib/supabase/server";
import type {
  CompanySettings,
  Country,
  Customer,
  DealCarton,
  DealStatus,
  DocSnapshot,
  DocType,
  IssuedDocument,
  Product,
} from "../types";
import type { DataRepo, DealWithRefs } from "./repo";

const DOC_PREFIX: Record<DocType, string> = {
  proforma_invoice: "PI",
  commercial_invoice: "CI",
  packing_list: "PL",
};

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error("not found");
  return data;
}

const DEAL_SELECT =
  "*, customer:customers(*), items:deal_items(*), country:destination_countries(*)";

export const supabaseRepo: DataRepo = {
  async getCountries() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("destination_countries")
      .select("*")
      .order("code");
    return must(data, error) as Country[];
  },
  async getCountry(code) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("destination_countries")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    return (data as Country) ?? null;
  },

  async getSettings() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", 1)
      .single();
    return must(data, error) as CompanySettings;
  },
  async updateSettings(patch) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("company_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
  },

  async listCustomers() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("is_archived", false)
      .order("customer_no");
    return must(data, error) as Customer[];
  },
  async getCustomer(id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Customer) ?? null;
  },
  async createCustomer(input) {
    const supabase = await createClient();
    const { data: no, error: seqErr } = await supabase.rpc("next_doc_number", {
      p_type: "CUST",
    });
    if (seqErr) throw new Error(seqErr.message);
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...input, customer_no: no })
      .select("id")
      .single();
    return must(data, error).id as string;
  },
  async updateCustomer(id, patch) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("customers")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listProducts() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", false)
      .order("product_no");
    return must(data, error) as Product[];
  },
  async getProduct(id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Product) ?? null;
  },
  async createProduct(input) {
    const supabase = await createClient();
    const { data: no, error: seqErr } = await supabase.rpc("next_doc_number", {
      p_type: "PROD",
    });
    if (seqErr) throw new Error(seqErr.message);
    const { data, error } = await supabase
      .from("products")
      .insert({ ...input, product_no: no })
      .select("id")
      .single();
    return must(data, error).id as string;
  },
  async updateProduct(id, patch) {
    const supabase = await createClient();
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listDeals(statusFilter) {
    const supabase = await createClient();
    let query = supabase
      .from("deals")
      .select(DEAL_SELECT)
      .order("created_at", { ascending: false });
    if (statusFilter) query = query.eq("status", statusFilter);
    const { data, error } = await query;
    return must(data, error) as unknown as DealWithRefs[];
  },
  async listDealsByCustomer(customerId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deals")
      .select(DEAL_SELECT)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    return must(data, error) as unknown as DealWithRefs[];
  },
  async getDeal(id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deals")
      .select(DEAL_SELECT)
      .eq("id", id)
      .maybeSingle();
    return (data as unknown as DealWithRefs) ?? null;
  },
  async createDeal(input, item) {
    const supabase = await createClient();

    // 🔴対応不可国のブロック(docs/07 §1)
    if (input.destination_country) {
      const country = await this.getCountry(input.destination_country);
      if (country?.status === "prohibited") {
        throw new Error(
          `${country.name_ja}は現在対応不可のため案件を作成できません(理由: ${country.summary ?? "-"})`
        );
      }
    }

    const { data: no, error: seqErr } = await supabase.rpc("next_doc_number", {
      p_type: "DEAL",
    });
    if (seqErr) throw new Error(seqErr.message);

    const { data, error } = await supabase
      .from("deals")
      .insert({ ...input, deal_no: no, status: "inquiry" })
      .select("id")
      .single();
    const dealId = must(data, error).id as string;

    const { error: itemErr } = await supabase
      .from("deal_items")
      .insert({ ...item, deal_id: dealId });
    if (itemErr) throw new Error(itemErr.message);

    // 🟡条件付き国: 要件チェックリストを案件へコピー(docs/07 §3)
    if (input.destination_country) {
      const country = await this.getCountry(input.destination_country);
      if (country && country.requirements.length > 0) {
        await supabase.from("deal_compliance_checks").insert(
          country.requirements.map((r, i) => ({
            deal_id: dealId,
            label: r.label,
            required: r.required,
            sort_order: i,
          }))
        );
      }
    }

    await supabase.from("deal_status_history").insert({
      deal_id: dealId,
      from_status: null,
      to_status: "inquiry",
    });

    return dealId;
  },
  async updateDealStatus(id, status: DealStatus) {
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("deals")
      .select("status")
      .eq("id", id)
      .single();
    const { error } = await supabase
      .from("deals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await supabase.from("deal_status_history").insert({
      deal_id: id,
      from_status: current?.status ?? null,
      to_status: status,
    });
  },

  async listDocuments(dealId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });
    return must(data, error) as IssuedDocument[];
  },
  async getDocument(id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as IssuedDocument) ?? null;
  },
  async issueDocument(dealId, docType, snapshotBase) {
    const supabase = await createClient();
    const { data: no, error: seqErr } = await supabase.rpc("next_doc_number", {
      p_type: DOC_PREFIX[docType],
    });
    if (seqErr) throw new Error(seqErr.message);

    const snapshot = { ...snapshotBase, docNumber: no as string } as DocSnapshot;
    const { data, error } = await supabase
      .from("documents")
      .insert({
        deal_id: dealId,
        doc_type: docType,
        doc_number: no,
        issue_date: snapshot.issueDate,
        data: snapshot,
      })
      .select("id")
      .single();
    const docId = must(data, error).id as string;

    // PI発行時のみ、商談中ステータスの案件を pi_issued へ進める
    if (docType === "proforma_invoice") {
      const { data: deal } = await supabase
        .from("deals")
        .select("status")
        .eq("id", dealId)
        .single();
      if (
        deal &&
        ["inquiry", "sample_sent", "quotation_sent"].includes(deal.status)
      ) {
        await this.updateDealStatus(dealId, "pi_issued");
      }
    }
    return docId;
  },

  async updateDealShipping(id, patch) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("deals")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listCartons(dealId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deal_cartons")
      .select("*")
      .eq("deal_id", dealId)
      .order("sort_order");
    return must(data, error) as DealCarton[];
  },
  async saveCartons(dealId, rows) {
    const supabase = await createClient();
    const { error: delErr } = await supabase
      .from("deal_cartons")
      .delete()
      .eq("deal_id", dealId);
    if (delErr) throw new Error(delErr.message);
    if (rows.length > 0) {
      const { error } = await supabase
        .from("deal_cartons")
        .insert(rows.map((r) => ({ ...r, deal_id: dealId })));
      if (error) throw new Error(error.message);
    }
  },

  async dashboardCounts() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("deals").select("status");
    const rows = must(data, error) as { status: DealStatus }[];
    return {
      activeDeals: rows.filter(
        (r) => r.status !== "completed" && r.status !== "cancelled"
      ).length,
      waitingPayment: rows.filter((r) => r.status === "waiting_for_payment")
        .length,
      inProduction: rows.filter(
        (r) => r.status === "paid" || r.status === "repacking"
      ).length,
      readyToShip: rows.filter((r) => r.status === "ready_to_ship").length,
    };
  },
};
