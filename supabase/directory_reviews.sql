-- Profi.UZ: public specialist directory, portfolio and verified reviews.
-- Run after specialist_services.sql. RLS stays enabled.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists portfolio_urls text[] not null default '{}';
alter table public.profiles add column if not exists experience_years integer;
alter table public.profiles add column if not exists public_bio text;
create table if not exists public.specialist_reviews(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.orders(id) on delete cascade,
 specialist_id uuid not null references auth.users(id),
 client_id uuid not null references auth.users(id),
 rating integer not null check(rating between 1 and 5),
 body text not null default '' check(char_length(body)<=1000),
 created_at timestamptz not null default now()
);
create index if not exists specialist_reviews_specialist_idx on public.specialist_reviews(specialist_id);
alter table public.specialist_reviews enable row level security;
drop policy if exists specialist_reviews_read on public.specialist_reviews;
create policy specialist_reviews_read on public.specialist_reviews for select to anon,authenticated using(true);
-- Reviews are inserted only by the secure function below; never directly edited or deleted.
revoke all on public.specialist_reviews from anon,authenticated;
grant select on public.specialist_reviews to anon,authenticated;
create or replace function public.submit_specialist_review(p_order_id uuid,p_rating integer,p_body text)
returns void language plpgsql security definer set search_path='' as $review$
declare v_specialist uuid;
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 if p_rating not between 1 and 5 or char_length(coalesce(p_body,''))>1000 then raise exception 'Invalid review'; end if;
 select p.specialist_id into v_specialist
 from public.orders o join public.proposals p on p.order_id=o.id and p.status='accepted'
 where o.id=p_order_id and o.client_id=auth.uid() and o.status='completed';
 if v_specialist is null then raise exception 'Only completed orders can be reviewed'; end if;
 insert into public.specialist_reviews(order_id,specialist_id,client_id,rating,body)
 values(p_order_id,v_specialist,auth.uid(),p_rating,trim(coalesce(p_body,'')));
end;
$review$;
revoke all on function public.submit_specialist_review(uuid,integer,text) from public,anon;
grant execute on function public.submit_specialist_review(uuid,integer,text) to authenticated;
-- Directory exposes public profile fields only, never phone or email.
create or replace function public.directory_specialists(p_city text default null,p_category text default null,p_service text default null)
returns table(id uuid,display_name text,category text,city text,bio text,services text[],avatar_url text,portfolio_urls text[],experience_years integer,rating numeric,review_count bigint)
language sql security definer set search_path='' stable as $directory$
 select p.id,p.display_name,p.category,p.city,coalesce(p.public_bio,p.bio),p.services,p.avatar_url,p.portfolio_urls,p.experience_years,
 round(avg(r.rating)::numeric,1),count(r.id)
 from public.profiles p left join public.specialist_reviews r on r.specialist_id=p.id
 where p.role='specialist'
 and (p_city is null or p.city=p_city)
 and (p_category is null or p.category=p_category)
 and (p_service is null or p_service=any(p.services))
 group by p.id,p.display_name,p.category,p.city,p.public_bio,p.bio,p.services,p.avatar_url,p.portfolio_urls,p.experience_years
 order by avg(r.rating) desc nulls last,count(r.id) desc,p.display_name asc
 limit 200;
$directory$;
revoke all on function public.directory_specialists(text,text,text) from public;
grant execute on function public.directory_specialists(text,text,text) to anon,authenticated;
create or replace function public.update_specialist_public_profile(p_avatar text,p_portfolio text[],p_experience integer,p_bio text)
returns void language plpgsql security definer set search_path='' as $public_profile$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='specialist') then raise exception 'Specialist account required'; end if;
 if p_experience is not null and p_experience not between 0 and 70 then raise exception 'Invalid experience'; end if;
 if char_length(coalesce(p_bio,''))>1000 then raise exception 'Description too long'; end if;
 if coalesce(array_length(p_portfolio,1),0)>8 then raise exception 'Too many portfolio items'; end if;
 if p_avatar is not null and (length(p_avatar)>500 or p_avatar !~ '^https://') then raise exception 'Avatar must be HTTPS'; end if;
 if exists(select 1 from unnest(coalesce(p_portfolio,'{}'::text[])) u where length(u)>500 or u !~ '^https://') then raise exception 'Portfolio must be HTTPS'; end if;
 update public.profiles set avatar_url=p_avatar,portfolio_urls=coalesce(p_portfolio,'{}'::text[]),experience_years=p_experience,public_bio=trim(coalesce(p_bio,'')) where id=auth.uid();
end;
$public_profile$;
revoke all on function public.update_specialist_public_profile(text,text[],integer,text) from public,anon;
grant execute on function public.update_specialist_public_profile(text,text[],integer,text) to authenticated;
