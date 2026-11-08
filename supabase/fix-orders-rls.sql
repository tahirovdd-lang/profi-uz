-- Profi.UZ: allow signed-in users (including specialists in client mode)
-- to create ONLY their own orders. Keep RLS enabled.
begin;

-- Repair missing profiles without modifying existing specialist profiles.
insert into public.profiles (id, display_name, phone, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), u.phone, 'client'
from auth.users u
where not exists (select 1 from public.profiles p where p.id=u.id);

alter table public.orders enable row level security;
drop policy if exists "orders_insert_client" on public.orders;
create policy "orders_insert_client" on public.orders
for insert to authenticated
with check (client_id = (select auth.uid()) and status = 'open');

-- Preserve owner-only access; no broad public write access.
drop policy if exists "orders_update_owner" on public.orders;
create policy "orders_update_owner" on public.orders
for update to authenticated
using (client_id = (select auth.uid()))
with check (client_id = (select auth.uid()));

grant select, insert, update on public.orders to authenticated;
commit;
