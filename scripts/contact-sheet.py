"""썸네일 콘택트 시트: 라이트·다크 각각 한 장(6열)으로 모아 한눈에 한 세트인지 본다.
사용: python3 scripts/contact-sheet.py [assets/thumbs] [출력 경로 접두어]  → <접두어>-light.png, <접두어>-dark.png"""
import os
import sys
from PIL import Image, ImageDraw

base = sys.argv[1] if len(sys.argv) > 1 else "assets/thumbs"
out = sys.argv[2] if len(sys.argv) > 2 else "contact-sheet"
PAGE = {"light": (0xFF, 0xFF, 0xFF), "dark": (0x0F, 0x11, 0x15)}  # 사이트 바탕색 위에 놓고 본다
LINE = {"light": (0xE8, 0xEA, 0xED), "dark": (0x26, 0x2A, 0x31)}  # 사이트의 1px 선
names = sorted(f for f in os.listdir(base) if f.endswith(".webp"))
cols, tw, th, gap = 6, 320, 200, 16
rows = -(-len(names) // cols)
for theme in ("light", "dark"):
    d = base if theme == "light" else os.path.join(base, "dark")
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap), PAGE[theme])
    draw = ImageDraw.Draw(sheet)
    for i, f in enumerate(names):
        p = os.path.join(d, f)
        x, y = gap + (i % cols) * (tw + gap), gap + (i // cols) * (th + gap)
        if os.path.exists(p):
            sheet.paste(Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS), (x, y))
        draw.rectangle([x, y, x + tw - 1, y + th - 1], outline=LINE[theme])
    sheet.save("%s-%s.png" % (out, theme))
    print("ok", theme, len(names), "장")
