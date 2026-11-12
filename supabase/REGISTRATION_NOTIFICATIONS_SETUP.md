# Profi.UZ — Telegram notifications for new registrations

This is a **server-side** Supabase Auth trigger. It works for web, Android and iOS, including email, Google, Apple and Telegram registrations that actually create a new row in `auth.users`. Signing into an existing account does not send an alert. Notifications may contain personal data: use an administrator-only Telegram chat.

## Setup

1. Open Supabase project `leuuckuyvsbfbiaoqjvm` → Database → Extensions. Enable **pg_net** and **Vault** if not already enabled.
2. Open **Vault** and create the two secrets by their exact names:
   - `profi_telegram_bot_token`: the current token for `@Profiuzbekistan_bot` from BotFather.
   - `profi_registration_chat_id`: numeric Telegram chat ID of the administrator or private admin group (groups often have a negative ID).
   Never paste these values into GitHub, the website, or this chat.
3. To get notifications in a private chat, first open `@Profiuzbekistan_bot` in Telegram and press **Start**. For a group, add the bot to the group and grant permission to send messages.
4. Find the target chat ID from the bot's existing backend/webhook logs or a trusted Telegram ID lookup. **Do not call setWebhook or deleteWebhook**: this bot may already handle Telegram OTP login. If a webhook is active, `getUpdates` may not work.
5. In Supabase → SQL Editor, run `supabase/registration_telegram_notifications.sql` from this repository. The trigger installs on `auth.users` and does not change existing signup/login code.
6. Register a **new test account** through the site or app and check Telegram. Logging in with an existing account is not a valid test.

## Behavior and security

- Sends name, email if available, auth provider, UTC signup time and Supabase user UUID.
- Trigger runs asynchronously using pg_net and returns even if Telegram is unavailable; registration is not blocked by Telegram.
- No bot token in the client or repository. The function reads the token from Supabase Vault at runtime.
- Only one trigger with this name is installed; re-running the SQL replaces it.
- A failed Telegram delivery is not retried automatically; inspect pg_net response logs when troubleshooting.
- For Telegram OTP flows that create an Auth user via an admin API, the same database trigger applies.
- The notification does not reliably distinguish website vs Android vs iOS: Supabase Auth does not store a trustworthy registration platform on the user record. Do not infer one.
- If a user account is deleted and recreated, it counts as a new registration.
- Limit access to the Telegram destination because these messages include user information.

## Troubleshooting

Check `net._http_response` for recent request statuses (available depending on pg_net version). Confirm both Vault secrets exist and the bot has permission to message the chat. Avoid displaying decrypted bot tokens in logs or screenshots.
