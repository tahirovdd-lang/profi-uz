-- Send an asynchronous Telegram notification for each new Supabase Auth user.
-- Store the endpoint URL and shared webhook secret in Supabase Vault before running
-- this script. See supabase/TELEGRAM_SETUP.md.
create extension if not exists pg_net;

create or replace function public.notify_telegram_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  project_url text;
  webhook_secret text;
begin
  select decrypted_secret
    into project_url
    from vault.decrypted_secrets
   where name = 'profi_supabase_project_url'
   limit 1;

  select decrypted_secret
    into webhook_secret
    from vault.decrypted_secrets
   where name = 'profi_signup_webhook_secret'
   limit 1;

  if coalesce(project_url, '') = '' or coalesce(webhook_secret, '') = '' then
    raise warning 'Profi.UZ Telegram signup notifications are not configured in Supabase Vault.';
    return new;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/telegram-new-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'schema', 'auth',
      'table', 'users',
      'record', jsonb_build_object(
        'id', new.id,
        'email', new.email,
        'created_at', new.created_at,
        'user_metadata', jsonb_strip_nulls(jsonb_build_object(
          'first_name', new.raw_user_meta_data -> 'first_name',
          'last_name', new.raw_user_meta_data -> 'last_name',
          'full_name', new.raw_user_meta_data -> 'full_name',
          'name', new.raw_user_meta_data -> 'name',
          'given_name', new.raw_user_meta_data -> 'given_name',
          'family_name', new.raw_user_meta_data -> 'family_name'
        ))
      ),
      'old_record', null
    ),
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    -- Keep Telegram or network failures from interrupting user registration.
    raise warning 'Profi.UZ Telegram signup notification could not be queued (SQLSTATE %).', SQLSTATE;
    return new;
end;
$function$;

revoke all on function public.notify_telegram_new_auth_user() from public, anon, authenticated;

drop trigger if exists profi_telegram_new_auth_user on auth.users;
create trigger profi_telegram_new_auth_user
after insert on auth.users
for each row
execute function public.notify_telegram_new_auth_user();
