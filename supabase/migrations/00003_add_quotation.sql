-- ============================================================
-- 見積書(Quotation)対応
-- 既存プロジェクトへの適用: この内容をSQL Editorに貼ってRun
-- ============================================================

-- documents に 'quotation' を許可
alter table documents drop constraint documents_doc_type_check;
alter table documents add constraint documents_doc_type_check
  check (doc_type in (
    'quotation', 'proforma_invoice', 'commercial_invoice', 'packing_list'
  ));

-- 採番に QT を追加(QT-2026-0001)
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
