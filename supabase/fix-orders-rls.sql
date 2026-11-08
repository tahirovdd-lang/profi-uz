-- Profi.UZ: repair missing profiles and keep order ownership protected.
-- Execute once in Supabase SQL Editor (GitHub Pages cannot run SQL migrations).
begin;
insert into public.profiles (id, display_name, phone, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name',''), u.phone, 'client'
from auth.users u
where not exists (select 1 from public.profiles p where p.id=u.id);

drop policy if exists "orders_insert_client" on public.orders;
create policy "orders_insert_client" on public.orders
for insert to authenticated
with check (
  client_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'client'
  )
);
commit;
