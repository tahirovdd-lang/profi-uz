# Profi.UZ — вход через 6-значный код Telegram

Код сайта и серверная Edge Function добавлены в репозиторий. **GitHub Pages не запускает серверный код**. Пока не выполнены действия ниже, новый вход НЕ заработает. Старый OAuth-вход больше не вызывается кнопкой на сайте.

## 1. База

В Supabase SQL Editor проекта `leuuckuyvsbfbiaoqjvm` выполните:
- `supabase/telegram_only_name.sql` (если ещё не выполнен)
- `supabase/telegram_otp.sql`
- Миграции `required_full_names.sql` и `admin_profile_moderation.sql` нужны для существующих запросов приложения, если ещё не выполнены.

## 2. Секреты

В Supabase Dashboard → Edge Functions → Secrets задайте:
- `TELEGRAM_BOT_TOKEN` — токен @Profiuzbekistan_bot из @BotFather (НИКОГДА не публиковать)
- `TELEGRAM_WEBHOOK_SECRET` — случайная строка 32+ символа, латиница/цифры/подчёркивания/дефисы
- `TELEGRAM_OTP_PEPPER` — другая независимая случайная строка 32+ символа
- `TELEGRAM_BOT_USERNAME` = `Profiuzbekistan_bot`
- `PUBLIC_SITE_ORIGIN` = `https://tahirovdd-lang.github.io`
- `SUPABASE_SERVICE_ROLE_KEY` — секретный service_role ключ проекта (часто уже доступен Edge Functions; проверьте)

## 3. Развёртывание

Установите Supabase CLI, войдите в проект и запустите в корне репозитория:

```bash
supabase login
supabase functions deploy telegram-otp --project-ref leuuckuyvsbfbiaoqjvm --no-verify-jwt
```

Функция принимает `POST /functions/v1/telegram-otp` (start, verify) и `POST /functions/v1/telegram-otp/webhook` (Telegram webhook). У webhook должен быть выключен JWT verify, поскольку Telegram не отправляет JWT. Проверка подлинности делается через `X-Telegram-Bot-Api-Secret-Token`.

## 4. Подключение Telegram webhook

В локальном терминале, не в публичном репозитории, вызовите Telegram Bot API setWebhook. Укажите:
- URL: `https://leuuckuyvsbfbiaoqjvm.supabase.co/functions/v1/telegram-otp/webhook`
- `secret_token`: точно тот же `TELEGRAM_WEBHOOK_SECRET`
- `allowed_updates`: `["message"]`

Пример через curl (замените переменные окружения локально):

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \\
 -d "url=https://leuuckuyvsbfbiaoqjvm.supabase.co/functions/v1/telegram-otp/webhook" \\
 -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \\
 --data-urlencode 'allowed_updates=["message"]'
```

**Внимание:** у Telegram-бота может быть только один webhook. Если этот бот уже используется другим сервисом, нужно объединить обработчики /start и других команд либо выделить отдельного бота. Не переназначайте webhook без проверки действующего бота.

## 5. Проверка

Откройте сайт → «Получить код в Telegram» → «Открыть бота» → Start → получите код → введите код на сайте. Код живёт 5 минут и принимается один раз, максимум 5 попыток. При первом входе пользователь вводит имя.

## Ограничения и безопасность

- Новый способ входа создаёт Supabase Auth-идентичность по внутреннему адресу вида `telegram-<id>@auth.profiuz.example`. **Она не будет автоматически объединена с ранее созданным аккаунтом Telegram OAuth**; для сохранения прежних заказов требуется отдельная безопасная миграция связей.
- При включённом старом провайдере OAuth его технические уведомления могут продолжать приходить при использовании старых ссылок. Новый интерфейс его не вызывает.
- Бот должен принимать /start с параметром сессии, отправлять код только владельцу Telegram-аккаунта. Не пересылайте код третьим лицам.
- Для продакшена дополнительно желательны rate limiting на создание запросов по IP/Telegram ID, мониторинг злоупотреблений, очистка старых записей, проверка отказов Telegram API и комплексный аудит.
