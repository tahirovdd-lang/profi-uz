# Profi.UZ: Android / iPhone release plan

## Shared backend
- Web, Android and iOS must use the same Supabase project and RLS rules.
- Mobile authentication must use platform-specific redirect URLs and deep links; never embed Supabase service-role secrets.
- Store push device tokens per authenticated user in a secure table; send through a trusted server or Edge Function (FCM/APNs), not client-side secrets.

## Web / PWA
- Root domain: https://profiuz.uz (pending DNS/HTTPS activation).
- PWA manifest, scalable app icon, installable standalone display and minimal static-only service worker.
- No offline promises: messages, orders, and booking require network.
- For iOS, Add to Home Screen; for Android, install from browser if supported.

## Native builds — not yet produced
- Choose Capacitor or Flutter and configure Android applicationId and iOS bundle identifier.
- Generate platform-specific icons, splash screens, signing keys and store metadata.
- Configure OAuth/email redirect/deep link, camera/file permissions, push permissions, privacy disclosures.
- Test notifications while app is foreground/background/closed and logins on multiple devices.
- Build signed AAB for Google Play and archive IPA with Apple developer signing.
- Run two-account QA for proposals, chat, attachments, transport, ratings, region/language switching.

Do not publish until the custom domain is live, SQL migrations are applied, and security / end-to-end checks pass.
