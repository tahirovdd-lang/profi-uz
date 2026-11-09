-- Run in Supabase SQL Editor before enabling the Profi.UZ complaint form.
-- Each complaint belongs to its author; public clients cannot read other complaints.
create table if not exists public.profi_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 specialist_id uuid not null references public.profiles(id) on delete cascade,
 reason text not null check (reason in ('spam','fraud','abuse','other')),
 details text not null check (char_length(btrim(details)) between 10 and 1000),
 status text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 constraint no_self_report check (reporter_id <> specialist_id)
);
create index if not exists profi_reports_reporter_idx on public.profi_reports(reporter_id,created_at desc);
create index if not exists profi_reports_status_idx on public.profi_reports(status,created_at desc);
alter table public.profi_reports enable row level security;
revoke all on public.profi_reports from anon;
grant select,insert on public.profi_reports to authenticated;
drop policy if exists profi_reports_own_read on public.profi_reports;
create policy profi_reports_own_read on public.profi_reports for select to authenticated using (reporter_id = (select auth.uid()));
drop policy if exists profi_reports_own_insert on public.profi_reports;
create policy profi_reports_own_insert on public.profi_reports for insert to authenticated with check (reporter_id = (select auth.uid()) and status = 'pending' and reviewed_at is null);
-- Updates, deletions and administrator review require separately secured server-side functions.
