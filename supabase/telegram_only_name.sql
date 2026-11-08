-- Profi.UZ: Telegram-only onboarding with one required name.
-- Run in Supabase SQL Editor once.
alter table public.profiles add column if not exists name_confirmed boolean not null default false;
create or replace function public.set_my_display_name(p_name text)
returns void language plpgsql security definer set search_path='' as $fn$
declare v_name text:=btrim(coalesce(p_name,''));
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 if char_length(v_name) not between 2 and 70 or v_name ~ '[0-9]' then raise exception 'Enter a valid name'; end if;
 insert into public.profiles(id,role,display_name,name_confirmed)
 values(auth.uid(),'client',v_name,true)
 on conflict(id) do update set display_name=excluded.display_name,name_confirmed=true;
end;$fn$;
revoke all on function public.set_my_display_name(text) from public,anon;
grant execute on function public.set_my_display_name(text) to authenticated;
-- Existing users will be asked to confirm their name once on next login.
