-- Profi.UZ specialist account controls.
-- Run in Supabase SQL Editor. Pause preserves profile, verification and orders.
create table if not exists public.profi_specialist_visibility (
 specialist_id uuid primary key references public.profiles(id) on delete cascade,
 paused boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.profi_specialist_visibility enable row level security;
revoke all on public.profi_specialist_visibility from anon,authenticated;
grant select on public.profi_specialist_visibility to anon,authenticated;
drop policy if exists specialist_visibility_read on public.profi_specialist_visibility;
create policy specialist_visibility_read on public.profi_specialist_visibility
for select to anon,authenticated using(true);

create or replace function public.profi_set_my_specialist_paused(p_paused boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(
  select 1 from public.profiles p where p.id=auth.uid() and p.role='specialist'
 ) then raise exception 'Specialist authentication required'; end if;
 insert into public.profi_specialist_visibility(specialist_id,paused,updated_at)
 values(auth.uid(),coalesce(p_paused,false),now())
 on conflict(specialist_id) do update set paused=excluded.paused,updated_at=now();
end $$;
revoke all on function public.profi_set_my_specialist_paused(boolean) from public,anon;
grant execute on function public.profi_set_my_specialist_paused(boolean) to authenticated;

-- Deletes the signed-in user's Auth account and all records with ON DELETE CASCADE.
-- If dependent orders or records restrict deletion, the transaction fails safely.
-- No administrator may delete someone else's account via this function.
create or replace function public.profi_delete_my_account(p_confirmation text)
returns void language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 v_id:=auth.uid();
 if v_id is null or p_confirmation <> 'DELETE MY ACCOUNT' then
  raise exception 'Authentication and explicit confirmation required';
 end if;
 if not exists(select 1 from public.profiles p where p.id=v_id and p.role='specialist') then
  raise exception 'Specialist account required';
 end if;
 -- Protect administrators from inadvertently destroying the site's administrator account.
 if exists(select 1 from public.profiles p where p.id=v_id and p.role='admin') then
  raise exception 'Administrator account deletion is not supported here';
 end if;
 delete from auth.users where id=v_id;
 if not found then raise exception 'Account not found'; end if;
end $$;
revoke all on function public.profi_delete_my_account(text) from public,anon;
grant execute on function public.profi_delete_my_account(text) to authenticated;
