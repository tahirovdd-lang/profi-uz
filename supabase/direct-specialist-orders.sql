-- Profi.UZ: direct orders for a selected specialist, preserving existing public orders.
begin;
alter table public.orders add column if not exists target_specialist_id uuid references public.profiles(id) on delete set null;
create index if not exists orders_target_specialist_idx on public.orders(target_specialist_id) where target_specialist_id is not null;

create or replace function public.profi_validate_direct_order()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if new.target_specialist_id is distinct from old.target_specialist_id then
   raise exception 'Order recipient cannot be changed';
  end if;
  return new;
 end if;
 if new.target_specialist_id is not null then
  if not exists(select 1 from public.profiles p where p.id=new.target_specialist_id and p.role='specialist' and p.category=new.category)
     or exists(select 1 from public.profi_specialist_visibility v where v.specialist_id=new.target_specialist_id and v.paused)
  then raise exception 'Selected specialist is not available'; end if;
  if new.target_specialist_id=new.client_id then raise exception 'Cannot order from yourself'; end if;
 end if;
 return new;
end $$;
drop trigger if exists profi_validate_direct_order on public.orders;
create trigger profi_validate_direct_order before insert or update on public.orders
for each row execute function public.profi_validate_direct_order();

-- Only the chosen specialist may respond to a directed order.
create or replace function public.profi_validate_direct_proposal()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
 select target_specialist_id into recipient from public.orders where id=new.order_id;
 if recipient is not null and recipient<>new.specialist_id then
  raise exception 'Order is addressed to another specialist';
 end if;
 return new;
end $$;
drop trigger if exists profi_validate_direct_proposal on public.proposals;
create trigger profi_validate_direct_proposal before insert on public.proposals
for each row execute function public.profi_validate_direct_proposal();

-- Existing read policies remain in place; the interface filters targeted orders.
commit;