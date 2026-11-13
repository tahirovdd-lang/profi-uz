# Profi.UZ — Android release signing

The workflow `.github/workflows/android-release.yml` builds signed `ProfiUZ.apk` and `ProfiUZ.aab` and publishes both to GitHub Releases. The AAB is intended for Google Play Console. It never commits a keystore or passwords.

## One-time setup (Windows PowerShell)

Install JDK 21, then run locally:

```powershell
keytool -genkeypair -v -keystore profi-release.jks -alias profiuz -keyalg RSA -keysize 3072 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path .\profi-release.jks))) | Set-Clipboard
```

**Back up `profi-release.jks` and its passwords offline. Never send them in chat, commit them, or publish them.** Losing the keystore prevents upgrades to existing APK installations signed with it.

In repository **Settings → Secrets and variables → Actions**, create four repository secrets:

- `ANDROID_KEYSTORE_BASE64`: clipboard Base64 text of the keystore.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: `profiuz` (or the alias used above).
- `ANDROID_KEY_PASSWORD`: key password.

Run **Actions → Android signed release → Run workflow**. The first run publishes version `v0.2.0`; later releases require increasing `package.json` version first. Download `ProfiUZ.aab` from the GitHub Release or the `ProfiUZ-Google-Play-AAB` Actions artifact and upload it to a Google Play Console testing track. Google Play developer account, store listing, privacy policy, Data safety declaration, app access instructions, and required testing/review are managed separately in Play Console.

Stable download URL (after first successful release):
https://github.com/tahirovdd-lang/profi-uz/releases/latest/download/ProfiUZ.apk

Google Play bundle (after first successful release):
https://github.com/tahirovdd-lang/profi-uz/releases/latest/download/ProfiUZ.aab

**Important:** existing debug APKs are signed with a different certificate and cannot be upgraded in place to this release APK. Users must uninstall the debug APK once before installing the first signed release. Subsequent signed releases can upgrade in place as long as the same keystore and application ID are used. Removing a debug APK can remove local app data; confirm any unsynced data is backed up first.

iOS will need an Apple Developer account, distribution certificates and App Store Connect. The Android keystore is not used for iOS.
