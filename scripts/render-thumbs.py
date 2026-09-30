"""화면 캡처 글(첫잔·EValue·배터리)의 카드 썸네일: 캡처를 기기 프레임에 넣어 한 캔버스 규칙으로.
직접 그린 그림(render-illustrations.py)과 같은 배경 토큰을 쓰고, 라이트·다크 두 벌을 만든다.
2560×1600으로 그려 640×400 webp로 줄인다(모서리가 매끈하게).

사용: python3 scripts/render-thumbs.py [assets/shots] [assets/thumbs] [slug …]

규칙(PLAN.md 4.5):
  phone   480×1040 폰 화면. 캔버스 가운데, 폭 46%, 위 12%에서 시작해 아래로 잘린다. 프레임 #1c1f24
  browser 1200×750 브라우저 화면. 오른쪽 아래에 폭 80%, 오른쪽·아래로 6% 흘린다. 12px 바에 점 셋
  card    960×720 카드 그림. 가운데, 폭 80%, 위 12%에서 시작해 아래로 잘린다
  다크 벌에서도 화면 내용은 그대로(밝은 화면을 켠 기기로 읽힌다). 캔버스·프레임 선만 다크 토큰."""
import os
import sys
from PIL import Image, ImageDraw

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
SHOTS_DIR = ARGS[0] if ARGS else "assets/shots"
OUT = ARGS[1] if len(ARGS) > 1 else "assets/thumbs"
ONLY = ARGS[2:]

S = 4  # 640×400 × 4 = 2560×1600에 그려서 줄인다
CW, CH = 640 * S, 400 * S

THEMES = {
    "light": dict(bg="#eaeef3", line="#d7dbe0", phone="#1c1f24", phone_edge="#1c1f24", win="#ffffff", bar="#f1f3f5", bar_line="#e6e8eb", dot="#c9ced6"),
    "dark": dict(bg="#1a1f27", line="#343a43", phone="#2a3038", phone_edge="#3a414b", win="#171a20", bar="#171a20", bar_line="#343a43", dot="#626b77"),
}

# slug → (종류, 캡처 파일, 화면 안에서 보여줄 시작 높이(원본 px))
SHOTS = {
    "cheotjan-ai-smell": ("phone", "onboarding.webp", 0),
    "cheotjan-delete-account": ("phone", "settings.webp", 0),
    "cheotjan-first-steps": ("phone", "first-steps.webp", 0),
    "cheotjan-mfds-504": ("phone", "search-list.webp", 0),
    "cheotjan-no-numbers": ("phone", "search.webp", 0),
    "cheotjan-robots-gsshop": ("phone", "bottle-ardbeg.webp", 0),
    "cheotjan-score-60": ("phone", "note-detail.webp", 0),
    "cheotjan-things-removed": ("phone", "shelf.webp", 0),
    "cheotjan-two-fingerprints": ("phone", "bars.webp", 0),
    "cheotjan-apk-103mb": ("card", "bottle-art-trio.webp", 0),
    "cheotjan-fingerprint": ("card", "icon-old-new.webp", 0),
    "price-band": ("browser", "evalue-price-band.webp", 0),
    "cohort-fallback": ("browser", "evalue-cohort.webp", 0),
    "graph-first": ("browser", "evalue-trend.webp", 0),
    "theil-sen": ("browser", "evalue-trend-zoom.webp", 0),
    "sold-day-attribution": ("browser", "evalue-results.webp", 0),
    "battery-soh-range": ("browser", "evalue-report-battery.webp", 0),
}


def rounded(size, radius, fill):
    """둥근 사각형 한 장(RGBA)."""
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=fill)
    return im


def fit_width(shot, width, y0):
    """캡처를 width에 맞춰 줄이고 y0(원본 px)부터 아래를 남긴다."""
    scale = width / shot.width
    im = shot.resize((width, max(1, round(shot.height * scale))), Image.LANCZOS)
    return im.crop((0, round(y0 * scale), width, im.height))


def paste_clipped(canvas, im, xy, mask=None):
    """캔버스 밖으로 나가는 부분은 버리고 붙인다."""
    x, y = xy
    box = (max(0, -x), max(0, -y), min(im.width, CW - x), min(im.height, CH - y))
    if box[2] <= box[0] or box[3] <= box[1]:
        return
    part = im.crop(box)
    m = mask.crop(box) if mask is not None else (part if part.mode == "RGBA" else None)
    canvas.paste(part, (x + box[0], y + box[1]), m)


def draw_phone(canvas, shot, y0, t):
    w = round(CW * 0.46)
    pad = round(w * 0.026)
    r_out, r_in = round(w * 0.14), round(w * 0.11)
    screen_w = w - 2 * pad
    screen = fit_width(shot, screen_w, y0)
    h = screen.height + 2 * pad
    x = (CW - w) // 2
    y = round(CH * 0.12)
    frame = rounded((w, h), r_out, t["phone"])
    ImageDraw.Draw(frame).rounded_rectangle([0, 0, w - 1, h - 1], radius=r_out, outline=t["phone_edge"], width=S)
    paste_clipped(canvas, frame, (x, y))
    mask = rounded((screen_w, screen.height), r_in, (255, 255, 255, 255))
    paste_clipped(canvas, screen.convert("RGBA"), (x + pad, y + pad), mask)


def draw_browser(canvas, shot, y0, t):
    w = round(CW * 0.80)
    bar = 12 * S
    r = 6 * S
    content = fit_width(shot, w - 2 * S, y0)
    h = bar + content.height + 2 * S
    x = CW + round(CW * 0.06) - w
    y = CH + round(CH * 0.06) - h
    win = rounded((w, h), r, t["win"])
    d = ImageDraw.Draw(win)
    d.rounded_rectangle([0, 0, w - 1, bar + r], radius=r, fill=t["bar"])
    d.rectangle([0, r, w - 1, bar - 1], fill=t["bar"])
    d.line([(0, bar), (w - 1, bar)], fill=t["bar_line"], width=S)
    for i in range(3):
        cx = 6 * S + i * 7 * S + 2 * S
        d.ellipse([cx - 2 * S, bar // 2 - 2 * S, cx + 2 * S, bar // 2 + 2 * S], fill=t["dot"])
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, outline=t["line"], width=S)
    paste_clipped(canvas, win, (x, y))
    paste_clipped(canvas, content.convert("RGBA"), (x + S, y + bar + S))


def draw_card(canvas, shot, y0, t):
    w = round(CW * 0.80)
    r = 10 * S
    content = fit_width(shot, w - 2 * S, y0)
    h = content.height + 2 * S
    x = (CW - w) // 2
    y = round(CH * 0.12)
    card = rounded((w, h), r, t["win"])
    ImageDraw.Draw(card).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, outline=t["line"], width=S)
    paste_clipped(canvas, card, (x, y))
    mask = rounded(content.size, r - S, (255, 255, 255, 255))
    paste_clipped(canvas, content.convert("RGBA"), (x + S, y + S), mask)


DRAW = {"phone": draw_phone, "browser": draw_browser, "card": draw_card}


def render(slug, kind, shot_file, y0):
    shot = Image.open(os.path.join(SHOTS_DIR, shot_file)).convert("RGB")
    for theme, t in THEMES.items():
        canvas = Image.new("RGBA", (CW, CH), t["bg"])
        DRAW[kind](canvas, shot, y0, t)
        out_dir = OUT if theme == "light" else os.path.join(OUT, "dark")
        os.makedirs(out_dir, exist_ok=True)
        canvas.convert("RGB").resize((640, 400), Image.LANCZOS).save(os.path.join(out_dir, slug + ".webp"), "WEBP", quality=84, method=6)
        print("ok", theme, slug)


if __name__ == "__main__":
    for slug, (kind, f, y0) in SHOTS.items():
        if ONLY and slug not in ONLY:
            continue
        render(slug, kind, f, y0)
