-- Profi.UZ: Telegram admin alerts for orders, proposals and transport bookings.
-- Run after schema.sql, phase2.sql, profi_transport.sql, profi_transport_booking.sql.
-- Reuses existing Vault secrets; no token or chat ID is stored in source code.
create schema if not exists private;
create extension if not exists pg_net with schema extensions;

create or replace function private.profi_telegram_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_token text;
  v_chat text;
  v_text text;
  v_route record;
  v_order record;
  v_name text;
begin
  select trim(decrypted_secret) into v_token
    from vault.decrypted_secrets where name='profi_telegram_bot_token' limit 1;
  select trim(decrypted_secret) into v_chat
    from vault.decrypted_secrets where name='profi_registration_chat_id' limit 1;
  if coalesce(v_token,'')='' or coalesce(v_chat,'')='' then
    raise warning 'Profi.UZ event notification skipped: missing Telegram Vault secret';
    return new;
  end if;

  if TG_TABLE_NAME='orders' then
    select coalesce(nullif(display_name,''),'Не указано') into v_name
      from public.profiles where id=new.client_id;
    v_text := '🛒 Новый заказ — Profi.UZ' || E'\n\n'
      || '👤 Заказчик: ' || left(coalesce(v_name,'Не указано'),120) || E'\n'
      || '📂 Категория: ' || left(coalesce(new.category,''),120) || E'\n'
      || '📝 Описание: ' || left(coalesce(new.description,''),700) || E'\n'
      || '📍 Город: ' || left(coalesce(new.city,''),100) || E'\n'
      || '🆔 Заказ: ' || new.id::text;
  elsif TG_TABLE_NAME='proposals' then
    select category,description into v_order from public.orders where id=new.order_id;
    select coalesce(nullif(display_name,''),'Не указано') into v_name
      from public.profiles where id=new.specialist_id;
    v_text := '🙋 Новый отклик специалиста — Profi.UZ' || E'\n\n'
      || '👤 Специалист: ' || left(coalesce(v_name,'Не указано'),120) || E'\n'
      || '📂 Категория: ' || left(coalesce(v_order.category,''),120) || E'\n'
      || '💬 Предложение: ' || left(coalesce(new.message,''),700) || E'\n'
      || '💰 Цена: ' || coalesce(new.price_uzs::text || ' сум','Не указана') || E'\n'
      || '🆔 Заказ: ' || new.order_id::text || E'\n'
      || '🆔 Отклик: ' || new.id::text;
  elsif TG_TABLE_NAME='profi_transport_bookings' then
    select origin,destination,departure_date into v_route
      from public.profi_transport where id=new.ride_id;
    select coalesce(nullif(display_name,''),'Не указано') into v_name
      from public.profiles where id=new.passenger_id;
    v_text := '🚗 Новое бронирование — Profi.UZ' || E'\n\n'
      || '👤 Пассажир: ' || left(coalesce(v_name,'Не указано'),120) || E'\n'
      || '🛣 Маршрут: ' || left(coalesce(v_route.origin,''),100)
      || ' → ' || left(coalesce(v_route.destination,''),100) || E'\n'
      || '📅 Дата поездки: ' || coalesce(v_route.departure_date::text,'Не указана') || E'\n'
      || '💺 Мест: ' || new.seats::text || E'\n'
      || '🆔 Бронь: ' || new.id::text;
  else
    return new;
  end if;

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('chat_id',v_chat,'text',v_text),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  raise warning 'Profi.UZ Telegram event alert failed: %', sqlerrm;
  return new;
end;
$$;
revoke all on function private.profi_telegram_event() from public,anon,authenticated;

drop trigger if exists profi_telegram_order_created on public.orders;
create trigger profi_telegram_order_created
after insert on public.orders for each row
execute function private.profi_telegram_event();

drop trigger if exists profi_telegram_proposal_created on public.proposals;
create trigger profi_telegram_proposal_created
after insert on public.proposals for each row
execute function private.profi_telegram_event();

drop trigger if exists profi_telegram_booking_created on public.profi_transport_bookings;
create trigger profi_telegram_booking_created
after insert on public.profi_transport_bookings for each row
execute function private.profi_telegram_event();
