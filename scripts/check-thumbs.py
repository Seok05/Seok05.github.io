"""썸네일 검사: 크기 640×400, 라이트·다크 두 벌이 다 있는지, 배경 (8,8) 픽셀이 토큰(--thumb-bg)과 같은지.
어긋난 파일을 출력하고, 하나라도 있으면 종료 코드 1. 사용: python3 scripts/check-thumbs.py [assets/thumbs]"""
import os
import sys
from PIL import Image

TOKEN = {"light": (0xEA, 0xEE, 0xF3), "dark": (0x1A, 0x1F, 0x27)}
TOL = 6  # webp 손실 압축 여유
base = sys.argv[1] if len(sys.argv) > 1 else "assets/thumbs"
names = sorted(f for f in os.listdir(base) if f.endswith(".webp"))
bad = []
for theme, d in (("light", base), ("dark", os.path.join(base, "dark"))):
    for f in names:
        p = os.path.join(d, f)
        if not os.path.exists(p):
            bad.append("%s/%s: 없음" % (theme, f))
            continue
        im = Image.open(p).convert("RGB")
        if im.size != (640, 400):
            bad.append("%s/%s: 크기 %dx%d" % (theme, f, im.size[0], im.size[1]))
        px = im.getpixel((8, 8))
        if max(abs(a - b) for a, b in zip(px, TOKEN[theme])) > TOL:
            bad.append("%s/%s: 배경 #%02x%02x%02x" % ((theme, f) + px))
extra = sorted(f for f in os.listdir(os.path.join(base, "dark")) if f.endswith(".webp") and f not in names) if os.path.isdir(os.path.join(base, "dark")) else []
for f in extra:
    bad.append("dark/%s: 라이트 짝이 없음" % f)
print("%d장 × 2벌: %s" % (len(names), "통과" if not bad else "%d건 어긋남" % len(bad)))
for b in bad:
    print("  " + b)
sys.exit(1 if bad else 0)
