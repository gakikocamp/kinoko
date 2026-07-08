/**
 * デモモード用インメモリ実装。
 * DEMO_MODE=1 のときだけ使われる(本番は supabase.ts)。
 * プロセス再起動でリセットされるサンプルデータ。
 */
import type {
  CompanySettings,
  Country,
  Customer,
  Deal,
  DealCarton,
  DealItem,
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

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
let idSeq = 100;
const uid = () => `demo-${idSeq++}`;

const countries: Country[] = [
  { code: "US", name_en: "United States", name_ja: "アメリカ合衆国", status: "ok", summary: "FDA施設登録+Prior Notice", requirements: [{ label: "製造元のFDA食品施設登録番号を確認済み", required: true }, { label: "出荷ごとのPrior Notice提出(通常はクーリエ/フォワーダーが代行)", required: true }], notes: null, last_reviewed_at: "2026-06-01" },
  { code: "GB", name_en: "United Kingdom", name_ja: "イギリス", status: "ok", summary: "UK EORI必須・日英EPA優遇可", requirements: [{ label: "買い手のUK EORI番号を顧客情報に登録済み", required: true }], notes: null, last_reviewed_at: "2026-06-01" },
  { code: "CA", name_en: "Canada", name_ja: "カナダ", status: "ok", summary: "輸入者側SFCライセンス", requirements: [], notes: null, last_reviewed_at: "2026-06-01" },
  { code: "SG", name_en: "Singapore", name_ja: "シンガポール", status: "ok", summary: "規制軽微", requirements: [], notes: null, last_reviewed_at: "2026-06-01" },
  { code: "HK", name_en: "Hong Kong", name_ja: "香港", status: "ok", summary: "規制軽微", requirements: [], notes: null, last_reviewed_at: "2026-06-01" },
  { code: "DE", name_en: "Germany", name_ja: "ドイツ", status: "conditional", summary: "EU: 農薬MRL適合COA必須・EORI必須", requirements: [{ label: "残留農薬MRL適合のCOAをLOTに添付済み(EU基準・最重要)", required: true }, { label: "買い手のEORI番号を顧客情報に登録済み", required: true }, { label: "日EU EPA原産地申告文をCIに記載(関税ゼロ化・任意)", required: false }], notes: null, last_reviewed_at: "2026-05-15" },
  { code: "FR", name_en: "France", name_ja: "フランス", status: "conditional", summary: "EU: 農薬MRL適合COA必須・EORI必須", requirements: [{ label: "残留農薬MRL適合のCOAをLOTに添付済み(EU基準・最重要)", required: true }, { label: "買い手のEORI番号を顧客情報に登録済み", required: true }], notes: null, last_reviewed_at: "2026-05-15" },
  { code: "NL", name_en: "Netherlands", name_ja: "オランダ", status: "conditional", summary: "EU: 農薬MRL適合COA必須・EORI必須", requirements: [{ label: "残留農薬MRL適合のCOAをLOTに添付済み(EU基準・最重要)", required: true }, { label: "買い手のEORI番号を顧客情報に登録済み", required: true }], notes: null, last_reviewed_at: "2026-05-15" },
  { code: "TW", name_en: "Taiwan", name_ja: "台湾", status: "conditional", summary: "全日本産食品に産地証明書", requirements: [{ label: "産地証明書を取得(全ての日本産食品に必要)", required: true }], notes: null, last_reviewed_at: "2026-04-10" },
  { code: "AU", name_en: "Australia", name_ja: "オーストラリア", status: "conditional", summary: "BICONで輸入条件確認", requirements: [{ label: "BICON(輸入条件DB)で緑茶の最新条件を確認", required: true }], notes: null, last_reviewed_at: "2026-04-10" },
  { code: "AE", name_en: "United Arab Emirates", name_ja: "アラブ首長国連邦", status: "conditional", summary: "輸入者登録・アラビア語ラベル", requirements: [{ label: "輸入者の食品登録を確認", required: true }], notes: null, last_reviewed_at: "2026-04-10" },
  { code: "CN", name_en: "China", name_ja: "中国", status: "prohibited", summary: "GACC登録+全量検査で通関が長期・不確実。体制構築まで対応不可", requirements: [], notes: null, last_reviewed_at: "2026-05-15" },
  { code: "RU", name_en: "Russia", name_ja: "ロシア", status: "prohibited", summary: "制裁により決済手段が実質喪失", requirements: [], notes: null, last_reviewed_at: "2026-05-15" },
  { code: "KP", name_en: "North Korea", name_ja: "北朝鮮", status: "prohibited", summary: "日本の全面輸出禁止措置", requirements: [], notes: null, last_reviewed_at: "2026-05-15" },
  { code: "BR", name_en: "Brazil", name_ja: "ブラジル", status: "unverified", summary: null, requirements: [], notes: null, last_reviewed_at: null },
  { code: "MX", name_en: "Mexico", name_ja: "メキシコ", status: "unverified", summary: null, requirements: [], notes: null, last_reviewed_at: null },
  { code: "ZA", name_en: "South Africa", name_ja: "南アフリカ", status: "unverified", summary: null, requirements: [], notes: null, last_reviewed_at: null },
];

const settings: CompanySettings = {
  id: 1,
  company_name: "MATCHA NINJA Co., Ltd.",
  address: "1-2-3 Yame Chuo, Yame City, Fukuoka 834-0031, Japan",
  phone: "+81-943-00-0000",
  email: "export@matcha-ninja.example",
  representative_name: "Taro Yame",
  bank_details:
    "Bank: Fukuoka Bank, Yame Branch\nSWIFT: FKBKJPJT\nAccount: 1234567 (MATCHA NINJA Co., Ltd.)",
  wise_details: "Wise: export@matcha-ninja.example (USD/EUR receiving enabled)",
  default_currency: "USD",
  default_payment_terms: "100% advance payment before production and shipment",
};

const customers: Customer[] = [
  {
    id: "cust-1",
    customer_no: "CUST-2026-0001",
    company_name: "Green Leaf Trading GmbH",
    contact_person: "Anna Schmidt",
    email: "anna@greenleaf.example",
    phone: "+49-30-1234567",
    country: "DE",
    billing_address: "Grüne Straße 12, 10115 Berlin, Germany",
    shipping_address: "Warehouse 4, Hafenstraße 8, 20457 Hamburg, Germany",
    vat_number: "DE123456789",
    eori_number: "DE1234567890123",
    import_license_notes: "有機認証は取得予定なし。通常食品として輸入",
    preferred_payment_method: "Wise",
    notes: "月1回ペースのリピーター候補。プライベートラベル希望",
    is_archived: false,
    created_at: "2026-06-10T09:00:00Z",
    updated_at: "2026-06-10T09:00:00Z",
  },
  {
    id: "cust-2",
    customer_no: "CUST-2026-0002",
    company_name: "Pacific Tea Imports LLC",
    contact_person: "John Miller",
    email: "john@pacifictea.example",
    phone: "+1-415-555-0100",
    country: "US",
    billing_address: "500 Market St, San Francisco, CA 94105, USA",
    shipping_address: "500 Market St, San Francisco, CA 94105, USA",
    vat_number: null,
    eori_number: null,
    import_license_notes: "FSVP対応のためCOA・製造者情報の提供が必要",
    preferred_payment_method: "Wire transfer (T/T)",
    notes: null,
    is_archived: false,
    created_at: "2026-06-20T02:00:00Z",
    updated_at: "2026-06-20T02:00:00Z",
  },
];

const products: Product[] = [
  {
    id: "prod-1",
    product_no: "PROD-2026-0001",
    name: 'Imperial Ceremonial',
    brand_name: "MATCHA NINJA",
    grade: "Ceremonial",
    harvest_year: 2026,
    harvest_season: "Spring 1st Flush",
    origin: "Yame, Fukuoka, Japan",
    country_of_origin: "Japan",
    hs_code: "0902.10",
    unit_price: 38.0,
    price_currency: "USD",
    cost_price: 2100,
    moq: 100,
    packaging_type: "100g silver aluminum pouch",
    description:
      'MATCHA NINJA "Imperial Ceremonial"\n2026 Spring 1st Flush Yame Matcha\n100g silver aluminum pouch',
    internal_notes: "原価はJPY建て(2,100円/袋)。為替に注意",
    is_archived: false,
  },
  {
    id: "prod-2",
    product_no: "PROD-2026-0002",
    name: "Culinary Grade A",
    brand_name: "MATCHA NINJA",
    grade: "Culinary A",
    harvest_year: 2026,
    harvest_season: "Spring 2nd Flush",
    origin: "Yame, Fukuoka, Japan",
    country_of_origin: "Japan",
    hs_code: "0902.10",
    unit_price: 19.5,
    price_currency: "USD",
    cost_price: 950,
    moq: 200,
    packaging_type: "1kg aluminum bag",
    description:
      'MATCHA NINJA "Culinary Grade A"\n2026 Yame Matcha for food processing\n1kg aluminum bag',
    internal_notes: null,
    is_archived: false,
  },
];

const deals: Deal[] = [
  {
    id: "deal-1",
    deal_no: "DEAL-2026-0001",
    customer_id: "cust-1",
    status: "quotation_sent",
    currency: "USD",
    payment_terms: "100% advance payment before production and shipment",
    incoterms: "DAP Hamburg",
    destination_country: "DE",
    expected_ship_date: "2026-08-20",
    custom_packaging_fee: 1480,
    packaging_fee_title: "Custom repacking & label application fee",
    packaging_fee_desc:
      "100g x 200 silver aluminum pouches. Includes label printing/cutting, label application, 100g weighing and repacking, oxygen absorber insertion, heat sealing, lot control, and final quality check.",
    shipping_fee: 350,
    subtotal: 9080,
    total_amount: 9430,
    shipping_method: null,
    tracking_number: null,
    shipped_date: null,
    internal_notes: "初回取引。ラベルデータはバイヤー支給(承認済みPDFをファイルに保存)",
    created_at: "2026-06-25T05:00:00Z",
  },
  {
    id: "deal-2",
    deal_no: "DEAL-2026-0002",
    customer_id: "cust-2",
    status: "waiting_for_payment",
    currency: "USD",
    payment_terms: "100% advance payment before production and shipment",
    incoterms: "FOB Hakata",
    destination_country: "US",
    expected_ship_date: "2026-08-05",
    custom_packaging_fee: 0,
    packaging_fee_title: null,
    packaging_fee_desc: null,
    shipping_fee: 0,
    subtotal: 3900,
    total_amount: 3900,
    shipping_method: null,
    tracking_number: null,
    shipped_date: null,
    internal_notes: null,
    created_at: "2026-07-01T01:00:00Z",
  },
];

const dealItems: DealItem[] = [
  {
    id: "item-1",
    deal_id: "deal-1",
    product_id: "prod-1",
    description:
      'MATCHA NINJA "Imperial Ceremonial"\n2026 Spring 1st Flush Yame Matcha\n100g silver aluminum pouch',
    quantity: 200,
    unit: "pcs",
    unit_price: 38.0,
    amount: 7600,
  },
  {
    id: "item-2",
    deal_id: "deal-2",
    product_id: "prod-2",
    description:
      'MATCHA NINJA "Culinary Grade A"\n2026 Yame Matcha for food processing\n1kg aluminum bag',
    quantity: 200,
    unit: "pcs",
    unit_price: 19.5,
    amount: 3900,
  },
];

const documents: IssuedDocument[] = [];
const dealCartons: DealCarton[] = [];
const payments: Payment[] = [];
const dealFiles: (StoredFile & { deal_id: string })[] = [];
const productLots: ProductLot[] = [
  {
    id: "lot-1",
    product_id: "prod-1",
    lot_number: "MN-2026-0412",
    production_date: "2026-04-12",
    best_before: "2027-04-11",
    coa_file_path: null,
    coa_url: null,
    notes: "春一番茶。EU向けMRL検査済み",
  },
];
const seq: Record<string, number> = { CUST: 2, PROD: 2, DEAL: 2, PI: 0, CI: 0, PL: 0 };

const DOC_PREFIX: Record<DocType, string> = {
  quotation: "QT",
  proforma_invoice: "PI",
  commercial_invoice: "CI",
  packing_list: "PL",
};

function nextNo(type: string): string {
  seq[type] = (seq[type] ?? 0) + 1;
  return `${type}-2026-${String(seq[type]).padStart(4, "0")}`;
}

function withRefs(d: Deal): DealWithRefs {
  const customer = customers.find((c) => c.id === d.customer_id) ?? null;
  const items = dealItems.filter((i) => i.deal_id === d.id);
  const country = countries.find((c) => c.code === d.destination_country) ?? null;
  return { ...d, customer, items, country };
}

export const memoryRepo: DataRepo = {
  async getCountries() {
    return [...countries].sort((a, b) => a.code.localeCompare(b.code));
  },
  async getCountry(code) {
    return countries.find((c) => c.code === code) ?? null;
  },

  async getSettings() {
    return settings;
  },
  async updateSettings(patch) {
    Object.assign(settings, patch);
  },

  async listCustomers() {
    return customers.filter((c) => !c.is_archived);
  },
  async getCustomer(id) {
    return customers.find((c) => c.id === id) ?? null;
  },
  async createCustomer(input) {
    const c: Customer = {
      ...input,
      id: uid(),
      customer_no: nextNo("CUST"),
      is_archived: false,
      created_at: now(),
      updated_at: now(),
    };
    customers.push(c);
    return c.id;
  },
  async updateCustomer(id, patch) {
    const c = customers.find((x) => x.id === id);
    if (c) Object.assign(c, patch, { updated_at: now() });
  },

  async listProducts() {
    return products.filter((p) => !p.is_archived);
  },
  async getProduct(id) {
    return products.find((p) => p.id === id) ?? null;
  },
  async createProduct(input) {
    const p: Product = {
      ...input,
      id: uid(),
      product_no: nextNo("PROD"),
      is_archived: false,
    };
    products.push(p);
    return p.id;
  },
  async updateProduct(id, patch) {
    const p = products.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  },

  async listDeals(statusFilter) {
    const list = statusFilter
      ? deals.filter((d) => d.status === statusFilter)
      : deals;
    return list
      .map(withRefs)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async listDealsByCustomer(customerId) {
    return deals.filter((d) => d.customer_id === customerId).map(withRefs);
  },
  async getDeal(id) {
    const d = deals.find((x) => x.id === id);
    return d ? withRefs(d) : null;
  },
  async createDeal(input, item) {
    const country = countries.find((c) => c.code === input.destination_country);
    if (country?.status === "prohibited") {
      throw new Error(
        `${country.name_ja}は現在対応不可のため案件を作成できません(理由: ${country.summary ?? "-"})`
      );
    }
    const d: Deal = {
      ...input,
      id: uid(),
      deal_no: nextNo("DEAL"),
      status: "inquiry",
      shipping_method: null,
      tracking_number: null,
      shipped_date: null,
      created_at: now(),
    };
    deals.push(d);
    dealItems.push({ ...item, id: uid(), deal_id: d.id });
    return d.id;
  },
  async updateDealStatus(id, status: DealStatus) {
    const d = deals.find((x) => x.id === id);
    if (d) d.status = status;
  },

  async listDocuments(dealId) {
    return documents
      .filter((x) => x.deal_id === dealId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async getDocument(id) {
    return documents.find((x) => x.id === id) ?? null;
  },
  async issueDocument(dealId, docType, snapshotBase) {
    const docNumber = nextNo(DOC_PREFIX[docType]);
    const snapshot = { ...snapshotBase, docNumber } as DocSnapshot;
    const doc: IssuedDocument = {
      id: uid(),
      deal_id: dealId,
      doc_type: docType,
      doc_number: docNumber,
      revision: 0,
      issue_date: today(),
      data: snapshot,
      pdf_file_path: null,
      status: "issued",
      created_at: now(),
    };
    documents.push(doc);
    if (docType === "proforma_invoice") {
      const d = deals.find((x) => x.id === dealId);
      if (d && ["inquiry", "sample_sent", "quotation_sent"].includes(d.status)) {
        d.status = "pi_issued";
      }
    }
    if (docType === "quotation") {
      const d = deals.find((x) => x.id === dealId);
      if (d && ["inquiry", "sample_sent"].includes(d.status)) {
        d.status = "quotation_sent";
      }
    }
    return doc.id;
  },

  async updateDealShipping(id, patch) {
    const d = deals.find((x) => x.id === id);
    if (d) Object.assign(d, patch);
  },

  async listCartons(dealId) {
    return dealCartons
      .filter((c) => c.deal_id === dealId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  async saveCartons(dealId, rows) {
    for (let i = dealCartons.length - 1; i >= 0; i--) {
      if (dealCartons[i].deal_id === dealId) dealCartons.splice(i, 1);
    }
    rows.forEach((r) => dealCartons.push({ ...r, id: uid(), deal_id: dealId }));
  },

  async listPayments(dealId) {
    return payments
      .filter((p) => p.deal_id === dealId)
      .sort((a, b) => b.received_date.localeCompare(a.received_date));
  },
  async addPayment(dealId, input) {
    payments.push({ ...input, id: uid(), deal_id: dealId, created_at: now() });
  },

  async listFiles(dealId) {
    return dealFiles
      .filter((f) => f.deal_id === dealId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async uploadFile(dealId, input) {
    // デモ: data URL としてメモリ保持(本番はSupabase Storage+署名URL)
    dealFiles.push({
      id: uid(),
      deal_id: dealId,
      category: input.category,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: Math.round(input.base64.length * 0.75),
      created_at: now(),
      url: `data:${input.mimeType};base64,${input.base64}`,
    });
  },
  async deleteFile(dealId, fileId) {
    const i = dealFiles.findIndex((f) => f.id === fileId && f.deal_id === dealId);
    if (i >= 0) dealFiles.splice(i, 1);
  },

  async listLots(productId) {
    return productLots.filter((l) => l.product_id === productId);
  },
  async addLot(productId, input) {
    productLots.push({
      ...input,
      id: uid(),
      product_id: productId,
      coa_file_path: null,
      coa_url: null,
    });
  },
  async uploadLotCoa(productId, lotId, file) {
    const lot = productLots.find(
      (l) => l.id === lotId && l.product_id === productId
    );
    if (lot) {
      lot.coa_file_path = file.fileName;
      lot.coa_url = `data:${file.mimeType};base64,${file.base64}`;
    }
  },

  async dashboardCounts() {
    const active = deals.filter(
      (d) => d.status !== "completed" && d.status !== "cancelled"
    );
    return {
      activeDeals: active.length,
      waitingPayment: deals.filter((d) => d.status === "waiting_for_payment").length,
      inProduction: deals.filter((d) => d.status === "paid" || d.status === "repacking").length,
      readyToShip: deals.filter((d) => d.status === "ready_to_ship").length,
    };
  },
};
