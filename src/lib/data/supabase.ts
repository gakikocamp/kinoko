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
  Payment,
  Product,
  ProductLot,
  StoredFile,
} from "../types";
import type { DataRepo, DealWithRefs } from "./repo";

const DOC_PREFIX: Record<DocType, string> = {
  quotation: "QT",
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

    // 発行に応じて商談中ステータスを自動で前進させる
    if (docType === "proforma_invoice" || docType === "quotation") {
      const { data: deal } = await supabase
        .from("deals")
        .select("status")
        .eq("id", dealId)
        .single();
      if (
        docType === "proforma_invoice" &&
        deal &&
        ["inquiry", "sample_sent", "quotation_sent"].includes(deal.status)
      ) {
        await this.updateDealStatus(dealId, "pi_issued");
      }
      if (
        docType === "quotation" &&
        deal &&
        ["inquiry", "sample_sent"].includes(deal.status)
      ) {
        await this.updateDealStatus(dealId, "quotation_sent");
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

  async listPayments(dealId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("deal_id", dealId)
      .order("received_date", { ascending: false });
    return must(data, error) as Payment[];
  },
  async addPayment(dealId, input) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("payments")
      .insert({ ...input, deal_id: dealId });
    if (error) throw new Error(error.message);
  },

  async listFiles(dealId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deal_files")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });
    const rows = must(data, error) as (StoredFile & { storage_path: string })[];
    // 非公開バケットのため60秒の署名付きURLで返す(docs/08 §3)
    return Promise.all(
      rows.map(async (f) => {
        const { data: signed } = await supabase.storage
          .from("attachments")
          .createSignedUrl(f.storage_path, 60);
        return { ...f, url: signed?.signedUrl ?? null };
      })
    );
  },
  async uploadFile(dealId, input) {
    const supabase = await createClient();
    const path = `deals/${dealId}/${input.category}/${crypto.randomUUID()}_${input.fileName}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, Buffer.from(input.base64, "base64"), {
        contentType: input.mimeType,
      });
    if (upErr) throw new Error(upErr.message);
    const { error } = await supabase.from("deal_files").insert({
      deal_id: dealId,
      category: input.category,
      file_name: input.fileName,
      storage_path: path,
      mime_type: input.mimeType,
      size_bytes: Math.round(input.base64.length * 0.75),
    });
    if (error) throw new Error(error.message);
  },
  async deleteFile(dealId, fileId) {
    const supabase = await createClient();
    const { data: file } = await supabase
      .from("deal_files")
      .select("storage_path")
      .eq("id", fileId)
      .eq("deal_id", dealId)
      .maybeSingle();
    if (!file) return;
    await supabase.storage.from("attachments").remove([file.storage_path]);
    const { error } = await supabase
      .from("deal_files")
      .delete()
      .eq("id", fileId)
      .eq("deal_id", dealId);
    if (error) throw new Error(error.message);
  },

  async listLots(productId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_lots")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    const rows = must(data, error) as ProductLot[];
    return Promise.all(
      rows.map(async (l) => {
        if (!l.coa_file_path) return { ...l, coa_url: null };
        const { data: signed } = await supabase.storage
          .from("attachments")
          .createSignedUrl(l.coa_file_path, 60);
        return { ...l, coa_url: signed?.signedUrl ?? null };
      })
    );
  },
  async addLot(productId, input) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("product_lots")
      .insert({ ...input, product_id: productId });
    if (error) throw new Error(error.message);
  },
  async uploadLotCoa(productId, lotId, file) {
    const supabase = await createClient();
    const path = `products/${productId}/coa/${crypto.randomUUID()}_${file.fileName}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, Buffer.from(file.base64, "base64"), {
        contentType: file.mimeType,
      });
    if (upErr) throw new Error(upErr.message);
    const { error } = await supabase
      .from("product_lots")
      .update({ coa_file_path: path })
      .eq("id", lotId)
      .eq("product_id", productId);
    if (error) throw new Error(error.message);
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
