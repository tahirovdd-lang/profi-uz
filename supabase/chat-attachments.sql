-- Profi.UZ: private chat attachments (run in Supabase SQL Editor).
begin;
create table if not exists public.chat_attachments (
 id uuid primary key default gen_random_uuid(),
 proposal_id uuid not null references public.proposals(id) on delete cascade,
 message_id uuid references public.chat_messages(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 storage_path text not null unique,
 file_name text not null check (char_length(file_name) between 1 and 180),
 mime_type text not null,
 file_size bigint not null check (file_size between 1 and 10485760),
 created_at timestamptz not null default now()
);
create index if not exists chat_attachments_proposal_idx on public.chat_attachments(proposal_id,created_at);
alter table public.chat_attachments enable row level security;
create or replace function public.can_access_chat(p_proposal_id uuid, p_write boolean default false)
returns boolean language sql stable security definer set search_path = '' as $chat_acl$
 select exists(
 select 1 from public.proposals p join public.orders o on o.id=p.order_id
 where p.id=p_proposal_id and p.status='accepted'
 and (p.specialist_id=(select auth.uid()) or o.client_id=(select auth.uid()))
 and (not p_write or o.status='in_progress')
 );
$chat_acl$;
revoke all on function public.can_access_chat(uuid,boolean) from public,anon;
grant execute on function public.can_access_chat(uuid,boolean) to authenticated;
drop policy if exists chat_attachments_read on public.chat_attachments;
create policy chat_attachments_read on public.chat_attachments for select to authenticated
using(public.can_access_chat(proposal_id,false));
drop policy if exists chat_attachments_insert on public.chat_attachments;
create policy chat_attachments_insert on public.chat_attachments for insert to authenticated
with check(sender_id=(select auth.uid()) and public.can_access_chat(proposal_id,true)
 and storage_path like proposal_id::text || '/' || (select auth.uid())::text || '/%');
grant select,insert on public.chat_attachments to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profi-chat','profi-chat',false,10485760,
array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,
allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists profi_chat_storage_read on storage.objects;
create policy profi_chat_storage_read on storage.objects for select to authenticated
using(bucket_id='profi-chat' and public.can_access_chat(
 case when split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then split_part(name,'/',1)::uuid else null end,false));
drop policy if exists profi_chat_storage_upload on storage.objects;
create policy profi_chat_storage_upload on storage.objects for insert to authenticated
with check(bucket_id='profi-chat' and split_part(name,'/',2)=(select auth.uid())::text
 and public.can_access_chat(
 case when split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then split_part(name,'/',1)::uuid else null end,true));
commit;
notify pgrst,'reload schema';
