-- Telegram six-digit OTP challenges. Run once in Supabase SQL Editor.
create table if not exists public.telegram_login_challenges (
 id uuid primary key,
 telegram_id bigint,
 telegram_name text,
 code_hash text,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '5 minutes'),
 attempts integer not null default 0,
 consumed boolean not null default false
);
create index if not exists telegram_login_challenges_expires on public.telegram_login_challenges(expires_at);
create index if not exists telegram_login_challenges_telegram_id on public.telegram_login_challenges(telegram_id);
alter table public.telegram_login_challenges enable row level security;
revoke all on public.telegram_login_challenges from public,anon,authenticated;
-- All reads/writes occur in trusted Edge Functions using the service role key.
-- Old expired challenges may be periodically removed:
-- delete from public.telegram_login_challenges where expires_at < now()-interval '1 day';

-- Atomic verification: prevents two requests from redeeming the same code.
create or replace function public.consume_telegram_login_code(p_id uuid,p_hash text)
returns table(telegram_id bigint,telegram_name text)
language plpgsql security definer set search_path='' as $fn$
declare c public.telegram_login_challenges%rowtype;
begin
 select * into c from public.telegram_login_challenges where id=p_id for update;
 if not found or c.consumed or c.expires_at<=now() or c.attempts>=5 or c.telegram_id is null or c.code_hash is null then return; end if;
 update public.telegram_login_challenges set attempts=attempts+1 where id=p_id;
 if c.code_hash<>p_hash then return; end if;
 update public.telegram_login_challenges set consumed=true where id=p_id;
 return query select c.telegram_id,c.telegram_name;
end;$fn$;
revoke all on function public.consume_telegram_login_code(uuid,text) from public,anon,authenticated;
grant execute on function public.consume_telegram_login_code(uuid,text) to service_role;
