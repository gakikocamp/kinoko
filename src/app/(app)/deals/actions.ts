"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { repo, type DealWithRefs, type DealCartonInput } from "@/lib/data";
import type {
  CiSnapshot,
  CompanySettings,
  DealStatus,
  FileCategory,
  PiSnapshot,
  PlSnapshot,
  QtSnapshot,
} from "@/lib/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB(docs/08 §5)

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

/** ⚪未確認/🔴対応不可の国への書類発行ブロック(docs/07 §1) */
function countryBlockError(deal: DealWithRefs): string | null {
  if (deal.country?.status === "unverified") {
    return `${deal.country.name_ja}は輸出条件が未確認のため書類を発行できません。「国・輸出ルール」で確認・分類してから発行してください`;
  }
  if (deal.country?.status === "prohibited") {
    return `${deal.country.name_ja}は対応不可のため書類を発行できません`;
  }
  return null;
}

/** PI/CI共通の当事者・条件・明細ブロックを構築 */
async function buildInvoiceCommon(deal: DealWithRefs, settings: CompanySettings) {
  const c = deal.customer!;
  const common = {
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
      hsCode: null as string | null,
      origin: null as string | null,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unit_price,
      amount: i.amount,
    })),
    fees: {
      packagingFee:
        deal.custom_packaging_fee > 0
          ? {
              title:
                deal.packaging_fee_title ??
                "Custom repacking & label application fee",
              description: deal.packaging_fee_desc ?? "",
              amount: deal.custom_packaging_fee,
            }
          : null,
      shippingFee: deal.shipping_fee,
    },
    totals: { subtotal: deal.subtotal, total: deal.total_amount },
    signature: { name: settings.representative_name },
  };
  // 商品のHSコード・産地を明細に反映
  for (let i = 0; i < deal.items.length; i++) {
    const product = await repo.getProduct(deal.items[i].product_id);
    common.items[i].hsCode = product?.hs_code ?? null;
    common.items[i].origin = product?.origin ?? null;
  }
  return common;
}

/**
 * PI発行(docs/03)。スナップショットをサーバー側で確定し、採番して保存する。
 * PDF化はブラウザ側(書類ビューア)で行う。
 */
export async function issuePiAction(
  dealId: string,
  input: { notes: string | null; validityDays: number }
): Promise<{ error: string } | { docId: string }> {
  const deal = await repo.getDeal(dealId);
  if (!deal || !deal.customer) return { error: "案件が見つかりません" };
  const blocked = countryBlockError(deal);
  if (blocked) return { error: blocked };

  const settings = await repo.getSettings();

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
    ...(await buildInvoiceCommon(deal, settings)),
    bank: { bankDetails: settings.bank_details, wiseDetails: settings.wise_details },
    notes: notesParts.join("\n"),
  };

  const docId = await repo.issueDocument(dealId, "proforma_invoice", snapshotBase);
  revalidatePath(`/deals/${dealId}`);
  return { docId };
}

/**
 * Commercial Invoice発行(docs/03 §2)。
 * 発送方法・追跡番号を案件に保存してからスナップショットを確定する。
 */
export async function issueCiAction(
  dealId: string,
  input: {
    shippingMethod: string | null;
    trackingNumber: string | null;
    notes: string | null;
  }
): Promise<{ error: string } | { docId: string }> {
  const deal = await repo.getDeal(dealId);
  if (!deal || !deal.customer) return { error: "案件が見つかりません" };
  const blocked = countryBlockError(deal);
  if (blocked) return { error: blocked };

  await repo.updateDealShipping(dealId, {
    shipping_method: input.shippingMethod,
    tracking_number: input.trackingNumber,
  });

  const settings = await repo.getSettings();
  const notesParts: string[] = [
    "We hereby certify that this invoice is true and correct.",
  ];
  if (input.notes) notesParts.push(input.notes);

  const snapshotBase: Omit<CiSnapshot, "docNumber"> = {
    docType: "commercial_invoice",
    ...(await buildInvoiceCommon(deal, settings)),
    shipping: {
      reasonForExport: "Sale",
      method: input.shippingMethod,
      trackingNumber: input.trackingNumber,
    },
    notes: notesParts.join("\n"),
  };

  const docId = await repo.issueDocument(dealId, "commercial_invoice", snapshotBase);
  revalidatePath(`/deals/${dealId}`);
  return { docId };
}

export type CartonRowInput = {
  cartonRange: string | null;
  cartonsCount: number;
  unitsPerCarton: number;
  netWeightKg: number | null;
  grossWeightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

/**
 * Packing List発行(docs/03 §3)。カートン明細を保存し、合計を自動計算して
 * スナップショットを確定する。金額は一切含めない。
 */
export async function issuePlAction(
  dealId: string,
  input: { cartons: CartonRowInput[]; notes: string | null }
): Promise<{ error: string } | { docId: string }> {
  const deal = await repo.getDeal(dealId);
  if (!deal || !deal.customer) return { error: "案件が見つかりません" };
  const blocked = countryBlockError(deal);
  if (blocked) return { error: blocked };
  if (input.cartons.length === 0) {
    return { error: "カートン明細を1行以上入力してください" };
  }

  // カートン明細を保存(次回発行時に再利用)
  const rows: DealCartonInput[] = input.cartons.map((c, i) => ({
    carton_range: c.cartonRange,
    cartons_count: c.cartonsCount,
    units_per_carton: c.unitsPerCarton,
    net_weight_kg: c.netWeightKg,
    gross_weight_kg: c.grossWeightKg,
    length_cm: c.lengthCm,
    width_cm: c.widthCm,
    height_cm: c.heightCm,
    sort_order: i,
  }));
  await repo.saveCartons(dealId, rows);

  const settings = await repo.getSettings();
  const c = deal.customer;
  const item = deal.items[0];
  const product = item ? await repo.getProduct(item.product_id) : null;

  // 最新のCI番号を参照として記載
  const docs = await repo.listDocuments(dealId);
  const latestCi = docs.find(
    (d) => d.doc_type === "commercial_invoice" && d.status === "issued"
  );

  const totals = input.cartons.reduce(
    (acc, r) => {
      acc.cartons += r.cartonsCount;
      acc.units += r.cartonsCount * r.unitsPerCarton;
      acc.netWeightKg += (r.netWeightKg ?? 0) * r.cartonsCount;
      acc.grossWeightKg += (r.grossWeightKg ?? 0) * r.cartonsCount;
      if (r.lengthCm && r.widthCm && r.heightCm) {
        acc.volume +=
          (r.lengthCm * r.widthCm * r.heightCm * r.cartonsCount) / 1_000_000;
      }
      return acc;
    },
    { cartons: 0, units: 0, netWeightKg: 0, grossWeightKg: 0, volume: 0 }
  );

  const snapshotBase: Omit<PlSnapshot, "docNumber"> = {
    docType: "packing_list",
    revision: 0,
    issueDate: new Date().toISOString().slice(0, 10),
    refInvoiceNumber: latestCi?.doc_number ?? null,
    exporter: {
      companyName: settings.company_name,
      address: settings.address,
    },
    consignee: {
      companyName: c.company_name,
      address: c.shipping_address ?? c.billing_address,
      country: deal.country?.name_en ?? c.country,
    },
    cartons: input.cartons.map((r) => ({
      cartonRange: r.cartonRange,
      product: item?.description.split("\n")[0] ?? "-",
      packaging: product?.packaging_type ?? null,
      cartonsCount: r.cartonsCount,
      unitsPerCarton: r.unitsPerCarton,
      netWeightKg: r.netWeightKg,
      grossWeightKg: r.grossWeightKg,
      dimensionsCm:
        r.lengthCm && r.widthCm && r.heightCm
          ? `${r.lengthCm} x ${r.widthCm} x ${r.heightCm}`
          : null,
    })),
    totals: {
      cartons: totals.cartons,
      units: totals.units,
      netWeightKg: Math.round(totals.netWeightKg * 1000) / 1000,
      grossWeightKg: Math.round(totals.grossWeightKg * 1000) / 1000,
      volumeM3: totals.volume > 0 ? Math.round(totals.volume * 1000) / 1000 : null,
    },
    notes: input.notes,
    signature: { name: settings.representative_name },
  };

  const docId = await repo.issueDocument(dealId, "packing_list", snapshotBase);
  revalidatePath(`/deals/${dealId}`);
  return { docId };
}

/** 入金を記録する(docs/05 §5: 100%前払い運用の要) */
export async function addPaymentAction(
  dealId: string,
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const amount = Number(formData.get("amount"));
  const receivedDate = String(formData.get("received_date") ?? "");
  if (!amount || amount <= 0) return { error: "入金額を入力してください" };
  if (!receivedDate) return { error: "入金日を入力してください" };

  const deal = await repo.getDeal(dealId);
  if (!deal) return { error: "案件が見つかりません" };

  await repo.addPayment(dealId, {
    amount,
    currency: String(formData.get("currency") ?? deal.currency),
    received_date: receivedDate,
    method: (formData.get("method") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath(`/deals/${dealId}`);
  return { ok: true };
}

const UPLOAD_CATEGORIES: FileCategory[] = [
  "coa", "product_label", "payment_proof",
  "shipping_receipt", "tracking_doc", "qc_photo", "other",
];

/** 案件ファイルのアップロード(拡張子・サイズ検証はここで行う・docs/08 §5) */
export async function uploadDealFileAction(
  dealId: string,
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const file = formData.get("file");
  const category = formData.get("category") as FileCategory;
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ファイルを選択してください" };
  }
  if (!UPLOAD_CATEGORIES.includes(category)) {
    return { error: "種類を選択してください" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "ファイルが大きすぎます(上限20MB)" };
  }
  // 実行可能ファイル拒否(docs/08 §5)
  if (/\.(exe|sh|bat|cmd|js|msi|app)$/i.test(file.name)) {
    return { error: "このファイル形式はアップロードできません" };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  await repo.uploadFile(dealId, {
    category,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    base64: bytes.toString("base64"),
  });
  revalidatePath(`/deals/${dealId}`);
  return { ok: true };
}

export async function deleteDealFileAction(dealId: string, fileId: string) {
  await repo.deleteFile(dealId, fileId);
  revalidatePath(`/deals/${dealId}`);
}

/**
 * 見積書(Quotation)発行。PIと同構造だが銀行情報は載せない。
 * 発行時、商談中(Inquiry/Sample Sent)の案件は「見積提示済み」に自動前進。
 */
export async function issueQtAction(
  dealId: string,
  input: { notes: string | null; validityDays: number }
): Promise<{ error: string } | { docId: string }> {
  const deal = await repo.getDeal(dealId);
  if (!deal || !deal.customer) return { error: "案件が見つかりません" };
  const blocked = countryBlockError(deal);
  if (blocked) return { error: blocked };

  const settings = await repo.getSettings();

  const notesParts: string[] = [];
  if (input.validityDays > 0) {
    notesParts.push(
      `This quotation is valid for ${input.validityDays} days from the date above.`
    );
  }
  if (input.notes) notesParts.push(input.notes);

  const snapshotBase: Omit<QtSnapshot, "docNumber"> = {
    docType: "quotation",
    ...(await buildInvoiceCommon(deal, settings)),
    notes: notesParts.join("\n"),
  };

  const docId = await repo.issueDocument(dealId, "quotation", snapshotBase);
  revalidatePath(`/deals/${dealId}`);
  return { docId };
}
