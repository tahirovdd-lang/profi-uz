-- Public, read-only service prices for visible specialist profiles.
-- SECURITY DEFINER avoids profile RLS hiding public price data from customers.
-- Only published, enabled specialist profiles can be read.
create or replace function public.profi_public_service_prices(p_specialist_ids uuid[])
returns table(specialist_id uuid, service_key text, price bigint)
language sql stable security definer
set search_path = ''
as $$
 select sp.specialist_id, sp.service_key, sp.price
 from public.profi_specialist_service_prices sp
 join public.profiles p on p.id = sp.specialist_id
 where sp.specialist_id = any(coalesce(p_specialist_ids, array[]::uuid[]))
   and p.role = 'specialist'
   and coalesce(p.account_enabled,true)
   and sp.service_key = any(p.services)
 order by sp.specialist_id, sp.service_key
 limit 1000;
$$;
revoke all on function public.profi_public_service_prices(uuid[]) from public;
grant execute on function public.profi_public_service_prices(uuid[]) to anon, authenticated;
-- Do not grant any new write permissions: editing remains owner-only.
