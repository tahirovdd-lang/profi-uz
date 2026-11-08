-- Profi.UZ private chat migration. Run in Supabase SQL Editor.
-- Chat is enabled only after a proposal has been accepted.
create table if not exists public.chat_messages (
 id uuid primary key default gen_random_uuid(),
 proposal_id uuid not null references public.proposals(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists chat_messages_proposal_created_idx on public.chat_messages(proposal_id,created_at,id);
alter table public.chat_messages enable row level security;
drop policy if exists chat_messages_read_participants on public.chat_messages;
create policy chat_messages_read_participants on public.chat_messages for select to authenticated
using (
 exists (
  select 1 from public.proposals p
  join public.orders o on o.id=p.order_id
  where p.id=chat_messages.proposal_id and p.status='accepted'
  and (p.specialist_id=auth.uid() or o.client_id=auth.uid())
 )
);
drop policy if exists chat_messages_insert_participants on public.chat_messages;
create policy chat_messages_insert_participants on public.chat_messages for insert to authenticated
with check (
 sender_id=auth.uid() and exists (
  select 1 from public.proposals p
  join public.orders o on o.id=p.order_id
  where p.id=chat_messages.proposal_id and p.status='accepted'
  and o.status='in_progress'
  and (p.specialist_id=auth.uid() or o.client_id=auth.uid())
 )
);
grant select,insert on public.chat_messages to authenticated;
-- Security-definer membership check avoids circular RLS between orders and proposals.
create or replace function public.is_selected_specialist(p_order_id uuid)
returns boolean language sql stable security definer set search_path='' as $check$
 select exists(select 1 from public.proposals p where p.order_id=p_order_id and p.specialist_id=auth.uid() and p.status='accepted')
$check$;
revoke all on function public.is_selected_specialist(uuid) from public,anon;
grant execute on function public.is_selected_specialist(uuid) to authenticated;
-- Make accepted orders readable to their chosen specialist, not just open orders.
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated using(
 client_id=auth.uid()
 or (status='open' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='specialist'))
 or public.is_selected_specialist(orders.id)
);
notify pgrst, 'reload schema';
