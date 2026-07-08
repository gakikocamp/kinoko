# 02. データベース設計 (Supabase / PostgreSQL)

## ER概要

```
auth.users ─ profiles(role)

customers ──< deals >── (documents, deal_files, payments, deal_status_history)
products ──< product_lots
deals ──< deal_items >── products / product_lots
deals ──< deal_processing_costs   ← 社内原価(PDFに出さない)
deals ──< deal_cartons            ← Packing List用カートン明細
deals ──< deal_compliance_checks  ← 仕向国要件チェックリスト(§07)
destination_countries ──< deals   ← 国マスタ(輸出可否ステータス)(§07)
company_settings (単一行: 自社情報・銀行/Wise・署名)
number_sequences (自動採番カウンタ)
audit_logs (監査ログ・INSERTのみ)(§08)
```

設計方針:

- 主キーは `uuid`、業務上の番号(`CUST-2026-0001` 等)は別カラム(`customer_no` など)でUNIQUE管理。
- 顧客・商品は物理削除せず `is_archived` でアーカイブ(発行済み書類・過去案件との整合性維持)。
- 金額は `numeric(12,2)`、重量は `numeric(10,3)`。浮動小数点は使わない。
- 発行済み書類は `documents.data` (jsonb) にスナップショット保存し不変とする。

## DDL

```sql
-- ============================================================
-- ユーザー・権限
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        text not null default 'admin'
              check (role in ('admin', 'staff', 'viewer')),
  created_at  timestamptz not null default now()
);
-- MVPでは全員 admin。将来 staff/viewer をRLSポリシーで制御する。

-- ============================================================
-- 自社情報(Exporter)— 単一行テーブル
-- ============================================================
create table company_settings (
  id                    int primary key default 1 check (id = 1),
  company_name          text not null,
  address               text not null,
  phone                 text,
  email                 text,
  representative_name   text,          -- 署名欄の名前
  bank_details          text,          -- 銀行送金情報(複数行テキスト)
  wise_details          text,          -- Wise受取情報
  logo_path             text,          -- Storage パス
  signature_image_path  text,
  default_currency      text not null default 'USD',
  default_payment_terms text default '100% advance payment before production and shipment',
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- 顧客
-- ============================================================
create table customers (
  id                        uuid primary key default gen_random_uuid(),
  customer_no               text not null unique,   -- CUST-2026-0001
  company_name              text not null,
  contact_person            text,
  email                     text,
  phone                     text,
  country                   text,
  billing_address           text,   -- 請求先住所(全文)
  shipping_address          text,   -- 発送先住所(全文)
  vat_number                text,
  eori_number               text,
  import_license_notes      text,
  preferred_payment_method  text,   -- 例: Wise / T/T
  notes                     text,
  is_archived               boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- 商品・LOT
-- ============================================================
create table products (
  id                 uuid primary key default gen_random_uuid(),
  product_no         text not null unique,   -- PROD-0001(年なし連番)
  name               text not null,          -- 例: Imperial Ceremonial
  brand_name         text,                   -- 例: MATCHA NINJA
  grade              text,                   -- 例: Ceremonial
  harvest_year       int,                    -- 例: 2026
  harvest_season     text,                   -- 例: Spring 1st Flush
  origin             text,                   -- 例: Yame, Fukuoka, Japan
  country_of_origin  text not null default 'Japan',
  hs_code            text,                   -- 例: 0902.10(§05参照)
  unit_price         numeric(12,2),          -- 標準販売単価
  price_currency     text not null default 'USD',
  cost_price         numeric(12,2),          -- ★社内のみ。PDF不可
  moq                int,
  packaging_type     text,                   -- 例: 100g silver aluminum pouch
  description        text,                   -- PDF記載用の商品説明(英語)
  internal_notes     text,                   -- ★社内のみ。PDF不可
  is_archived        boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table product_lots (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products (id),
  lot_number      text not null,        -- 例: MN-2026-0412
  production_date date,
  best_before     date,
  coa_file_path   text,                 -- Storage パス(COA PDF)
  notes           text,
  created_at      timestamptz not null default now(),
  unique (product_id, lot_number)
);

-- ============================================================
-- 案件
-- ============================================================
create table deals (
  id                    uuid primary key default gen_random_uuid(),
  deal_no               text not null unique,   -- DEAL-2026-0001
  customer_id           uuid not null references customers (id),
  status                text not null default 'inquiry' check (status in (
                          'inquiry', 'sample_sent', 'quotation_sent',
                          'pi_issued', 'waiting_for_payment', 'paid',
                          'repacking', 'ready_to_ship', 'shipped',
                          'completed', 'cancelled')),
  currency              text not null default 'USD',
  payment_terms         text,
  incoterms             text,        -- 例: "FOB Fukuoka" / "DAP London"(場所込みで保存)
  destination_country   text references destination_countries (code),
                        -- 国マスタ(§07)を参照。🔴prohibited の国は案件作成をブロック、
                        -- ⚪unverified の国は PI発行をブロック(アプリ層+DBトリガで二重に防ぐ)
  expected_ship_date    date,
  -- 金額(明細合計はdeal_itemsから集計。以下は加算要素とキャッシュ)
  custom_packaging_fee  numeric(12,2) not null default 0,  -- 顧客向け加工費
  packaging_fee_title   text,        -- PDF見出し。例: Custom repacking & label application fee
  packaging_fee_desc    text,        -- PDF説明文(英語・複数行)
  shipping_fee          numeric(12,2) not null default 0,
  subtotal              numeric(12,2) not null default 0,  -- 明細合計+加工費
  total_amount          numeric(12,2) not null default 0,  -- subtotal+送料
  -- 発送情報(CI/追跡に使用)
  shipping_method       text,        -- 例: FedEx IP / EMS / Air freight
  tracking_number       text,
  shipped_date          date,
  internal_notes        text,        -- ★社内のみ。PDF不可
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table deal_items (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references deals (id) on delete cascade,
  product_id   uuid not null references products (id),
  lot_id       uuid references product_lots (id),   -- 出荷確定時に紐付け
  description  text not null,   -- PDF記載文(商品からコピー後、案件ごとに編集可)
  quantity     numeric(12,2) not null,
  unit         text not null default 'pcs',   -- pcs / kg / cartons
  unit_price   numeric(12,2) not null,
  amount       numeric(12,2) not null,        -- quantity × unit_price
  sort_order   int not null default 0
);
-- MVP画面は1案件1明細でよいが、テーブルは複数行前提(将来の複数商品注文に対応)。

create table deal_status_history (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references profiles (id),
  changed_at  timestamptz not null default now(),
  note        text
);

-- ============================================================
-- 加工費: 社内原価メモ(★このテーブルはPDF生成に一切使わない)
-- ============================================================
create table deal_processing_costs (
  id             uuid primary key default gen_random_uuid(),
  deal_id        uuid not null references deals (id) on delete cascade,
  item_name      text not null,        -- 例: Label printing / Heat sealing / Rework risk
  estimated_cost numeric(12,2),
  notes          text,
  sort_order     int not null default 0
);
-- 顧客向けの加工費(名目・説明・金額)は deals.packaging_fee_* に保持。
-- 「顧客に見せる情報」と「社内原価」をテーブルレベルで分離することで、
-- PDF生成コードが誤って原価を参照する事故を構造的に防ぐ。

-- ============================================================
-- Packing List 用カートン明細
-- ============================================================
create table deal_cartons (
  id               uuid primary key default gen_random_uuid(),
  deal_id          uuid not null references deals (id) on delete cascade,
  deal_item_id     uuid references deal_items (id),
  carton_range     text,             -- 例: "1-10"
  cartons_count    int not null,     -- 箱数
  units_per_carton int not null,     -- 1箱あたり入数
  net_weight_kg    numeric(10,3),    -- 1箱あたりNW
  gross_weight_kg  numeric(10,3),    -- 1箱あたりGW
  length_cm        numeric(10,1),
  width_cm         numeric(10,1),
  height_cm        numeric(10,1),
  sort_order       int not null default 0
);
-- 合計NW/GWはアプリ側で集計して表示・PDF出力する。

-- ============================================================
-- 入金記録
-- ============================================================
create table payments (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references deals (id) on delete cascade,
  amount          numeric(12,2) not null,
  currency        text not null,
  received_date   date not null,
  method          text,            -- Wise / T/T / PayPal 等
  proof_file_path text,            -- 入金証憑(Storageパス)
  notes           text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 発行書類(PI / CI / PL)
-- ============================================================
create table documents (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deals (id),
  doc_type      text not null check (doc_type in
                  ('proforma_invoice', 'commercial_invoice', 'packing_list')),
  doc_number    text not null unique,   -- PI-2026-0001 等
  revision      int not null default 0, -- 改訂版発行時に+1(番号は同一で "Rev.1" 表記)
  issue_date    date not null,
  data          jsonb not null,   -- ★発行時点の全記載内容スナップショット
  pdf_file_path text not null,    -- 生成PDFのStorageパス
  pdf_sha256    text,             -- 生成PDFのハッシュ(改ざん検知・§08)
  status        text not null default 'issued'
                check (status in ('issued', 'void')),
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now(),
  unique (doc_number, revision)
);
-- data(jsonb) には exporter情報・buyer情報・明細・金額・条件・銀行情報など
-- PDFに記載した内容をすべて保存する。以後マスタを編集しても書類は変わらない。

-- ============================================================
-- 案件ファイル
-- ============================================================
create table deal_files (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references deals (id) on delete cascade,
  category     text not null check (category in (
                 'pi_pdf', 'ci_pdf', 'pl_pdf', 'coa', 'product_label',
                 'payment_proof', 'shipping_receipt', 'tracking_doc',
                 'qc_photo', 'other')),
  file_name    text not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references profiles (id),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 自動採番
-- ============================================================
create table number_sequences (
  doc_type    text not null,   -- 'CUST' | 'DEAL' | 'PI' | 'CI' | 'PL'
  year        int  not null,
  last_number int  not null default 0,
  primary key (doc_type, year)
);

create or replace function next_doc_number(p_type text)
returns text
language plpgsql
as $$
declare
  v_year int := extract(year from (now() at time zone 'Asia/Tokyo'));
  v_num  int;
begin
  insert into number_sequences as ns (doc_type, year, last_number)
  values (p_type, v_year, 1)
  on conflict (doc_type, year)
  do update set last_number = ns.last_number + 1
  returning last_number into v_num;

  return p_type || '-' || v_year || '-' || lpad(v_num::text, 4, '0');
end;
$$;
-- 例: select next_doc_number('PI') → 'PI-2026-0001'
-- INSERT ... ON CONFLICT は行ロックにより同時実行でも重複しない。
-- 年が変わると自動的に 0001 から再スタート。
-- 番号は「発行確定時」にのみ採番する(プレビュー段階では採番しない=欠番防止)。

-- ============================================================
-- 仕向国コンプライアンス(定義・シードデータは §07 参照)
-- ============================================================
-- destination_countries    : 国マスタ(ISOコード・可否ステータス・要件チェックリスト・最終確認日)
-- deal_compliance_checks   : 案件ごとの要件チェック状況(案件作成時に国マスタからコピー)

-- ============================================================
-- 監査ログ(定義は §08 参照)
-- ============================================================
-- audit_logs : 全主要操作の記録。INSERTのみ許可(UPDATE/DELETE不可のRLS)
```

## RLS(Row Level Security)方針

- 全テーブルでRLS有効化。MVPは「認証済みユーザーは全操作可」のポリシー1本。
- 将来のロール分離時は `profiles.role` を参照するポリシーに差し替える
  (例: `viewer` はSELECTのみ、`staff` は `deal_processing_costs`・`cost_price` 参照不可、など)。
- Supabase Storage もバケットを `private` にし、認証済みユーザーのみ署名付きURLでアクセス。

## Storage バケット構成

```
attachments/                       (private)
  deals/{deal_id}/{category}/{uuid}_{filename}
  products/{product_id}/coa/{uuid}_{filename}
  company/logo.png, signature.png
documents/                         (private)
  {doc_type}/{doc_number}_rev{n}.pdf
```
