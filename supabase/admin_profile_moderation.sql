-- Profi.UZ admin moderation. Run in Supabase SQL Editor after required_full_names.sql.
-- IMPORTANT: Add the real admin's auth.users UUID to public.profi_admins manually.
create table if not exists public.profi_admins(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.profi_admins enable row level security;
revoke all on public.profi_admins from anon,authenticated;
alter table public.profiles add column if not exists account_enabled boolean not null default true;

-- Users cannot change their own moderation flag through direct profile updates.
create or replace function public.profi_protect_account_enabled()
returns trigger language plpgsql set search_path='' as $body$
begin
 if new.account_enabled is distinct from old.account_enabled and current_user <> 'postgres' then
  raise exception 'Only administrators can change account status';
 end if;
 return new;
end;$body$;
drop trigger if exists profi_protect_account_enabled on public.profiles;
create trigger profi_protect_account_enabled before update on public.profiles
for each row execute function public.profi_protect_account_enabled();

create or replace function public.profi_admin_list_profiles()
returns table(id uuid,display_name text,first_name text,last_name text,contact_email text,role text,account_enabled boolean)
language plpgsql security definer set search_path='' as $body$
begin
 if auth.uid() is null or not exists(select 1 from public.profi_admins a where a.user_id=auth.uid()) then
  raise exception 'Admin access required';
 end if;
 return query select p.id,p.display_name,p.first_name,p.last_name,p.contact_email,p.role::text,p.account_enabled
 from public.profiles p order by p.display_name nulls last limit 500;
end;$body$;
revoke all on function public.profi_admin_list_profiles() from public,anon;
grant execute on function public.profi_admin_list_profiles() to authenticated;

create or replace function public.profi_admin_set_profile_enabled(p_user_id uuid,p_enabled boolean)
returns void language plpgsql security definer set search_path='' as $body$
begin
 if auth.uid() is null or not exists(select 1 from public.profi_admins a where a.user_id=auth.uid()) then
  raise exception 'Admin access required';
 end if;
 if p_user_id=auth.uid() and p_enabled=false then raise exception 'Cannot block your own admin account'; end if;
 if p_enabled=false and exists(select 1 from public.profi_admins where user_id=p_user_id) then
  raise exception 'Cannot block another administrator';
 end if;
 update public.profiles set account_enabled=p_enabled where id=p_user_id;
 if not found then raise exception 'Profile not found'; end if;
end;$body$;
revoke all on function public.profi_admin_set_profile_enabled(uuid,boolean) from public,anon;
grant execute on function public.profi_admin_set_profile_enabled(uuid,boolean) to authenticated;

-- Public directory must never show disabled specialist accounts.
create or replace function public.directory_specialists(p_city text default null,p_category text default null,p_service text default null)
returns table(id uuid,display_name text,category text,city text,bio text,services text[],avatar_url text,portfolio_urls text[],experience_years integer,rating numeric,review_count bigint)
language sql security definer set search_path='' stable as $directory$
 select p.id,coalesce(nullif(concat_ws(' ',p.last_name,p.first_name),''),p.display_name),p.category,p.city,coalesce(p.public_bio,p.bio),p.services,p.avatar_url,p.portfolio_urls,p.experience_years,
 round(avg(r.rating)::numeric,1),count(r.id)
 from public.profiles p left join public.specialist_reviews r on r.specialist_id=p.id
 where p.role='specialist' and p.account_enabled=true
 and (p_city is null or p.city=p_city) and (p_category is null or p.category=p_category)
 and (p_service is null or p_service=any(p.services))
 group by p.id,p.display_name,p.first_name,p.last_name,p.category,p.city,p.public_bio,p.bio,p.services,p.avatar_url,p.portfolio_urls,p.experience_years
 order by avg(r.rating) desc nulls last,count(r.id) desc,p.display_name asc limit 200;
$directory$;
revoke all on function public.directory_specialists(text,text,text) from public;
grant execute on function public.directory_specialists(text,text,text) to anon,authenticated;

-- Assign admin manually, replacing the UUID with a real auth.users.id:
-- insert into public.profi_admins(user_id) values ('YOUR-ADMIN-USER-UUID');
-- Disabled profiles are hidden from the directory and blocked in the current UI.
-- For full API-level suspension across every endpoint, add checks to all existing
-- order/proposal/chat RPCs and RLS policies or use Supabase Auth admin ban.
