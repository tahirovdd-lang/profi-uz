-- Profi.UZ: persistent read receipts. Execute once in Supabase SQL Editor.
create table if not exists public.profi_chat_reads (
 proposal_id uuid not null references public.proposals(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 last_read_at timestamptz not null default now(),
 primary key (proposal_id,user_id)
);
alter table public.profi_chat_reads enable row level security;
grant select,insert,update on public.profi_chat_reads to authenticated;
drop policy if exists profi_chat_reads_select on public.profi_chat_reads;
create policy profi_chat_reads_select on public.profi_chat_reads for select to authenticated
using (user_id=(select auth.uid()) and exists (
 select 1 from public.proposals p join public.orders o on o.id=p.order_id
 where p.id=proposal_id and p.status='accepted' and
 (p.specialist_id=(select auth.uid()) or o.client_id=(select auth.uid()))
));
drop policy if exists profi_chat_reads_insert on public.profi_chat_reads;
create policy profi_chat_reads_insert on public.profi_chat_reads for insert to authenticated
with check (user_id=(select auth.uid()) and exists (
 select 1 from public.proposals p join public.orders o on o.id=p.order_id
 where p.id=proposal_id and p.status='accepted' and
 (p.specialist_id=(select auth.uid()) or o.client_id=(select auth.uid()))
));
drop policy if exists profi_chat_reads_update on public.profi_chat_reads;
create policy profi_chat_reads_update on public.profi_chat_reads for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
