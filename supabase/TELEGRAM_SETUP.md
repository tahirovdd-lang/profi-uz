# Profi.UZ — вход через Telegram (OIDC)

**Статус:** кнопка и Supabase OAuth flow добавлены на сайт. **До настройки custom OIDC provider вход через Telegram не заработает.** Email и SMS UI оставлены без изменений.

## Настройка (не размещайте Client Secret в GitHub)

1. Создайте Telegram-бота через https://t.me/BotFather (или используйте выделенного бота Profi.UZ). Установите имя и логотип, соответствующие сайту.
2. Supabase Dashboard → Authentication → Providers → **New Provider** → **Auto-discovery (OIDC)**. Выберите идентификатор `custom:telegram`, issuer `https://oauth.telegram.org`, scopes `openid profile`. Telegram не передаёт email: включите **Email optional**, если доступно.
3. В форме Supabase скопируйте точный **Callback URL**. Обычно `https://leuuckuyvsbfbiaoqjvm.supabase.co/auth/v1/callback`, но используйте именно URL из Dashboard.
4. Откройте BotFather mini app → бот → **Login Widget** → **Switch to OpenID Connect Login**, если требуется → **Add a Redirect URI**. Вставьте callback из шага 3. Добавьте разрешённый URL сайта `https://tahirovdd-lang.github.io` / `https://tahirovdd-lang.github.io/profi-uz/` согласно настройкам Telegram.
5. В BotFather получите **Client ID** и **Client Secret**. Внесите их **только в Supabase Dashboard** в конфигурацию провайдера, включите его.
6. В Supabase Authentication → URL Configuration укажите Site URL `https://tahirovdd-lang.github.io/profi-uz/` и добавьте этот URL в Redirect URLs.
7. Откройте сайт в приватном окне, нажмите **Войти через Telegram**, подтвердите вход в Telegram и проверьте создание профиля, публикацию заказа, повторный вход.

## Безопасность и аккаунты

- Клиентский JS использует `signInWithOAuth({provider:'custom:telegram'})`; он **не** проверяет Telegram-подпись самостоятельно и **не** принимает произвольные Telegram user IDs. OIDC-проверку выполняет Supabase.
- Никогда не размещайте bot token, Client Secret, service_role key в HTML, JavaScript или коммитах.
- Telegram может не возвращать email и телефон; не полагайтесь на эти поля.
- Вход через Telegram и старый email-аккаунт могут создать разные Supabase user ID. Автоматически объединять их нельзя; потребуется подтверждённая процедура связывания.
- При ошибке `Unsupported provider` / `provider not enabled` проверьте поддержку Custom OAuth/OIDC в вашем проекте и правильность идентификатора.
- Обычная кнопка Telegram Login Widget без сервера не создаёт безопасную Supabase-сессию; здесь используется официальный OIDC.

Официальная документация:
- https://supabase.com/docs/guides/auth/custom-oauth-providers
- https://core.telegram.org/bots/telegram-login
