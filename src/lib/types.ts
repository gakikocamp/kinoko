export type CountryStatus = "ok" | "conditional" | "prohibited" | "unverified";

export type DealStatus =
  | "inquiry"
  | "sample_sent"
  | "quotation_sent"
  | "pi_issued"
  | "waiting_for_payment"
  | "paid"
  | "repacking"
  | "ready_to_ship"
  | "shipped"
  | "completed"
  | "cancelled";

export interface Country {
  code: string;
  name_en: string;
  name_ja: string;
  status: CountryStatus;
  summary: string | null;
  requirements: { label: string; required: boolean }[];
  notes: string | null;
  last_reviewed_at: string | null;
}

export interface Customer {
  id: string;
  customer_no: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  vat_number: string | null;
  eori_number: string | null;
  import_license_notes: string | null;
  preferred_payment_method: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_no: string;
  name: string;
  brand_name: string | null;
  grade: string | null;
  harvest_year: number | null;
  harvest_season: string | null;
  origin: string | null;
  country_of_origin: string;
  hs_code: string | null;
  unit_price: number | null;
  price_currency: string;
  cost_price: number | null;
  moq: number | null;
  packaging_type: string | null;
  description: string | null;
  internal_notes: string | null;
  is_archived: boolean;
}

export interface Deal {
  id: string;
  deal_no: string;
  customer_id: string;
  status: DealStatus;
  currency: string;
  payment_terms: string | null;
  incoterms: string | null;
  destination_country: string | null;
  expected_ship_date: string | null;
  custom_packaging_fee: number;
  packaging_fee_title: string | null;
  packaging_fee_desc: string | null;
  shipping_fee: number;
  subtotal: number;
  total_amount: number;
  shipping_method: string | null;
  tracking_number: string | null;
  shipped_date: string | null;
  internal_notes: string | null;
  created_at: string;
}

export interface DealItem {
  id: string;
  deal_id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export type DocType =
  | "quotation"
  | "proforma_invoice"
  | "commercial_invoice"
  | "packing_list";

export interface IssuedDocument {
  id: string;
  deal_id: string;
  doc_type: DocType;
  doc_number: string;
  revision: number;
  issue_date: string;
  data: DocSnapshot;
  pdf_file_path: string | null;
  status: "issued" | "void";
  created_at: string;
}

export interface DealCarton {
  id: string;
  deal_id: string;
  carton_range: string | null;
  cartons_count: number;
  units_per_carton: number;
  net_weight_kg: number | null;
  gross_weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  sort_order: number;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  address: string;
  phone: string | null;
  email: string | null;
  representative_name: string | null;
  bank_details: string | null;
  wise_details: string | null;
  default_currency: string;
  default_payment_terms: string | null;
}

/** PI発行時のスナップショット(docs/03参照)。PDFはこのJSONのみを入力とする */
export interface PiSnapshot {
  docType: "proforma_invoice";
  docNumber: string;
  revision: number;
  issueDate: string;
  exporter: {
    companyName: string;
    address: string;
    phone: string | null;
    email: string | null;
  };
  buyer: {
    companyName: string;
    contactPerson: string | null;
    billingAddress: string | null;
    country: string | null;
    vatNumber: string | null;
    eoriNumber: string | null;
  };
  shipTo: { address: string | null };
  terms: {
    currency: string;
    incoterms: string | null;
    paymentTerms: string | null;
    countryOfOrigin: string;
  };
  items: {
    description: string;
    hsCode: string | null;
    origin: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
  }[];
  fees: {
    packagingFee: {
      title: string;
      description: string;
      amount: number;
    } | null;
    shippingFee: number;
  };
  totals: { subtotal: number; total: number };
  bank: { bankDetails: string | null; wiseDetails: string | null };
  notes: string | null;
  signature: { name: string | null };
}

/** Commercial Invoice スナップショット(docs/03 §2)。銀行情報なし・発送情報あり */
export interface CiSnapshot
  extends Omit<PiSnapshot, "docType" | "bank"> {
  docType: "commercial_invoice";
  shipping: {
    reasonForExport: string; // 原則 "Sale"
    method: string | null;
    trackingNumber: string | null;
  };
}

/** Packing List スナップショット(docs/03 §3)。金額なし・数量/重量のみ */
export interface PlSnapshot {
  docType: "packing_list";
  docNumber: string;
  revision: number;
  issueDate: string;
  refInvoiceNumber: string | null; // 対応するCI番号
  exporter: { companyName: string; address: string };
  consignee: {
    companyName: string;
    address: string | null;
    country: string | null;
  };
  cartons: {
    cartonRange: string | null;
    product: string;
    packaging: string | null;
    cartonsCount: number;
    unitsPerCarton: number;
    netWeightKg: number | null; // 1箱あたり
    grossWeightKg: number | null;
    dimensionsCm: string | null; // "40 x 30 x 25"
  }[];
  totals: {
    cartons: number;
    units: number;
    netWeightKg: number;
    grossWeightKg: number;
    volumeM3: number | null;
  };
  notes: string | null;
  signature: { name: string | null };
}

/** 見積書スナップショット。PIと同構造だが銀行情報は載せない(まだ請求ではないため) */
export interface QtSnapshot extends Omit<PiSnapshot, "docType" | "bank"> {
  docType: "quotation";
}

export type DocSnapshot = QtSnapshot | PiSnapshot | CiSnapshot | PlSnapshot;

export interface Payment {
  id: string;
  deal_id: string;
  amount: number;
  currency: string;
  received_date: string;
  method: string | null;
  notes: string | null;
  created_at: string;
}

export type FileCategory =
  | "pi_pdf"
  | "ci_pdf"
  | "pl_pdf"
  | "coa"
  | "product_label"
  | "payment_proof"
  | "shipping_receipt"
  | "tracking_doc"
  | "qc_photo"
  | "other";

/** 案件ファイル(一覧表示用。urlは署名付き=60秒 or デモではdata URL) */
export interface StoredFile {
  id: string;
  category: FileCategory;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  url: string | null;
}

export interface ProductLot {
  id: string;
  product_id: string;
  lot_number: string;
  production_date: string | null;
  best_before: string | null;
  coa_file_path: string | null;
  coa_url: string | null; // 表示用(署名付き or data URL)
  notes: string | null;
}
