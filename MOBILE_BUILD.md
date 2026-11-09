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
