"""공유 카드 검사: posts.js의 글마다 assets/social/<slug>.jpg가 있고 1200×630이며 120KB 이하인지,
글 HTML에 og:image가 그 파일을 가리키는지. 어긋나면 종료 코드 1. 사용: python3 scripts/check-social.py"""
import json
import os
import re
import subprocess
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.loads(subprocess.check_output(["node", "-e", 'global.window={};require(%s);console.log(JSON.stringify(window.SEOK))' % json.dumps(os.path.join(ROOT, "assets/posts.js"))]))
bad = []
for p in D["posts"]:
    f = os.path.join(ROOT, "assets/social", p["slug"] + ".jpg")
    if not os.path.exists(f):
        bad.append(p["slug"] + ": 카드 없음")
        continue
    im = Image.open(f)
    if im.size != (1200, 630):
        bad.append("%s: 크기 %dx%d" % (p["slug"], im.size[0], im.size[1]))
    kb = os.path.getsize(f) // 1024
    if kb > 120:
        bad.append("%s: %dKB" % (p["slug"], kb))
    html = open(os.path.join(ROOT, "posts", p["slug"] + ".html")).read()
    m = re.search(r'property="og:image" content="([^"]+)"', html)
    if not m or not m.group(1).endswith("/assets/social/%s.jpg" % p["slug"]):
        bad.append(p["slug"] + ": og:image 태그 없음 또는 다른 파일")
    for tag in ("og:title", "og:description", "og:url", "twitter:card"):
        if tag not in html:
            bad.append("%s: %s 없음" % (p["slug"], tag))
print("%d편: %s" % (len(D["posts"]), "통과" if not bad else "%d건 어긋남" % len(bad)))
for b in bad:
    print("  " + b)
sys.exit(1 if bad else 0)
