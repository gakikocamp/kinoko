import type {
  CiSnapshot,
  CompanySettings,
  Country,
  Customer,
  Deal,
  DealCarton,
  DealItem,
  DealStatus,
  DocType,
  FileCategory,
  IssuedDocument,
  Payment,
  PiSnapshot,
  PlSnapshot,
  Product,
  ProductLot,
  QtSnapshot,
  StoredFile,
} from "../types";

export type AnySnapshotBase =
  | Omit<QtSnapshot, "docNumber">
  | Omit<PiSnapshot, "docNumber">
  | Omit<CiSnapshot, "docNumber">
  | Omit<PlSnapshot, "docNumber">;

export type DealCartonInput = Omit<DealCarton, "id" | "deal_id">;

export type PaymentInput = Omit<Payment, "id" | "deal_id" | "created_at">;

export type UploadInput = {
  category: FileCategory;
  fileName: string;
  mimeType: string;
  /** ファイル内容(base64)。20MB上限はアクション層で検証 */
  base64: string;
};

export type LotInput = {
  lot_number: string;
  production_date: string | null;
  best_before: string | null;
  notes: string | null;
};

export type DealWithRefs = Deal & {
  customer: Customer | null;
  items: DealItem[];
  country: Country | null;
};

export type CustomerInput = Omit<
  Customer,
  "id" | "customer_no" | "is_archived" | "created_at" | "updated_at"
>;
export type ProductInput = Omit<Product, "id" | "product_no" | "is_archived">;
export type DealInput = Omit<
  Deal,
  | "id"
  | "deal_no"
  | "status"
  | "shipping_method"
  | "tracking_number"
  | "shipped_date"
  | "created_at"
>;
export type DealItemInput = Omit<DealItem, "id" | "deal_id">;

/**
 * データアクセス層。
 * 本番: supabase.ts(Supabase/PostgreSQL) / デモ: memory.ts(DEMO_MODE=1)
 */
export interface DataRepo {
  getCountries(): Promise<Country[]>;
  getCountry(code: string): Promise<Country | null>;

  getSettings(): Promise<CompanySettings>;
  updateSettings(patch: Partial<CompanySettings>): Promise<void>;

  listCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  createCustomer(input: CustomerInput): Promise<string>;
  updateCustomer(id: string, patch: Partial<CustomerInput>): Promise<void>;

  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(input: ProductInput): Promise<string>;
  updateProduct(id: string, patch: Partial<ProductInput>): Promise<void>;

  listDeals(statusFilter?: DealStatus): Promise<DealWithRefs[]>;
  listDealsByCustomer(customerId: string): Promise<DealWithRefs[]>;
  getDeal(id: string): Promise<DealWithRefs | null>;
  /** 🔴対応不可の国はErrorを投げる(docs/07 §1) */
  createDeal(input: DealInput, item: DealItemInput): Promise<string>;
  updateDealStatus(id: string, status: DealStatus): Promise<void>;

  listDocuments(dealId: string): Promise<IssuedDocument[]>;
  getDocument(id: string): Promise<IssuedDocument | null>;
  /**
   * 書類発行(PI/CI/PL): 採番+スナップショット保存。docNumberはリポジトリ側で確定。
   * PI発行時のみ、商談中の案件を pi_issued に進める。
   */
  issueDocument(
    dealId: string,
    docType: DocType,
    snapshotBase: AnySnapshotBase
  ): Promise<string>;

  /** 発送情報の更新(CI発行時) */
  updateDealShipping(
    id: string,
    patch: { shipping_method: string | null; tracking_number: string | null }
  ): Promise<void>;

  /** Packing List用カートン明細(全置換で保存) */
  listCartons(dealId: string): Promise<DealCarton[]>;
  saveCartons(dealId: string, rows: DealCartonInput[]): Promise<void>;

  /** 入金記録 */
  listPayments(dealId: string): Promise<Payment[]>;
  addPayment(dealId: string, input: PaymentInput): Promise<void>;

  /** 案件ファイル(アップロード・一覧・削除) */
  listFiles(dealId: string): Promise<StoredFile[]>;
  uploadFile(dealId: string, input: UploadInput): Promise<void>;
  deleteFile(dealId: string, fileId: string): Promise<void>;

  /** LOT/COA管理 */
  listLots(productId: string): Promise<ProductLot[]>;
  addLot(productId: string, input: LotInput): Promise<void>;
  uploadLotCoa(
    productId: string,
    lotId: string,
    file: { fileName: string; mimeType: string; base64: string }
  ): Promise<void>;

  dashboardCounts(): Promise<{
    activeDeals: number;
    waitingPayment: number;
    inProduction: number;
    readyToShip: number;
  }>;
}
