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

export interface IssuedDocument {
  id: string;
  deal_id: string;
  doc_type: "proforma_invoice" | "commercial_invoice" | "packing_list";
  doc_number: string;
  revision: number;
  issue_date: string;
  data: PiSnapshot;
  pdf_file_path: string | null;
  status: "issued" | "void";
  created_at: string;
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
