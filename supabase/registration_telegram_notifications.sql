-- Profi.UZ: one notification for each newly created Supabase Auth user.
-- Prerequisites: pg_net and Supabase Vault extensions enabled.
-- Create Vault secrets in Dashboard > Vault:
--   profi_telegram_bot_token = token for @Profiuzbekistan_bot
--   profi_registration_chat_id = target private chat/group numeric ID
-- Never put bot tokens into SQL files, client JS or GitHub.
create schema if not exists private;
create extension if not exists pg_net with schema extensions;

create or replace function private.notify_profi_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bot_token text;
  target_chat text;
  full_name text;
  provider text;
  msg text;
begin
  select decrypted_secret into bot_token
  from vault.decrypted_secrets where name = 'profi_telegram_bot_token' limit 1;
  select decrypted_secret into target_chat
  from vault.decrypted_secrets where name = 'profi_registration_chat_id' limit 1;
  if coalesce(bot_token, '') = '' or coalesce(target_chat, '') = '' then
    raise warning 'Profi.UZ registration alert skipped: Vault secrets missing';
    return new;
  end if;
  full_name := nullif(trim(concat_ws(' ',
    nullif(new.raw_user_meta_data->>'first_name',''),
    nullif(new.raw_user_meta_data->>'last_name',''))), '');
  full_name := coalesce(full_name, nullif(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'name',''), 'Не указано');
  provider := coalesce(nullif(new.raw_app_meta_data->>'provider',''), 'Не указан');
  msg := '🆕 Новая регистрация — Profi.UZ' || E'\n\n'
    || '👤 Имя: ' || left(full_name, 160) || E'\n'
    || '📧 Email: ' || coalesce(nullif(new.email,''), 'Не указан') || E'\n'
    || '🔐 Способ: ' || left(provider, 60) || E'\n'
    || '🕒 Время (UTC): ' || to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') || E'\n'
    || '🆔 ID: ' || new.id::text;
  -- Async HTTP: registration succeeds even when Telegram is unavailable.
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('chat_id', target_chat, 'text', msg),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  raise warning 'Profi.UZ registration alert failed: %', sqlerrm;
  return new;
end;
$$;

revoke all on function private.notify_profi_registration() from public, anon, authenticated;
drop trigger if exists profi_registration_telegram_alert on auth.users;
create trigger profi_registration_telegram_alert
after insert on auth.users
for each row execute function private.notify_profi_registration();
