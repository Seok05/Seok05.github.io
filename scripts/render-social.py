"""공유 카드(og:image): 글마다 1200×630 JPG. 링크를 카카오톡·슬랙에 붙였을 때 뜨는 그림이라 사이트와 같은 얼굴로 그린다.
흰 바탕, 왼쪽에 로고마크 + Seok Lab + 제목(최대 3줄) + 메타(시리즈 표기 · 날짜 · 그날의 숫자), 오른쪽에 썸네일(라이트 벌).
글꼴은 로컬 Pretendard가 있으면 그것, 없으면 Apple SD Gothic Neo(획·자폭이 비슷해 카드 크기에서는 구분이 어렵다).

사용: python3 scripts/render-social.py [assets/social] [slug …]   (slug를 주면 그 글만)
새 글을 올릴 때 한 번 돌리고 build-meta.mjs를 돌리면 og 태그까지 붙는다. PLAN.md 4.1 / DESIGN.md §4."""
import json
import os
import re
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
OUT = ARGS[0] if ARGS else "assets/social"
ONLY = ARGS[1:]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

W, H = 1200, 630
M = 72                      # 바깥 여백
THUMB_W, THUMB_H = 400, 250 # 오른쪽 썸네일
GAP = 56                    # 글과 썸네일 사이
TEXT_W = W - 2 * M - THUMB_W - GAP  # 제목이 쓸 수 있는 폭 = 600
BG, STRONG, SUB, LINE, ACCENT, THUMB_BG = "#ffffff", "#191f28", "#6b7684", "#d7dbe0", "#2f6fed", "#eaeef3"


def load_posts():
    js = 'global.window={};require(%s);console.log(JSON.stringify(window.SEOK))' % json.dumps(os.path.join(ROOT, "assets/posts.js"))
    return json.loads(subprocess.check_output(["node", "-e", js]))


def find_font(weight):
    """weight: 'bold' | 'medium' | 'regular'. Pretendard(otf) → Apple SD Gothic Neo(ttc) 순서."""
    names = {"bold": ["Pretendard-Bold", "Pretendard-SemiBold"], "medium": ["Pretendard-Medium"], "regular": ["Pretendard-Regular"]}[weight]
    for d in (os.path.expanduser("~/Library/Fonts"), "/Library/Fonts"):
        for n in names:
            for ext in (".otf", ".ttf"):
                p = os.path.join(d, n + ext)
                if os.path.exists(p):
                    return p, 0
    ttc = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
    want = {"bold": "Bold", "medium": "Medium", "regular": "Regular"}[weight]
    for i in range(12):
        try:
            f = ImageFont.truetype(ttc, 20, index=i)
        except (OSError, IndexError):
            break
        if f.getname()[1] == want:
            return ttc, i
    return ttc, 0


FONTS = {w: find_font(w) for w in ("bold", "medium", "regular")}


def font(weight, size):
    path, idx = FONTS[weight]
    return ImageFont.truetype(path, size, index=idx)


def wrap(draw, text, fnt, width):
    """단어 단위로 줄을 나눈다(keep-all). 한 단어가 폭을 넘으면 글자 단위로 자른다."""
    lines, cur = [], ""
    for word in text.split(" "):
        cand = (cur + " " + word).strip()
        if draw.textlength(cand, font=fnt) <= width:
            cur = cand
            continue
        if cur:
            lines.append(cur)
        if draw.textlength(word, font=fnt) <= width:
            cur = word
        else:
            cur = ""
            for ch in word:
                if draw.textlength(cur + ch, font=fnt) <= width:
                    cur += ch
                else:
                    lines.append(cur)
                    cur = ch
    if cur:
        lines.append(cur)
    return lines


def fit_title(draw, text, width, max_lines=3):
    """52 → 48 → 44 → 40으로 줄여 3줄에 넣는다. 그래도 넘치면 마지막 줄을 …로 자르고 경고."""
    for size in (52, 48, 44, 40):
        fnt = font("bold", size)
        lines = wrap(draw, text, fnt, width)
        if len(lines) <= max_lines:
            return fnt, lines, False
    fnt = font("bold", 40)
    lines = wrap(draw, text, fnt, width)[:max_lines]
    last = lines[-1]
    while draw.textlength(last + "…", font=fnt) > width and last:
        last = last[:-1]
    lines[-1] = last + "…"
    return fnt, lines, True


def series_tag(title):
    m = re.match(r"^(.+?)\s\[(\d+)\]\s—\s(.*)$", title)
    return (m.group(1) + " " + str(int(m.group(2))), m.group(3)) if m else (None, title)


def draw_mark(draw, x, y, s):
    """로고마크: 층상 산화물 두 겹 사이를 떠나는 Na 이온(favicon.svg와 같은 좌표, 64 기준)."""
    k = s / 64.0
    P = lambda px, py: (x + px * k, y + py * k)
    for pts in (((9, 21), (18, 14), (27, 21), (36, 14), (45, 21), (54, 14)), ((9, 50), (18, 43), (27, 50), (36, 43), (45, 50), (54, 43))):
        draw.line([P(*p) for p in pts], fill=STRONG, width=max(2, round(5.2 * k)), joint="curve")
    cx, cy, r = P(22.5, 32)[0], P(22.5, 32)[1], 5.6 * k
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=LINE, width=max(1, round(2.2 * k)))
    cx, cy, r = P(42.5, 32)[0], P(42.5, 32)[1], 6.4 * k
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT)


def render(p, cats, out_dir):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    # 머리: 마크 + Seok Lab + 한 줄
    draw_mark(d, M, M - 2, 30)
    f_name, f_tag = font("bold", 24), font("regular", 20)
    d.text((M + 42, M), "Seok Lab", font=f_name, fill=STRONG)
    d.text((M + 42 + d.textlength("Seok Lab", font=f_name) + 16, M + 3), "연구하면서, 개발합니다", font=f_tag, fill=SUB)
    # 제목
    tag, bare = series_tag(p["title"])
    f_title, lines, clipped = fit_title(d, bare, TEXT_W)
    lh = round(f_title.size * 1.3)
    block_h = lh * len(lines)
    y = (H - block_h) // 2 - 10
    for i, ln in enumerate(lines):
        d.text((M, y + i * lh), ln, font=f_title, fill=STRONG)
    # 메타: 시리즈 표기(또는 분류) · 날짜 · 그날의 숫자
    cat = next((c for c in cats if c["key"] == p["cat"]), None)
    parts = [tag or (cat and (cat.get("mark") or cat["name"])) or p["cat"], p["date"]]
    f_meta, f_fig = font("regular", 22), font("bold", 22)
    x, ym = M, H - M - 26
    for i, part in enumerate(parts):
        d.text((x, ym), part, font=f_meta, fill=SUB)
        x += d.textlength(part, font=f_meta)
        if i < len(parts) - 1 or p.get("figure"):
            d.text((x + 10, ym), "·", font=f_meta, fill=LINE)
            x += 10 + d.textlength("·", font=f_meta) + 10
    if p.get("figure"):
        d.text((x, ym), p["figure"], font=f_fig, fill=STRONG)
    # 오른쪽 썸네일(라이트 벌), 모서리 16, 1px 선
    tx, ty = W - M - THUMB_W, (H - THUMB_H) // 2
    thumb_path = os.path.join(ROOT, p["thumb"]) if p.get("thumb") else None
    if thumb_path and os.path.exists(thumb_path):
        th = Image.open(thumb_path).convert("RGB").resize((THUMB_W, THUMB_H), Image.LANCZOS)
    else:
        th = Image.new("RGB", (THUMB_W, THUMB_H), THUMB_BG)
    mask = Image.new("L", (THUMB_W * 2, THUMB_H * 2), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, THUMB_W * 2 - 1, THUMB_H * 2 - 1], radius=32, fill=255)
    im.paste(th, (tx, ty), mask.resize((THUMB_W, THUMB_H), Image.LANCZOS))
    d.rounded_rectangle([tx, ty, tx + THUMB_W - 1, ty + THUMB_H - 1], radius=16, outline=LINE, width=1)
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, p["slug"] + ".jpg")
    im.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    kb = os.path.getsize(out) // 1024
    print("%s %s  %d줄 %dpx %dKB%s" % ("!!" if clipped or kb > 120 else "ok", p["slug"], len(lines), f_title.size, kb, " (잘림)" if clipped else ""))


if __name__ == "__main__":
    D = load_posts()
    out_dir = os.path.join(ROOT, OUT) if not os.path.isabs(OUT) else OUT
    print("글꼴:", {k: (os.path.basename(v[0]), v[1]) for k, v in FONTS.items()})
    for p in D["posts"]:
        if ONLY and p["slug"] not in ONLY:
            continue
        render(p, D["cats"], out_dir)
