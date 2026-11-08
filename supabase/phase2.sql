-- Profi.UZ phase 2. Run ONCE in Supabase SQL Editor.
-- Self-service specialist enrollment is enabled for the MVP. Profiles are not verified.
-- Allow only trusted SECURITY DEFINER routines to change a role.
create or replace function public.prevent_profile_role_change() returns trigger language plpgsql as $role_body$
begin
 if new.role is distinct from old.role and current_user <> 'postgres' then
  raise exception 'Role changes require trusted registration';
 end if;
 return new;
end;$role_body$;
create or replace function public.register_as_specialist(p_name text,p_category text,p_bio text,p_phone text)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Sign in first'; end if;
 if char_length(trim(coalesce(p_name,''))) not between 2 and 70 then raise exception 'Name must be 2-70 characters'; end if;
 if p_category not in ('Ремонт и строительство','Электрики','Уборка','Репетиторы','Красота','IT и дизайн','Автоуслуги','Фото и видео') then raise exception 'Invalid category'; end if;
 if char_length(coalesce(p_bio,''))>500 or char_length(coalesce(p_phone,''))>30 then raise exception 'Invalid profile length'; end if;
 insert into public.profiles(id,display_name,role,category,bio,phone)
 values(uid,trim(p_name),'specialist',p_category,coalesce(p_bio,''),nullif(trim(coalesce(p_phone,'')),''))
 on conflict(id) do update set display_name=excluded.display_name,role='specialist',category=excluded.category,bio=excluded.bio,phone=excluded.phone;
end;$$;
revoke all on function public.register_as_specialist(text,text,text,text) from public,anon;
grant execute on function public.register_as_specialist(text,text,text,text) to authenticated;

-- Prevent direct manipulation of privileged order/proposal fields.
create or replace function public.protect_order_update() returns trigger language plpgsql as $$
begin
 if new.client_id is distinct from old.client_id or new.category is distinct from old.category or new.description is distinct from old.description or new.city is distinct from old.city or new.created_at is distinct from old.created_at then
 raise exception 'Order details are immutable';
 end if;
 if current_user <> 'postgres' and new.status not in ('open','cancelled','completed') then raise exception 'Invalid owner status change'; end if;
 return new;
end;$$;
drop trigger if exists protect_order_update on public.orders;
create trigger protect_order_update before update on public.orders for each row execute function public.protect_order_update();

-- Only the customer may accept one proposal on an open order; transaction locks the order.
create or replace function public.accept_proposal(p_proposal_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare oid uuid; owner_id uuid; current_status text;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select order_id into oid from public.proposals where id=p_proposal_id;
 if oid is null then raise exception 'Proposal not found'; end if;
 select client_id,status into owner_id,current_status from public.orders where id=oid for update;
 if owner_id is distinct from auth.uid() or current_status<>'open' then raise exception 'Not allowed'; end if;
 update public.proposals set status='rejected' where order_id=oid and status='pending';
 update public.proposals set status='accepted' where id=p_proposal_id;
 update public.orders set status='in_progress' where id=oid;
end;$$;
revoke all on function public.accept_proposal(uuid) from public,anon;
grant execute on function public.accept_proposal(uuid) to authenticated;

-- Do not permit clients to directly change proposal statuses.
drop policy if exists proposals_update_client on public.proposals;
drop policy if exists orders_update_owner on public.orders;
create policy orders_update_owner on public.orders for update to authenticated
using(client_id=auth.uid()) with check(client_id=auth.uid());
-- Prevent client inserting specialist proposals with arbitrary statuses.
create or replace function public.protect_proposal_insert() returns trigger language plpgsql as $$
begin
 if new.status<>'pending' then raise exception 'Invalid proposal status'; end if;
 return new;
end;$$;
drop trigger if exists protect_proposal_insert on public.proposals;
create trigger protect_proposal_insert before insert on public.proposals for each row execute function public.protect_proposal_insert();
-- Public-facing specialist card data only, no email/phone.
create or replace function public.specialist_cards(p_ids uuid[])
returns table(id uuid,display_name text,category text,bio text)
language sql security definer set search_path='' stable as $$
 select p.id,p.display_name,p.category,p.bio from public.profiles p
 where p.role='specialist' and p.id=any(p_ids) and auth.uid() is not null
$$;
revoke all on function public.specialist_cards(uuid[]) from public,anon;
grant execute on function public.specialist_cards(uuid[]) to authenticated;
