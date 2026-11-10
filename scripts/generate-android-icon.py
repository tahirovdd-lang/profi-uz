#!/usr/bin/env python3
"""Generate Android launcher icons from the verified Profi.UZ SVG brand icon."""
from pathlib import Path
from io import BytesIO
from PIL import Image
import cairosvg

root = Path(__file__).resolve().parents[1]
source = root / "profi-icon.svg"
res = root / "android/app/src/main/res"
if not source.is_file():
    raise SystemExit("Missing Profi.UZ icon: profi-icon.svg")
if not res.is_dir():
    raise SystemExit("Android project not generated. Run npx cap add android first.")

# Match the website and Google OAuth logo exactly; do not add another badge or caption.
png = cairosvg.svg2png(url=str(source), output_width=1024, output_height=1024)
icon = Image.open(BytesIO(png)).convert("RGBA")
for density, pixels in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96),
                        ("xxhdpi", 144), ("xxxhdpi", 192)):
    folder = res / ("mipmap-" + density)
    folder.mkdir(parents=True, exist_ok=True)
    scaled = icon.resize((pixels, pixels), Image.Resampling.LANCZOS)
    scaled.save(folder / "ic_launcher.png")
    scaled.save(folder / "ic_launcher_round.png")

# Android 8+ adaptive icons from the default Capacitor template would otherwise
# override the branded launcher PNGs.
for folder_name in ("mipmap-anydpi-v26", "mipmap-anydpi"):
    folder = res / folder_name
    if folder.exists():
        for file in folder.glob("ic_launcher*.xml"):
            file.unlink()
# Replace Capacitor's default white splash with the verified Profi.UZ brand mark.
# Android 12+ system splash uses the launcher icon; older Android uses splash.png.
from PIL import ImageOps
for folder_name in ("drawable", "drawable-land-hdpi", "drawable-land-mdpi",
                    "drawable-land-xhdpi", "drawable-land-xxhdpi", "drawable-land-xxxhdpi",
                    "drawable-port-hdpi", "drawable-port-mdpi", "drawable-port-xhdpi",
                    "drawable-port-xxhdpi", "drawable-port-xxxhdpi"):
    folder = res / folder_name
    splash = folder / "splash.png"
    if splash.exists():
        width, height = Image.open(splash).size
        tile = Image.new("RGBA", (width, height), "#ffffff")
        mark = ImageOps.contain(icon, (int(min(width,height)*0.28), int(min(width,height)*0.28)), Image.Resampling.LANCZOS)
        tile.alpha_composite(mark, ((width-mark.width)//2, (height-mark.height)//2))
        tile.convert("RGB").save(splash)
print("Android launcher and splash match profi-icon.svg")
