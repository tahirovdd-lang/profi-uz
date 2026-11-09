#!/usr/bin/env python3
"""Register Android deep link for Supabase PKCE OAuth callback."""
from pathlib import Path
import xml.etree.ElementTree as ET
p=Path("android/app/src/main/AndroidManifest.xml")
if not p.exists():
 raise SystemExit("AndroidManifest.xml not found")
ET.register_namespace("android","http://schemas.android.com/apk/res/android")
android="{http://schemas.android.com/apk/res/android}"
tree=ET.parse(p);root=tree.getroot()
application=root.find("application")
activity=next((a for a in application.findall("activity") if a.get(android+"name") in (".MainActivity","com.getcapacitor.BridgeActivity")),None)
if activity is None:
 raise SystemExit("Capacitor MainActivity not found")
if not any(f.find("data") is not None and f.find("data").get(android+"scheme")=="uz.profiuz.app" for f in activity.findall("intent-filter")):
 f=ET.SubElement(activity,"intent-filter")
 ET.SubElement(f,"action",{android+"name":"android.intent.action.VIEW"})
 ET.SubElement(f,"category",{android+"name":"android.intent.category.DEFAULT"})
 ET.SubElement(f,"category",{android+"name":"android.intent.category.BROWSABLE"})
 ET.SubElement(f,"data",{android+"scheme":"uz.profiuz.app",android+"host":"auth",android+"path":"/callback"})
tree.write(p,encoding="utf-8",xml_declaration=True)
print("Registered uz.profiuz.app://auth/callback")
