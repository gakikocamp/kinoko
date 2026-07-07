"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import type { DealStatus, PiSnapshot } from "@/lib/types";

export type ActionState = { error: string } | null;

export async function createDealAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const num = (k: string) => Number(get(k) ?? 0) || 0;

  const customerId = get("customer_id");
  const productId = get("product_id");
  if (!customerId || !productId) {
    return { error: "顧客と商品を選択してください" };
  }
  const product = await repo.getProduct(productId);
  if (!product) return { error: "商品が見つかりません" };

  const quantity = num("quantity");
  const unitPrice = num("unit_price");
  if (quantity <= 0) return { error: "数量を入力してください" };

  const amount = Math.round(quantity * unitPrice * 100) / 100;
  const packagingFee = num("custom_packaging_fee");
  const shippingFee = num("shipping_fee");
  const subtotal = Math.round((amount + packagingFee) * 100) / 100;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  const incotermsRule = get("incoterms_rule");
  const incotermsPlace = get("incoterms_place");

  let dealId: string;
  try {
    dealId = await repo.createDeal(
      {
        customer_id: customerId,
        currency: get("currency") ?? "USD",
        payment_terms: get("payment_terms"),
        incoterms: incotermsRule
          ? `${incotermsRule}${incotermsPlace ? ` ${incotermsPlace}` : ""}`
          : null,
        destination_country: get("destination_country"),
        expected_ship_date: get("expected_ship_date"),
        custom_packaging_fee: packagingFee,
        packaging_fee_title: get("packaging_fee_title"),
        packaging_fee_desc: get("packaging_fee_desc"),
        shipping_fee: shippingFee,
        subtotal,
        total_amount: total,
        internal_notes: get("internal_notes"),
      },
      {
        product_id: productId,
        description: get("item_description") ?? product.description ?? product.name,
        quantity,
        unit: get("unit") ?? "pcs",
        unit_price: unitPrice,
        amount,
      }
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "案件を作成できませんでした" };
  }

  revalidatePath("/deals");
  redirect(`/deals/${dealId}`);
}

export async function advanceDealStatusAction(dealId: string, to: DealStatus) {
  await repo.updateDealStatus(dealId, to);
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/");
}

/**
 * PI発行(docs/03)。スナップショットをサーバー側で確定し、採番して保存する。
 * PDF化はブラウザ側(/deals/[id]/pi/[docId])で行う。
 */
export async function issuePiAction(
  dealId: string,
  input: { notes: string | null; validityDays: number }
): Promise<{ error: string } | { docId: string }> {
  const deal = await repo.getDeal(dealId);
  if (!deal || !deal.customer) return { error: "案件が見つかりません" };

  // ⚪未確認の国にはPIを発行できない(docs/07 §1)
  if (deal.country?.status === "unverified") {
    return {
      error: `${deal.country.name_ja}は輸出条件が未確認のためPIを発行できません。「国・輸出ルール」で確認・分類してから発行してください`,
    };
  }
  if (deal.country?.status === "prohibited") {
    return { error: `${deal.country.name_ja}は対応不可のためPIを発行できません` };
  }

  const settings = await repo.getSettings();
  const c = deal.customer;

  const notesParts: string[] = [];
  if (input.validityDays > 0) {
    notesParts.push(`This proforma invoice is valid for ${input.validityDays} days from the issue date.`);
  }
  notesParts.push("All bank charges are to be borne by the buyer.");
  notesParts.push(
    "Beneficiary bank details never change by email. Only the account stated on this PI is valid."
  );
  if (input.notes) notesParts.push(input.notes);

  const snapshotBase: Omit<PiSnapshot, "docNumber"> = {
    docType: "proforma_invoice",
    revision: 0,
    issueDate: new Date().toISOString().slice(0, 10),
    exporter: {
      companyName: settings.company_name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
    },
    buyer: {
      companyName: c.company_name,
      contactPerson: c.contact_person,
      billingAddress: c.billing_address,
      country: deal.country?.name_en ?? c.country,
      vatNumber: c.vat_number,
      eoriNumber: c.eori_number,
    },
    shipTo: { address: c.shipping_address },
    terms: {
      currency: deal.currency,
      incoterms: deal.incoterms,
      paymentTerms: deal.payment_terms ?? settings.default_payment_terms,
      countryOfOrigin: "Japan",
    },
    items: deal.items.map((i) => ({
      description: i.description,
      hsCode: null,
      origin: null,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unit_price,
      amount: i.amount,
    })),
    fees: {
      packagingFee:
        deal.custom_packaging_fee > 0
          ? {
              title: deal.packaging_fee_title ?? "Custom repacking & label application fee",
              description: deal.packaging_fee_desc ?? "",
              amount: deal.custom_packaging_fee,
            }
          : null,
      shippingFee: deal.shipping_fee,
    },
    totals: { subtotal: deal.subtotal, total: deal.total_amount },
    bank: { bankDetails: settings.bank_details, wiseDetails: settings.wise_details },
    notes: notesParts.join("\n"),
    signature: { name: settings.representative_name },
  };

  // 商品のHSコード・産地を明細に反映
  for (let i = 0; i < deal.items.length; i++) {
    const product = await repo.getProduct(deal.items[i].product_id);
    snapshotBase.items[i].hsCode = product?.hs_code ?? null;
    snapshotBase.items[i].origin = product?.origin ?? null;
  }

  const docId = await repo.issuePi(dealId, snapshotBase);
  revalidatePath(`/deals/${dealId}`);
  return { docId };
}
