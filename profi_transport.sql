-- Run in Supabase SQL Editor to activate intercity transport listings.
create table if not exists public.profi_transport (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('ride','request')),
 origin text not null check(char_length(origin) between 2 and 100),
 destination text not null check(char_length(destination) between 2 and 100),
 departure_date date not null,
 seats integer not null check(seats between 1 and 8),
 price_uzs bigint check(price_uzs is null or price_uzs between 0 and 100000000),
 contact text not null check(char_length(contact) between 7 and 100),
 note text not null default '' check(char_length(note)<=500),
 created_at timestamptz not null default now(),
 status text not null default 'active' check(status in ('active','closed')),
 constraint profi_transport_different_cities check(lower(origin)<>lower(destination))
);
create index if not exists profi_transport_lookup on public.profi_transport(status,departure_date,origin,destination);
create index if not exists profi_transport_user on public.profi_transport(user_id,created_at desc);
alter table public.profi_transport enable row level security;
grant select,insert,update on public.profi_transport to authenticated;
grant select on public.profi_transport to anon;
drop policy if exists transport_public_active on public.profi_transport;
create policy transport_public_active on public.profi_transport for select to anon,authenticated using (status='active' and departure_date>=current_date or user_id=(select auth.uid()));
drop policy if exists transport_owner_insert on public.profi_transport;
create policy transport_owner_insert on public.profi_transport for insert to authenticated with check(user_id=(select auth.uid()) and status='active' and departure_date>=current_date);
drop policy if exists transport_owner_update on public.profi_transport;
create policy transport_owner_update on public.profi_transport for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
-- Only allow owners to close listings; no editing price/contact after publishing.
revoke update on public.profi_transport from authenticated;
grant update(status) on public.profi_transport to authenticated;
