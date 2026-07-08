-- ============================================================
-- 抹茶輸出販売管理アプリ 初期スキーマ
-- 設計: docs/02_database.md / docs/07_country_compliance.md / docs/08_security.md
-- ============================================================

-- ============================================================
-- ユーザー・権限
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'pending'
              check (role in ('admin', 'staff', 'viewer', 'pending')),
  created_at  timestamptz not null default now()
);

-- auth.users 作成時に profiles を自動作成。
-- ★防御: 最初の1人だけが自動で admin。2人目以降は 'pending'(何も見えない)。
--   万一Supabaseのサインアップ無効化を忘れて第三者が登録しても、
--   管理者が昇格させるまで一切のデータにアクセスできない(is_member() 参照)。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  select case when count(*) = 0 then 'admin' else 'pending' end
    into v_role
  from public.profiles;

  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), v_role);
  return new;
end;
$$;

-- adminか(security definerによりRLSを介さず判定 = profilesポリシーの再帰を回避)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 承認済みメンバーか(RLSの基準)。pending は false
create or replace function public.is_member()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'staff', 'viewer')
  );
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 自社情報(Exporter)— 単一行テーブル
-- ============================================================
create table company_settings (
  id                    int primary key default 1 check (id = 1),
  company_name          text not null default '',
  address               text not null default '',
  phone                 text,
  email                 text,
  representative_name   text,
  bank_details          text,
  wise_details          text,
  logo_path             text,
  signature_image_path  text,
  default_currency      text not null default 'USD',
  default_payment_terms text default '100% advance payment before production and shipment',
  updated_at            timestamptz not null default now()
);

insert into company_settings (id) values (1);

-- ============================================================
-- 仕向国マスタ(§07)
-- ============================================================
create table destination_countries (
  code             text primary key,
  name_en          text not null,
  name_ja          text not null,
  status           text not null default 'unverified'
                   check (status in ('ok', 'conditional', 'prohibited', 'unverified')),
  summary          text,
  requirements     jsonb not null default '[]',
  notes            text,
  last_reviewed_at date,
  reviewed_by      uuid references profiles (id),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- 顧客
-- ============================================================
create table customers (
  id                        uuid primary key default gen_random_uuid(),
  customer_no               text not null unique,
  company_name              text not null,
  contact_person            text,
  email                     text,
  phone                     text,
  country                   text references destination_countries (code),
  billing_address           text,
  shipping_address          text,
  vat_number                text,
  eori_number               text,
  import_license_notes      text,
  preferred_payment_method  text,
  sanctions_checked_at      date,          -- 制裁リスト確認日(§07-5)
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
  product_no         text not null unique,
  name               text not null,
  brand_name         text,
  grade              text,
  harvest_year       int,
  harvest_season     text,
  origin             text,
  country_of_origin  text not null default 'Japan',
  hs_code            text,
  unit_price         numeric(12,2),
  price_currency     text not null default 'USD',
  cost_price         numeric(12,2),   -- 社内のみ。PDF不可
  moq                int,
  packaging_type     text,
  description        text,
  internal_notes     text,            -- 社内のみ。PDF不可
  is_archived        boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table product_lots (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products (id),
  lot_number      text not null,
  production_date date,
  best_before     date,
  coa_file_path   text,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (product_id, lot_number)
);

-- ============================================================
-- 案件
-- ============================================================
create table deals (
  id                    uuid primary key default gen_random_uuid(),
  deal_no               text not null unique,
  customer_id           uuid not null references customers (id),
  status                text not null default 'inquiry' check (status in (
                          'inquiry', 'sample_sent', 'quotation_sent',
                          'pi_issued', 'waiting_for_payment', 'paid',
                          'repacking', 'ready_to_ship', 'shipped',
                          'completed', 'cancelled')),
  currency              text not null default 'USD',
  payment_terms         text,
  incoterms             text,
  destination_country   text references destination_countries (code),
  expected_ship_date    date,
  custom_packaging_fee  numeric(12,2) not null default 0,
  packaging_fee_title   text,
  packaging_fee_desc    text,
  shipping_fee          numeric(12,2) not null default 0,
  subtotal              numeric(12,2) not null default 0,
  total_amount          numeric(12,2) not null default 0,
  shipping_method       text,
  tracking_number       text,
  shipped_date          date,
  internal_notes        text,   -- 社内のみ。PDF不可
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table deal_items (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references deals (id) on delete cascade,
  product_id   uuid not null references products (id),
  lot_id       uuid references product_lots (id),
  description  text not null,
  quantity     numeric(12,2) not null,
  unit         text not null default 'pcs',
  unit_price   numeric(12,2) not null,
  amount       numeric(12,2) not null,
  sort_order   int not null default 0
);

create table deal_status_history (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references profiles (id),
  changed_at  timestamptz not null default now(),
  note        text
);

-- 社内原価メモ(このテーブルはPDF生成に一切使わない)
create table deal_processing_costs (
  id             uuid primary key default gen_random_uuid(),
  deal_id        uuid not null references deals (id) on delete cascade,
  item_name      text not null,
  estimated_cost numeric(12,2),
  notes          text,
  sort_order     int not null default 0
);

-- Packing List 用カートン明細
create table deal_cartons (
  id               uuid primary key default gen_random_uuid(),
  deal_id          uuid not null references deals (id) on delete cascade,
  deal_item_id     uuid references deal_items (id),
  carton_range     text,
  cartons_count    int not null,
  units_per_carton int not null,
  net_weight_kg    numeric(10,3),
  gross_weight_kg  numeric(10,3),
  length_cm        numeric(10,1),
  width_cm         numeric(10,1),
  height_cm        numeric(10,1),
  sort_order       int not null default 0
);

-- 仕向国要件チェックリスト(案件作成時に国マスタからコピー)
create table deal_compliance_checks (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals (id) on delete cascade,
  label       text not null,
  required    boolean not null default true,
  checked     boolean not null default false,
  checked_by  uuid references profiles (id),
  checked_at  timestamptz,
  sort_order  int not null default 0
);

-- ============================================================
-- 入金記録
-- ============================================================
create table payments (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references deals (id) on delete cascade,
  amount          numeric(12,2) not null,
  currency        text not null,
  received_date   date not null,
  method          text,
  proof_file_path text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 発行書類(PI / CI / PL)— 発行後は不変
-- ============================================================
create table documents (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deals (id),
  doc_type      text not null check (doc_type in
                  ('proforma_invoice', 'commercial_invoice', 'packing_list')),
  doc_number    text not null,
  revision      int not null default 0,
  issue_date    date not null,
  data          jsonb not null,
  pdf_file_path text,
  pdf_sha256    text,
  status        text not null default 'issued'
                check (status in ('issued', 'void')),
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now(),
  unique (doc_number, revision)
);

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
  doc_type    text not null,
  year        int  not null,
  last_number int  not null default 0,
  primary key (doc_type, year)
);

create or replace function next_doc_number(p_type text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_year int := extract(year from (now() at time zone 'Asia/Tokyo'));
  v_num  int;
begin
  if p_type not in ('CUST', 'DEAL', 'PI', 'CI', 'PL', 'PROD') then
    raise exception 'unknown doc_type: %', p_type;
  end if;

  insert into number_sequences as ns (doc_type, year, last_number)
  values (p_type, v_year, 1)
  on conflict (doc_type, year)
  do update set last_number = ns.last_number + 1
  returning last_number into v_num;

  return p_type || '-' || v_year || '-' || lpad(v_num::text, 4, '0');
end;
$$;

-- ============================================================
-- 監査ログ(INSERTのみ・§08-6)
-- ============================================================
create table audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles (id),
  action      text not null,
  table_name  text not null,
  record_id   text,
  changes     jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- RLS: 全テーブル有効化。
-- MVP: 認証済みユーザーは全操作可(将来 profiles.role でポリシーを分離 — §08-3)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'company_settings', 'destination_countries', 'customers',
    'products', 'product_lots', 'deals', 'deal_items', 'deal_status_history',
    'deal_processing_costs', 'deal_cartons', 'deal_compliance_checks',
    'payments', 'documents', 'deal_files', 'number_sequences', 'audit_logs'
  ]
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- 承認済みメンバー(is_member)への全操作許可(profiles / audit_logs 以外)。
-- 'pending' のユーザーは認証済みでも一切アクセス不可(防御の多層化)。
do $$
declare
  t text;
begin
  foreach t in array array[
    'company_settings', 'destination_countries', 'customers',
    'products', 'product_lots', 'deals', 'deal_items', 'deal_status_history',
    'deal_processing_costs', 'deal_cartons', 'deal_compliance_checks',
    'payments', 'documents', 'deal_files', 'number_sequences'
  ]
  loop
    execute format(
      'create policy "member_all" on %I for all to authenticated using (public.is_member()) with check (public.is_member())',
      t
    );
  end loop;
end $$;

-- profiles: 自分の行は誰でも読める(承認待ち画面の表示に必要)。
-- 他人の行はメンバーのみ。書き換えはadminのみ(将来のユーザー管理UI用)
create policy "profiles_select_own" on profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_select_member" on profiles
  for select to authenticated using (public.is_member());
create policy "profiles_admin_update" on profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 監査ログは INSERT と SELECT のみ(UPDATE/DELETE 不可 = 改ざん防止)
create policy "audit_insert" on audit_logs
  for insert to authenticated with check (public.is_member());
create policy "audit_select" on audit_logs
  for select to authenticated using (public.is_member());

-- ============================================================
-- Storage バケット(非公開・§02 / §08)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false),
       ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "member_storage_all" on storage.objects
  for all to authenticated
  using (bucket_id in ('attachments', 'documents') and public.is_member())
  with check (bucket_id in ('attachments', 'documents') and public.is_member());
