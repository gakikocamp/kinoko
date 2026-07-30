-- ============================================================
-- 本番Supabaseへの更新まとめ(1回貼ってRunするだけ・何度実行しても安全)
--   SQL Editor → New query → 全部貼り付け → Run
--
--   含まれる更新:
--     ・見積書(Quotation)対応(QT-採番、documents制約)
--     ・スタッフ管理(profiles にメール列を追加)
-- ============================================================

-- ---- 見積書(Quotation)対応 --------------------------------
alter table documents drop constraint if exists documents_doc_type_check;
alter table documents add constraint documents_doc_type_check
  check (doc_type in (
    'quotation', 'proforma_invoice', 'commercial_invoice', 'packing_list'
  ));

create or replace function next_doc_number(p_type text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_year int := extract(year from (now() at time zone 'Asia/Tokyo'));
  v_num  int;
begin
  if p_type not in ('CUST', 'DEAL', 'QT', 'PI', 'CI', 'PL', 'PROD') then
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

-- ---- スタッフ管理: profiles にメール列 ----------------------
alter table profiles add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

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

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    v_role
  );
  return new;
end;
$$;
