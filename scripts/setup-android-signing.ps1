# Profi.UZ Android signing setup. Run locally on a trusted Windows PC.
param([string]$Repository = 'tahirovdd-lang/profi-uz')
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { throw 'Install Java JDK 17+ and reopen PowerShell (keytool not found).' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI: winget install --id GitHub.cli -e; reopen PowerShell.' }
$backupDir = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'ProfiUZ-Android-signing'
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$keystore = Join-Path $backupDir 'profi-release.p12'
$recovery = Join-Path $backupDir 'PRIVATE-SIGNING-RECOVERY.txt'
$alias = 'profi-uz-release'
if ((Test-Path $keystore) -xor (Test-Path $recovery)) { throw 'Signing files incomplete: restore BOTH original files; do not generate a new key.' }
if (!(Test-Path $keystore)) {
  $bytes = New-Object byte[] 36
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  $password = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
  & keytool -genkeypair -alias $alias -keyalg RSA -keysize 3072 -validity 10000 -storetype PKCS12 -keystore $keystore -storepass $password -keypass $password -dname 'CN=Profi.UZ, OU=Mobile, O=Profi.UZ, L=Samarkand, C=UZ' -noprompt
  if ($LASTEXITCODE -ne 0) { throw 'keytool failed; nothing uploaded.' }
  [System.IO.File]::WriteAllText($recovery, "BACK UP BOTH FILES; NEVER SHARE OR COMMIT.`r`nRepository=$Repository`r`nAlias=$alias`r`nPassword=$password`r`n")
} else {
  $content = [System.IO.File]::ReadAllText($recovery)
  $match = [regex]::Match($content, '(?m)^Password=([^\r\n]+)')
  if (!$match.Success) { throw 'Recovery password missing.' }
  $password = $match.Groups[1].Value.Trim()
  Write-Host 'Reusing original Android signing key.'
}
& keytool -list -storetype PKCS12 -keystore $keystore -storepass $password -alias $alias | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Keystore validation failed.' }
& gh auth status --hostname github.com *> $null
if ($LASTEXITCODE -ne 0) {
  & gh auth login --hostname github.com --web --scopes 'repo,workflow'
  if ($LASTEXITCODE -ne 0) { throw 'GitHub login failed.' }
}
$secrets = [ordered]@{
  PROFI_ANDROID_KEYSTORE_BASE64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($keystore))
  PROFI_ANDROID_KEYSTORE_PASSWORD = $password
  PROFI_ANDROID_KEY_ALIAS = $alias
  PROFI_ANDROID_KEY_PASSWORD = $password
}
foreach ($item in $secrets.GetEnumerator()) {
  $item.Value | & gh secret set $item.Key --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw "Failed to upload secret $($item.Key)" }
  Write-Host "Uploaded $($item.Key)"
}
& gh workflow run android-apk.yml --repo $Repository --ref main
if ($LASTEXITCODE -ne 0) { throw 'Secrets saved; open GitHub Actions to trigger build.' }
Write-Host "PRIVATE SIGNING BACKUP: $backupDir"
Write-Host 'Keep BOTH files in a safe offline backup. Losing this key prevents in-place updates.'
Write-Host "APK: https://github.com/$Repository/releases"
