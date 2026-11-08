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
