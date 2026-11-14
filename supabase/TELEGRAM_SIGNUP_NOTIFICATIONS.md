# Telegram notifications for new Profi.UZ users

This adds a server-side notification for every new row created in Supabase Auth's `auth.users` table. It covers registration through the website and the Android/iOS apps using the same Supabase project. It does not change the website or app interface.

The notification contains the user's name, email, and registration time. Existing accounts are not announced. A Telegram/network error does not cancel account creation.

## One-time setup

1. Open a private chat with [@Profiuzbekistan_bot](https://t.me/Profiuzbekistan_bot) and send `/start`. Telegram bots cannot start a private conversation themselves.
2. Get the destination `chat_id` from the bot's `getUpdates` response after sending `/start`. Keep the Bot API URL containing the bot token private.
3. In the Supabase Dashboard for the production project, add these Edge Function secrets:
   - `TELEGRAM_BOT_TOKEN`: the token from BotFather.
   - `TELEGRAM_CHAT_ID`: the ID from step 2 (for a group, add the bot and use that group's chat ID).
   - `PROFI_SIGNUP_WEBHOOK_SECRET`: a new random secret of at least 32 characters. Generate it privately and use the same value in Supabase Vault below.
4. Deploy the Edge Function from the repository root:
   ```sh
   supabase functions deploy telegram-new-user --project-ref <PROJECT_REF> --no-verify-jwt
   ```
   The function checks `PROFI_SIGNUP_WEBHOOK_SECRET` itself. The Supabase gateway JWT check is disabled only for this function so the database trigger can invoke it.
5. In **Supabase Dashboard → Vault**, create two secrets with these exact names:
   - `profi_supabase_project_url`: the project URL, such as `https://abcdefgh.supabase.co`.
   - `profi_signup_webhook_secret`: the same random secret as `PROFI_SIGNUP_WEBHOOK_SECRET`.
6. Open **Supabase Dashboard → SQL Editor**, paste and run `supabase/telegram_new_user.sql`. It enables the `pg_net` extension if needed and adds an asynchronous trigger to `auth.users`.

Do not put the bot token or webhook secret in the website, Android/iOS app, or committed files. The trigger sends only the name, email, and registration time to the Edge Function; it does not send passwords or the full Auth record.

## Check the setup

Create a new test account through the website. The bot should send one message to the configured chat. Registration works even if Telegram is temporarily unavailable. A newly created account is reported immediately, including accounts that still need email confirmation.

If the message does not arrive, confirm the bot chat was started, the chat ID and three Edge Function secrets are correct, the two Vault entries exist, the Edge Function was deployed with `--no-verify-jwt`, and `supabase/telegram_new_user.sql` ran successfully. Supabase's `net._http_response` table can show failed asynchronous requests for the last six hours.
