# Profi.UZ Android and iOS builds (Capacitor)

This repository now has **Capacitor scaffolding only**, not compiled APK/AAB or IPA. Existing GitHub Pages site remains unchanged.

## Requirements
- Node.js 20+, npm, Android Studio + Android SDK/JDK for Android.
- macOS + Xcode + CocoaPods + Apple signing for iOS.
- Configure Supabase OAuth redirect / deep links before shipping native auth.

## Local steps
```bash
npm install
npm run mobile:prepare
npx cap add android
npx cap add ios   # macOS only
npm run mobile:sync
npx cap open android
npx cap open ios   # macOS only
```

Capacitor app ID: `uz.profiuz.app`. Confirm ownership and final bundle identifiers before store submission. Build signed AAB / IPA in native IDEs; **no signing keys are stored in GitHub**.

## Security and release blockers
- Run read-receipt and transport SQL migrations; test RLS with two accounts.
- Validate auth persistence and OAuth/email redirects on Android/iOS, not only browsers.
- Test file upload, camera/gallery, geolocation, external links, language switching, and safe-area insets.
- Native push requires Firebase Cloud Messaging for Android and APNs for iOS, device-token registration and a trusted backend sender; the existing website bell is not native push.
- Test foreground/background/terminated states and permission denial; privacy policy and store disclosures required.
- Native packages should be tested on real Android/iPhone hardware before release.

Do not claim native apps are published or push works until verified.

## Automatic Android test APK via GitHub Actions
1. Open https://github.com/tahirovdd-lang/profi-uz/actions/workflows/android-apk.yml
2. Select **Run workflow** on the main branch (or inspect the run triggered by a build-config commit).
3. Wait for **Build test APK** and **Upload installable APK** to succeed.
4. Open the successful workflow run and download artifact **ProfiUZ-Android-Test-APK**.
5. Unzip the artifact and transfer **app-debug.apk** to an Android phone; install it after approving the device's install prompt.
6. Test registration/login, orders, proposals, chats, file uploads, intercity transport, and the Android Back button. Report errors/screenshots.

This debug APK is signed with Android's temporary debug key. It is **not** a Google Play release. The Android app must not be considered production-ready until Supabase auth/deep links, mobile permissions, and RLS security are verified. Android's installation warning for unknown sources is expected for a test APK; only install your own verified build.
