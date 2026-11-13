-- Profi.UZ: Telegram alerts when a specialist applies for verification.
-- Run after specialist-verification.sql and registration_telegram_notifications.sql.
-- Uses the same Vault secrets as existing registration notifications.
create schema if not exists private;
create extension if not exists pg_net with schema extensions;
create or replace function private.notify_profi_verification()
returns trigger language plpgsql security definer set search_path='' as $alert$
declare
 bot_token text;
 target_chat text;
 specialist_name text;
 msg text;
begin
 if new.status <> 'pending' then return new; end if;
 if tg_op='UPDATE' and old.status='pending' then return new; end if;
 select decrypted_secret into bot_token from vault.decrypted_secrets where name='profi_telegram_bot_token' limit 1;
 select decrypted_secret into target_chat from vault.decrypted_secrets where name='profi_registration_chat_id' limit 1;
 if coalesce(bot_token,'')='' or coalesce(target_chat,'')='' then
  raise warning 'Profi.UZ verification Telegram alert skipped: Vault secrets missing';
  return new;
 end if;
 select coalesce(nullif(trim(concat_ws(' ',p.last_name,p.first_name)),''),nullif(p.display_name,''),'Не указано')
 into specialist_name from public.profiles p where p.id=new.specialist_id;
 msg := '🛡 Новая заявка на проверку специалиста — Profi.UZ' || E'\n\n'
 || '👤 Специалист: ' || left(coalesce(specialist_name,'Не указано'),160) || E'\n'
 || '🆔 ID: ' || new.specialist_id::text || E'\n'
 || '📅 Дата: ' || to_char(new.requested_at at time zone 'Asia/Tashkent','YYYY-MM-DD HH24:MI') || ' (UZT)';
 perform net.http_post(
  url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage',
  headers := '{"Content-Type":"application/json"}'::jsonb,
  body := jsonb_build_object('chat_id',target_chat,'text',msg),
  timeout_milliseconds := 5000
 );
 return new;
exception when others then
 raise warning 'Profi.UZ verification Telegram alert failed: %',sqlerrm;
 return new;
end;$alert$;
revoke all on function private.notify_profi_verification() from public,anon,authenticated;
drop trigger if exists profi_verification_telegram_alert on public.profi_specialist_verifications;
create trigger profi_verification_telegram_alert
after insert or update of status on public.profi_specialist_verifications
for each row execute function private.notify_profi_verification();
