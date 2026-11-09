-- Run AFTER profi_transport.sql. Booking requests, driver confirmation and verified ratings.
create table if not exists public.profi_transport_bookings(
 id uuid primary key default gen_random_uuid(),
 ride_id uuid not null references public.profi_transport(id) on delete cascade,
 passenger_id uuid not null references auth.users(id) on delete cascade,
 seats integer not null check(seats between 1 and 8),
 status text not null default 'pending' check(status in ('pending','confirmed','rejected','cancelled','completed')),
 created_at timestamptz not null default now(),
 unique(ride_id,passenger_id)
);
create index if not exists transport_bookings_ride_idx on public.profi_transport_bookings(ride_id,status);
create index if not exists transport_bookings_passenger_idx on public.profi_transport_bookings(passenger_id);
alter table public.profi_transport_bookings enable row level security;
grant select on public.profi_transport_bookings to authenticated;
create policy transport_booking_participants_read on public.profi_transport_bookings for select to authenticated using(passenger_id=(select auth.uid()) or exists(select 1 from public.profi_transport t where t.id=ride_id and t.user_id=(select auth.uid())));
create table if not exists public.profi_transport_ratings(
 booking_id uuid primary key references public.profi_transport_bookings(id) on delete cascade,
 driver_id uuid not null references auth.users(id) on delete cascade,
 passenger_id uuid not null references auth.users(id) on delete cascade,
 rating integer not null check(rating between 1 and 5),
 comment text not null default '' check(char_length(comment)<=500),
 created_at timestamptz not null default now()
);
alter table public.profi_transport_ratings enable row level security;
grant select on public.profi_transport_ratings to anon,authenticated;
create policy transport_ratings_public_read on public.profi_transport_ratings for select to anon,authenticated using(true);

create or replace function public.profi_transport_book(p_ride uuid,p_seats integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_ride public.profi_transport%rowtype;v_id uuid;
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 if p_seats not between 1 and 8 then raise exception 'Invalid seats'; end if;
 select * into v_ride from public.profi_transport where id=p_ride for update;
 if not found or v_ride.kind<>'ride' or v_ride.status<>'active' or v_ride.departure_date<current_date then raise exception 'Ride unavailable'; end if;
 if v_ride.user_id=auth.uid() then raise exception 'Cannot book own ride'; end if;
 insert into public.profi_transport_bookings(ride_id,passenger_id,seats) values(p_ride,auth.uid(),p_seats) returning id into v_id;
 return v_id;
end;$$;
create or replace function public.profi_transport_booking_action(p_booking uuid,p_action text)
returns void language plpgsql security definer set search_path=public as $$
declare b public.profi_transport_bookings%rowtype;t public.profi_transport%rowtype;v_used integer;
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 select * into b from public.profi_transport_bookings where id=p_booking;
 if not found then raise exception 'Booking not found'; end if;
 select * into t from public.profi_transport where id=b.ride_id for update;
 select * into b from public.profi_transport_bookings where id=p_booking for update;
 if p_action='cancel' and b.passenger_id=auth.uid() and b.status in ('pending','confirmed') then
  update public.profi_transport_bookings set status='cancelled' where id=b.id;
 elsif p_action='reject' and t.user_id=auth.uid() and b.status='pending' then
  update public.profi_transport_bookings set status='rejected' where id=b.id;
 elsif p_action='confirm' and t.user_id=auth.uid() and b.status='pending' and t.status='active' and t.departure_date>=current_date then
  select coalesce(sum(seats),0) into v_used from public.profi_transport_bookings where ride_id=t.id and status in ('confirmed','completed');
  if v_used+b.seats>t.seats then raise exception 'Not enough seats'; end if;
  update public.profi_transport_bookings set status='confirmed' where id=b.id;
 elsif p_action='complete' and t.user_id=auth.uid() and b.status='confirmed' and t.departure_date<=current_date then
  update public.profi_transport_bookings set status='completed' where id=b.id;
 else raise exception 'Action not permitted'; end if;
end;$$;
create or replace function public.profi_transport_rate(p_booking uuid,p_rating integer,p_comment text default '')
returns void language plpgsql security definer set search_path=public as $$
declare b public.profi_transport_bookings%rowtype;v_driver uuid;
begin
 if auth.uid() is null or p_rating not between 1 and 5 or char_length(coalesce(p_comment,''))>500 then raise exception 'Invalid rating'; end if;
 select * into b from public.profi_transport_bookings where id=p_booking and passenger_id=auth.uid() and status='completed';
 if not found then raise exception 'Only completed trips can be rated'; end if;
 select user_id into v_driver from public.profi_transport where id=b.ride_id;
 insert into public.profi_transport_ratings(booking_id,driver_id,passenger_id,rating,comment) values(b.id,v_driver,auth.uid(),p_rating,coalesce(p_comment,''));
end;$$;
revoke all on function public.profi_transport_book(uuid,integer),public.profi_transport_booking_action(uuid,text),public.profi_transport_rate(uuid,integer,text) from public,anon;
grant execute on function public.profi_transport_book(uuid,integer),public.profi_transport_booking_action(uuid,text),public.profi_transport_rate(uuid,integer,text) to authenticated;
