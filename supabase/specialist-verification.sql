-- Profi.UZ: additive specialist verification. Run manually in Supabase SQL Editor.
-- Existing profiles, orders, reports, chat and Telegram flows remain unchanged.
create table if not exists public.profi_specialist_verifications (
 specialist_id uuid primary key references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','verified','rejected')),
 note text not null default '' check (char_length(note)<=500),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id)
);
alter table public.profi_specialist_verifications enable row level security;
revoke all on public.profi_specialist_verifications from anon,authenticated;
grant select on public.profi_specialist_verifications to authenticated,anon;
drop policy if exists profi_verification_public_verified on public.profi_specialist_verifications;
create policy profi_verification_public_verified on public.profi_specialist_verifications
 for select to anon,authenticated using (status='verified' or specialist_id=(select auth.uid()));
-- Reuse the existing server-side admin authorization RPC. Never trust client-side role flags.
create or replace function public.profi_verification_admin()
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 perform public.profi_admin_list_profiles();
 return true;
exception when others then return false;
end $$;
revoke all on function public.profi_verification_admin() from public,anon;
grant execute on function public.profi_verification_admin() to authenticated;
drop policy if exists profi_verification_admin_read on public.profi_specialist_verifications;
create policy profi_verification_admin_read on public.profi_specialist_verifications
 for select to authenticated using (public.profi_verification_admin());
create or replace function public.profi_request_verification()
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='specialist' and account_enabled is distinct from false)
 then raise exception 'Specialist account required'; end if;
 insert into public.profi_specialist_verifications(specialist_id,status,note,requested_at,reviewed_at,reviewed_by)
 values(auth.uid(),'pending','',now(),null,null)
 on conflict(specialist_id) do update set status='pending',note='',requested_at=now(),reviewed_at=null,reviewed_by=null
 where public.profi_specialist_verifications.status='rejected';
end $$;
revoke all on function public.profi_request_verification() from public,anon;
grant execute on function public.profi_request_verification() to authenticated;
create or replace function public.profi_admin_list_verifications()
returns table(specialist_id uuid,display_name text,category text,city text,status text,requested_at timestamptz,note text)
language plpgsql security invoker set search_path=public as $
begin
 if not public.profi_verification_admin() then raise exception 'Not authorized'; end if;
 return query select v.specialist_id,p.display_name::text,p.category::text,p.city::text,v.status,v.requested_at,v.note
 from public.profi_specialist_verifications v join public.profiles p on p.id=v.specialist_id
 order by case v.status when 'pending' then 0 when 'verified' then 1 else 2 end,v.requested_at desc;
end $$;
revoke all on function public.profi_admin_list_verifications() from public,anon;
grant execute on function public.profi_admin_list_verifications() to authenticated;
grant update on public.profi_specialist_verifications to authenticated;
drop policy if exists profi_verification_admin_update on public.profi_specialist_verifications;
create policy profi_verification_admin_update on public.profi_specialist_verifications for update to authenticated
 using (public.profi_verification_admin()) with check (public.profi_verification_admin());
create or replace function public.profi_admin_decide_verification(p_specialist_id uuid,p_status text,p_note text default '')
returns void language plpgsql security invoker set search_path=public as $
begin
 if not public.profi_verification_admin() then raise exception 'Not authorized'; end if;
 if p_status not in ('verified','rejected') or char_length(coalesce(p_note,''))>500 then raise exception 'Invalid decision'; end if;
 update public.profi_specialist_verifications set status=p_status,note=coalesce(p_note,''),reviewed_at=now(),reviewed_by=auth.uid()
 where specialist_id=p_specialist_id and status='pending';
 if not found then raise exception 'Pending request not found'; end if;
end $$;
revoke all on function public.profi_admin_decide_verification(uuid,text,text) from public,anon;
grant execute on function public.profi_admin_decide_verification(uuid,text,text) to authenticated;
