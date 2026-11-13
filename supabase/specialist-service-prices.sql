-- Individual starting prices for services offered by a specialist.
-- Run after specialist-prices.sql.
create table if not exists public.profi_specialist_service_prices (
 specialist_id uuid not null references public.profiles(id) on delete cascade,
 service_key text not null check (length(service_key) between 1 and 120),
 price bigint not null check (price between 0 and 1000000000),
 updated_at timestamptz not null default now(),
 primary key (specialist_id, service_key)
);
create index if not exists profi_service_prices_specialist_idx on public.profi_specialist_service_prices(specialist_id);
alter table public.profi_specialist_service_prices enable row level security;
revoke all on public.profi_specialist_service_prices from anon;
grant select on public.profi_specialist_service_prices to anon, authenticated;
grant insert,update,delete on public.profi_specialist_service_prices to authenticated;
drop policy if exists service_prices_public_read on public.profi_specialist_service_prices;
create policy service_prices_public_read on public.profi_specialist_service_prices
for select to anon,authenticated using (
 exists (select 1 from public.profiles p where p.id=specialist_id and p.role='specialist' and coalesce(p.account_enabled,true))
);
drop policy if exists service_prices_own_insert on public.profi_specialist_service_prices;
create policy service_prices_own_insert on public.profi_specialist_service_prices
for insert to authenticated with check (
 specialist_id=(select auth.uid())
 and exists (select 1 from public.profiles p where p.id=specialist_id and p.role='specialist' and service_key=any(p.services))
);
drop policy if exists service_prices_own_update on public.profi_specialist_service_prices;
create policy service_prices_own_update on public.profi_specialist_service_prices
for update to authenticated using (specialist_id=(select auth.uid()))
with check (specialist_id=(select auth.uid()) and exists (
 select 1 from public.profiles p where p.id=specialist_id and service_key=any(p.services)
));
drop policy if exists service_prices_own_delete on public.profi_specialist_service_prices;
create policy service_prices_own_delete on public.profi_specialist_service_prices
for delete to authenticated using (specialist_id=(select auth.uid()));
