-- Run once in Supabase SQL Editor before using precise service matching.
-- Existing orders without service_key remain visible to specialists of their category.
alter table public.profiles add column if not exists services text[] not null default '{}';
alter table public.orders add column if not exists service_key text;
create index if not exists orders_service_match_idx on public.orders (city,category,service_key) where status='open';
create or replace function public.register_as_specialist(p_name text,p_category text,p_bio text,p_phone text,p_city text,p_services text[])
returns void language plpgsql security definer set search_path = '' as $register_services$
declare uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Sign in first'; end if;
 if char_length(trim(coalesce(p_name,''))) not between 2 and 70 then raise exception 'Invalid name'; end if;
 if char_length(trim(coalesce(p_category,''))) not between 2 and 100 then raise exception 'Invalid category'; end if;
 if char_length(coalesce(p_bio,''))>500 or char_length(coalesce(p_phone,''))>30 then raise exception 'Invalid profile length'; end if;
 if char_length(trim(coalesce(p_city,''))) not between 2 and 100 then raise exception 'Choose a city'; end if;
 if coalesce(array_length(p_services,1),0) not between 1 and 40 then raise exception 'Select at least one service'; end if;
 if exists(select 1 from unnest(p_services) s where length(trim(s)) not between 2 and 120) then raise exception 'Invalid service'; end if;
 insert into public.profiles(id,display_name,role,category,bio,phone,city,services)
 values(uid,trim(p_name),'specialist',trim(p_category),coalesce(p_bio,''),nullif(trim(coalesce(p_phone,'')),''),trim(p_city),p_services)
 on conflict(id) do update set display_name=excluded.display_name,role='specialist',category=excluded.category,bio=excluded.bio,phone=excluded.phone,city=excluded.city,services=excluded.services;
end;
$register_services$;
revoke all on function public.register_as_specialist(text,text,text,text,text,text[]) from public,anon;
grant execute on function public.register_as_specialist(text,text,text,text,text,text[]) to authenticated;
-- The client may create orders with a specific service, but cannot change other users' orders.
-- Existing orders RLS policies remain enabled and unchanged.
