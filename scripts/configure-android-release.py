"""Configure signed Android release without exposing keystore passwords in source."""
import base64,json,os,pathlib,re
root=pathlib.Path(__file__).resolve().parents[1]
version=json.loads((root/"package.json").read_text())["version"]
parts=version.split(".")
if len(parts)!=3 or any(not p.isdigit() or int(p)>99 for p in parts):raise ValueError("Use semantic x.y.z version (0..99)")
code=int("".join(f"{int(p):02d}" for p in parts))
keystore=root/"android"/"app"/"profi-release.jks"
keystore.write_bytes(base64.b64decode(os.environ["KEYSTORE_BASE64"],validate=True))
props=root/"android"/"release-signing.properties"
def esc(s):return s.replace("\\","\\\\").replace("\n","")
props.write_text("storeFile=profi-release.jks\nstorePassword="+esc(os.environ["KEYSTORE_PASSWORD"])+"\nkeyAlias="+esc(os.environ["KEY_ALIAS"])+"\nkeyPassword="+esc(os.environ["KEY_PASSWORD"])+"\n")
gradle=root/"android"/"app"/"build.gradle"
src=gradle.read_text()
src,n=re.subn(r'versionCode\s+\d+',f'versionCode {code}',src,count=1)
if n!=1:raise RuntimeError("versionCode not found")
src,n=re.subn(r'versionName\s+"[^"]+"',f'versionName "{version}"',src,count=1)
if n!=1:raise RuntimeError("versionName not found")
snippet="""
def releaseSigningProps = new Properties()
def releaseSigningFile = rootProject.file('release-signing.properties')
releaseSigningFile.withInputStream { releaseSigningProps.load(it) }
"""
src=snippet+src
src=src.replace("signingConfigs {","signingConfigs {\n        release {\n            storeFile file(releaseSigningProps['storeFile'])\n            storePassword releaseSigningProps['storePassword']\n            keyAlias releaseSigningProps['keyAlias']\n            keyPassword releaseSigningProps['keyPassword']\n        }",1)
if "signingConfigs {" not in src:raise RuntimeError("signingConfigs missing")
src=src.replace("signingConfig signingConfigs.debug","signingConfig signingConfigs.release")
gradle.write_text(src)
print(f"Configured signed Android release {version} ({code})")
