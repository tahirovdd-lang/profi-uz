-- Optional specialist starting price, kept separate from existing profiles and order schema.
create table if not exists public.profi_specialist_prices (
 specialist_id uuid primary key references public.profiles(id) on delete cascade,
 starting_price bigint not null check (starting_price between 0 and 1000000000),
 updated_at timestamptz not null default now()
);
alter table public.profi_specialist_prices enable row level security;
revoke all on public.profi_specialist_prices from anon;
grant select on public.profi_specialist_prices to anon, authenticated;
grant insert,update,delete on public.profi_specialist_prices to authenticated;
drop policy if exists specialist_prices_read on public.profi_specialist_prices;
create policy specialist_prices_read on public.profi_specialist_prices for select to anon,authenticated using (
 exists(select 1 from public.profiles p where p.id=specialist_id and p.role='specialist' and coalesce(p.account_enabled,true))
);
drop policy if exists specialist_prices_insert on public.profi_specialist_prices;
create policy specialist_prices_insert on public.profi_specialist_prices for insert to authenticated with check (
 specialist_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=specialist_id and p.role='specialist')
);
drop policy if exists specialist_prices_update on public.profi_specialist_prices;
create policy specialist_prices_update on public.profi_specialist_prices for update to authenticated using (specialist_id=(select auth.uid())) with check (specialist_id=(select auth.uid()));
drop policy if exists specialist_prices_delete on public.profi_specialist_prices;
create policy specialist_prices_delete on public.profi_specialist_prices for delete to authenticated using (specialist_id=(select auth.uid()));
