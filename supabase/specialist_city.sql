-- Profi.UZ: run in Supabase SQL Editor before testing specialist registration.
-- Adds city to specialist registration while preserving existing accounts and RLS.
create or replace function public.register_as_specialist(
 p_name text, p_category text, p_bio text, p_phone text, p_city text
) returns void language plpgsql security definer set search_path = '' as $specialist_city$
declare uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Sign in first'; end if;
 if char_length(trim(coalesce(p_name,''))) not between 2 and 70 then raise exception 'Name must be 2-70 characters'; end if;
 if char_length(trim(coalesce(p_category,''))) not between 2 and 100 then raise exception 'Invalid category'; end if;
 if char_length(coalesce(p_bio,'')) > 500 or char_length(coalesce(p_phone,'')) > 30 then raise exception 'Invalid profile length'; end if;
 if char_length(trim(coalesce(p_city,''))) not between 2 and 100 then raise exception 'Choose a city'; end if;
 insert into public.profiles(id,display_name,role,category,bio,phone,city)
 values(uid,trim(p_name),'specialist',trim(p_category),coalesce(p_bio,''),nullif(trim(coalesce(p_phone,'')),''),trim(p_city))
 on conflict(id) do update set
 display_name=excluded.display_name,role='specialist',category=excluded.category,
 bio=excluded.bio,phone=excluded.phone,city=excluded.city;
end;
$specialist_city$;
revoke all on function public.register_as_specialist(text,text,text,text,text) from public,anon;
grant execute on function public.register_as_specialist(text,text,text,text,text) to authenticated;
