-- Run once in Supabase SQL Editor for Profi.UZ.
-- Favorites belong to authenticated users, including clients and specialists.
create table if not exists public.profi_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  specialist_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, specialist_id)
);
create index if not exists profi_favorites_specialist_idx on public.profi_favorites(specialist_id);
alter table public.profi_favorites enable row level security;
drop policy if exists "favorites_select_own" on public.profi_favorites;
create policy "favorites_select_own" on public.profi_favorites for select to authenticated using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.profi_favorites;
create policy "favorites_insert_own" on public.profi_favorites for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "favorites_delete_own" on public.profi_favorites;
create policy "favorites_delete_own" on public.profi_favorites for delete to authenticated using (auth.uid() = user_id);
grant select,insert,delete on public.profi_favorites to authenticated;
