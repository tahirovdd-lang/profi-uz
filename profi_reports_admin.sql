-- Apply AFTER profi_reports.sql and the existing profile-administration SQL.
-- Authorization is delegated to the existing admin-only RPC, which must reject non-admin users.
-- Verify that profi_admin_list_profiles() cannot be executed successfully by non-admin users.
create or replace function public.profi_reports_is_admin()
returns boolean language plpgsql stable security invoker set search_path = public
as $$
begin
 perform public.profi_admin_list_profiles();
 return true;
exception when others then
 return false;
end;
$$;
revoke all on function public.profi_reports_is_admin() from public,anon;
grant execute on function public.profi_reports_is_admin() to authenticated;
grant select,update on public.profi_reports to authenticated;
drop policy if exists profi_reports_admin_read on public.profi_reports;
create policy profi_reports_admin_read on public.profi_reports for select to authenticated using (public.profi_reports_is_admin());
drop policy if exists profi_reports_admin_update on public.profi_reports;
create policy profi_reports_admin_update on public.profi_reports for update to authenticated using (public.profi_reports_is_admin()) with check (public.profi_reports_is_admin());
-- RLS restricts updates to verified administrators; direct updates are also admin-only.
create or replace function public.profi_admin_decide_report(p_report_id uuid,p_status text,p_block_specialist boolean default false)
returns void language plpgsql security invoker set search_path=public
as $$
declare v_specialist uuid;
begin
 if not public.profi_reports_is_admin() then raise exception 'Not authorized'; end if;
 if p_status not in ('reviewing','resolved','dismissed') then raise exception 'Invalid status'; end if;
 -- RLS enforces admin-only UPDATE permissions.
 select specialist_id into v_specialist from public.profi_reports where id=p_report_id;
 if v_specialist is null then raise exception 'Report not found'; end if;
 update public.profi_reports set status=p_status,reviewed_at=case when p_status in ('resolved','dismissed') then now() else null end where id=p_report_id;
 if p_block_specialist then
  perform public.profi_admin_set_profile_enabled(v_specialist,false);
 end if;
end;
$$;
-- Keep SECURITY INVOKER so the caller is always checked by RLS and the existing admin RPC.
revoke all on function public.profi_admin_decide_report(uuid,text,boolean) from public,anon;
grant execute on function public.profi_admin_decide_report(uuid,text,boolean) to authenticated;
