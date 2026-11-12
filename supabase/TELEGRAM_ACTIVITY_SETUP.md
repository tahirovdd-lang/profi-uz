# Profi.UZ — Telegram activity alerts

Run [telegram_activity_notifications.sql](./telegram_activity_notifications.sql) once in Supabase SQL Editor for project `leuuckuyvsbfbiaoqjvm`. It adds three AFTER INSERT triggers:

- `public.orders`: new customer order
- `public.proposals`: new specialist proposal
- `public.profi_transport_bookings`: new intercity booking

The function reads the **existing** Vault secrets `profi_telegram_bot_token` and `profi_registration_chat_id`. Do not create another bot token. The script is repeatable, uses `pg_net` async delivery and does not modify the existing registration trigger, authorization, bot webhook, UI, RLS or booking logic.

**Prerequisite:** The transport booking table must already exist (from `profi_transport_booking.sql`). If it is absent, the SQL will fail at the booking trigger creation; run the booking migration first. Do not create fake records merely to test notifications.

## Test
1. Create a real test order from the site or app; look for `🛒 Новый заказ`.
2. From a separate specialist account, respond to that order; look for `🙋 Новый отклик специалиста`.
3. Create a test ride from one account, then book a seat from another; look for `🚗 Новое бронирование`.
4. If a notification is missing, check recent `net._http_response` entries for HTTP status and Telegram error. Do not show the raw request URL or bot token in screenshots.

Only new records after installation generate messages; logging in, editing existing orders and booking status updates do not. Telegram downtime does not block normal transactions, but delivery is not automatically retried.

Messages contain personal data. Keep the recipient chat private and accessible only to authorized administrators.
