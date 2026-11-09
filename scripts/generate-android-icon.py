#!/usr/bin/env python3
"""Generate Android mipmap launcher icons from the existing Profi.UZ brand logo."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import sys

root=Path(__file__).resolve().parents[1]
source=root/"profi-logo.png"
res=root/"android/app/src/main/res"
if not source.is_file():
    raise SystemExit("Brand logo missing: profi-logo.png")
if not res.is_dir():
    raise SystemExit("Android project not generated. Run npx cap add android first.")

logo=Image.open(source).convert("RGBA")
# Preserve the branded artwork, fitting inside a rounded, clean app tile.
size=1024
canvas=Image.new("RGBA",(size,size),(255,255,255,255))
mask=Image.new("L",(size,size),0)
d=ImageDraw.Draw(mask)
d.rounded_rectangle((0,0,size-1,size-1),radius=220,fill=255)
art=ImageOps.contain(logo,(840,790),Image.Resampling.LANCZOS)
canvas.alpha_composite(art,((size-art.width)//2,110+(790-art.height)//2))
# Always include legible product name under the original brand mark.
draw=ImageDraw.Draw(canvas)
font_candidates=[
 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
 "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
]
font_path=next((p for p in font_candidates if Path(p).exists()),None)
if font_path:
 font=ImageFont.truetype(font_path,82)
 text="Profi UZ"
 bbox=draw.textbbox((0,0),text,font=font)
 width=bbox[2]-bbox[0]
 # White semi-transparent label plate ensures contrast over any photo/logo.
 left=(size-width)//2-34
 draw.rounded_rectangle((left,810,left+width+68,930),radius=34,fill=(255,255,255,245))
 draw.text(((size-width)//2,822),text,font=font,fill=(25,50,105,255))
canvas.putalpha(mask)
for name,pixels in (("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)):
 folder=res/("mipmap-"+name)
 folder.mkdir(parents=True,exist_ok=True)
 icon=canvas.resize((pixels,pixels),Image.Resampling.LANCZOS).convert("RGBA")
 icon.save(folder/"ic_launcher.png")
 icon.save(folder/"ic_launcher_round.png")
# Remove old adaptive icon XML entries (Capacitor default icon) and use branded PNG instead.
for folder in ("mipmap-anydpi-v26","mipmap-anydpi"):
 target=res/folder
 if target.exists():
  for f in target.glob("ic_launcher*.xml"):
   f.unlink()
print("Android launcher icon created from profi-logo.png (Profi UZ).")
