-- ============================================================
-- スタッフ管理: profiles にメールアドレスを持たせる
-- (管理画面でメールを一覧表示するため。auth.users を直接読まずに済む)
-- ============================================================

alter table profiles add column if not exists email text;

-- 既存ユーザーのメールを埋める
update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- 以後、新規ユーザー作成時にメールも自動保存(最初の1人=admin ルールは維持)
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
