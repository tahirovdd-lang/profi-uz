-- Profi.UZ | Samarkand MVP | Supabase PostgreSQL
-- Run in Supabase SQL Editor. All customer data protected by RLS.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role text not null default 'client' check(role in ('client','specialist')),
 phone text,
 city text not null default 'Samarkand' check(city='Samarkand'),
 language text not null default 'ru' check(language in ('ru','uz','tj')),
 bio text not null default '',
 category text,
 created_at timestamptz not null default now()
);

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.profiles(id) on delete cascade,
 category text not null,
 description text not null check(char_length(description) between 5 and 2000),
 city text not null default 'Samarkand' check(city='Samarkand'),
 status text not null default 'open' check(status in ('open','in_progress','completed','cancelled')),
 created_at timestamptz not null default now()
);

create table if not exists public.proposals (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 specialist_id uuid not null references public.profiles(id) on delete cascade,
 message text not null check(char_length(message) between 5 and 1000),
 price_uzs bigint check(price_uzs >= 0),
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(),
 unique(order_id,specialist_id)
);

create index if not exists orders_city_status_created_idx on public.orders(city,status,created_at desc);
create index if not exists proposals_order_idx on public.proposals(order_id);
create index if not exists proposals_specialist_idx on public.proposals(specialist_id);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.proposals enable row level security;

-- A user can create and edit only their own profile.
create policy "profiles_read_self" on public.profiles for select to authenticated using(id=auth.uid());
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

-- Clients own their orders; authenticated specialists can browse open orders.
create policy "orders_read" on public.orders for select to authenticated
using(client_id=auth.uid() or (status='open' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='specialist')) or exists(select 1 from public.proposals x where x.order_id=id and x.specialist_id=auth.uid()));
create policy "orders_insert_client" on public.orders for insert to authenticated
with check(client_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='client'));
create policy "orders_update_owner" on public.orders for update to authenticated
using(client_id=auth.uid()) with check(client_id=auth.uid());
create policy "orders_delete_owner" on public.orders for delete to authenticated using(client_id=auth.uid());

-- Proposals are visible only to the specialist who sent them and the order owner.
create policy "proposals_read_participants" on public.proposals for select to authenticated
using(specialist_id=auth.uid() or exists(select 1 from public.orders o where o.id=order_id and o.client_id=auth.uid()));
create policy "proposals_insert_specialist" on public.proposals for insert to authenticated
with check(specialist_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='specialist') and exists(select 1 from public.orders o where o.id=order_id and o.status='open' and o.client_id<>auth.uid()));
create policy "proposals_update_client" on public.proposals for update to authenticated
using(exists(select 1 from public.orders o where o.id=order_id and o.client_id=auth.uid()))
with check(exists(select 1 from public.orders o where o.id=order_id and o.client_id=auth.uid()));

-- Protect role changes: users cannot elevate themselves to specialist without verification.\ncreate or replace function public.prevent_profile_role_change() returns trigger language plpgsql as $\nbegin\n if new.role is distinct from old.role then\n  raise exception 'Role changes require administrator verification';\n end if;\n return new;\nend; $;\ndrop trigger if exists protect_profile_role on public.profiles;\ncreate trigger protect_profile_role before update on public.profiles for each row execute function public.prevent_profile_role_change();\n\n-- Profile auto-creation after signup, with no trusted role derived from user metadata.
create or replace function public.create_new_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name,phone)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.phone)
 on conflict(id) do nothing;
 return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_new_profile();

-- Before production: enforce proposal status transitions in a trusted server function,
-- review role onboarding, add anti-spam controls and moderation.
