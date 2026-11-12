-- Profi.UZ admin-only aggregate statistics; no order details or private contacts returned.
-- Run in Supabase SQL Editor after supabase/admin_profile_moderation.sql.
create or replace function public.profi_admin_order_stats()
returns table(total_orders bigint,active_orders bigint,completed_orders bigint,cancelled_orders bigint,total_users bigint,total_specialists bigint,verified_specialists bigint,pending_verifications bigint)
language plpgsql security definer set search_path=public as $stats$
begin
 if auth.uid() is null or not exists(select 1 from public.profi_admins a where a.user_id=auth.uid()) then
  raise exception 'Admin access required';
 end if;
 return query
 select
 (select count(*) from public.orders),
 (select count(*) from public.orders where status in ('open','in_progress')),
 (select count(*) from public.orders where status='completed'),
 (select count(*) from public.orders where status='cancelled'),
 (select count(*) from public.profiles),
 (select count(*) from public.profiles where role='specialist'),
 (select count(*) from public.profi_specialist_verifications where status='verified'),
 (select count(*) from public.profi_specialist_verifications where status='pending');
end;$stats$;
revoke all on function public.profi_admin_order_stats() from public,anon;
grant execute on function public.profi_admin_order_stats() to authenticated;
