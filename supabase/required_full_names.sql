-- Profi.UZ: first name + last name in a shared profile for website and apps.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;

-- Existing users must complete both fields at their next sign-in.
-- Only authenticated owners can set their own names through this function.
create or replace function public.set_my_full_name(p_first_name text,p_last_name text)
returns void language plpgsql security definer set search_path='' as $fn$
declare f text:=btrim(coalesce(p_first_name,''));l text:=btrim(coalesce(p_last_name,''));
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 if char_length(f) not between 2 and 70 or char_length(l) not between 2 and 70
 or f !~ '^[[:alpha:]][[:alpha:] ''-]*[[:alpha:]]$'
 or l !~ '^[[:alpha:]][[:alpha:] ''-]*[[:alpha:]]$' then
 raise exception 'First and last name are required'; end if;
 insert into public.profiles(id,role,first_name,last_name,display_name)
 values(auth.uid(),'client',f,l,l||' '||f)
 on conflict(id) do update set first_name=excluded.first_name,last_name=excluded.last_name,display_name=excluded.display_name;
end;$fn$;
revoke all on function public.set_my_full_name(text,text) from public,anon;
grant execute on function public.set_my_full_name(text,text) to authenticated;

-- Keep names synchronized for all newly created auth users, regardless of provider.
create or replace function public.profi_sync_auth_names()
returns trigger language plpgsql security definer set search_path='' as $trigger$
declare f text:=nullif(btrim(new.raw_user_meta_data->>'first_name'),'');l text:=nullif(btrim(new.raw_user_meta_data->>'last_name'),'');
begin
 if f is not null and l is not null then
  insert into public.profiles(id,role,first_name,last_name,display_name)
  values(new.id,'client',f,l,l||' '||f)
  on conflict(id) do update set first_name=excluded.first_name,last_name=excluded.last_name,display_name=excluded.display_name;
 end if;
 return new;
end;$trigger$;
drop trigger if exists profi_auth_names_sync on auth.users;
create trigger profi_auth_names_sync after insert on auth.users
for each row execute function public.profi_sync_auth_names();

-- Public specialist names come from verified profile fields rather than Telegram nicknames.
create or replace function public.directory_specialists(p_city text default null,p_category text default null,p_service text default null)
returns table(id uuid,display_name text,category text,city text,bio text,services text[],avatar_url text,portfolio_urls text[],experience_years integer,rating numeric,review_count bigint)
language sql security definer set search_path='' stable as $directory$
 select p.id,coalesce(nullif(concat_ws(' ',p.last_name,p.first_name),''),p.display_name),p.category,p.city,coalesce(p.public_bio,p.bio),p.services,p.avatar_url,p.portfolio_urls,p.experience_years,
 round(avg(r.rating)::numeric,1),count(r.id)
 from public.profiles p left join public.specialist_reviews r on r.specialist_id=p.id
 where p.role='specialist' and (p_city is null or p.city=p_city)
 and (p_category is null or p.category=p_category)
 and (p_service is null or p_service=any(p.services))
 group by p.id,p.display_name,p.first_name,p.last_name,p.category,p.city,p.public_bio,p.bio,p.services,p.avatar_url,p.portfolio_urls,p.experience_years
 order by avg(r.rating) desc nulls last,count(r.id) desc,p.display_name asc limit 200;
$directory$;
revoke all on function public.directory_specialists(text,text,text) from public;
grant execute on function public.directory_specialists(text,text,text) to anon,authenticated;
