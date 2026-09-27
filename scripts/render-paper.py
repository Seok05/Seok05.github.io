"""Paper 표지: 인쇄된 논문 두 장이 비스듬히 놓인 사진 느낌(배경 투명).
앞장에는 2단 본문(회색 줄), 그림 하나, 형광펜 자국. 글자는 실제 문장을 넣지 않는다.
사용: python3 scripts/render-paper.py assets/covers/paper-sheets.webp"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PW, PH = 1000, 1380  # A4 비율


def page(seed=1, with_figure=True):
    rng = np.random.default_rng(seed)
    im = Image.new("RGBA", (PW, PH), (252, 251, 247, 255))
    d = ImageDraw.Draw(im)
    ink = (48, 50, 56, 255)
    gray = (150, 154, 160, 255)
    light = (186, 190, 196, 255)
    # 제목 두 줄 + 저자 줄
    d.rounded_rectangle([110, 120, 780, 150], 6, fill=ink)
    d.rounded_rectangle([110, 166, 620, 196], 6, fill=ink)
    d.rounded_rectangle([110, 232, 460, 246], 4, fill=gray)
    d.rounded_rectangle([110, 262, 380, 274], 4, fill=light)
    # 초록 (한 단 폭)
    y = 330
    for k in range(6):
        w = 780 if k < 5 else 520
        d.rounded_rectangle([110, y, 110 + w, y + 13], 3, fill=light)
        y += 26
    # 2단 본문
    cols = [(110, 520), (560, 890)]
    y0 = 520
    for ci, (x1, x2) in enumerate(cols):
        y = y0
        fig_top = 760 if (with_figure and ci == 1) else None
        while y < PH - 120:
            if fig_top is not None and fig_top <= y < fig_top + 330:
                y = fig_top + 330 + 12
                continue
            w = (x2 - x1) * (0.72 + 0.28 * rng.random())
            if rng.random() < 0.08:
                w = (x2 - x1) * 0.45
                d.rounded_rectangle([x1, y, x1 + w, y + 12], 3, fill=light)
                y += 40
                continue
            d.rounded_rectangle([x1, y, x1 + w, y + 12], 3, fill=light)
            y += 24
        if fig_top is not None:
            # 그림: 축 + 곡선 두 개 + 점
            fx1, fy1, fx2, fy2 = x1 + 10, fig_top + 10, x2 - 10, fig_top + 290
            d.rectangle([fx1, fy1, fx2, fy2], fill=(255, 255, 255, 255), outline=(200, 203, 208, 255), width=2)
            ax = (fx1 + 34, fy1 + 20, fx2 - 16, fy2 - 34)
            d.line([ax[0], ax[1], ax[0], ax[3], ax[2], ax[3]], fill=(90, 94, 100, 255), width=3)
            xs = np.linspace(ax[0] + 8, ax[2] - 8, 60)
            t = np.linspace(0, 1, 60)
            y1c = ax[3] - (ax[3] - ax[1]) * (0.15 + 0.7 * (1 - np.exp(-3.2 * t)))
            y2c = ax[3] - (ax[3] - ax[1]) * (0.12 + 0.5 * (1 - np.exp(-2.0 * t)))
            d.line(list(zip(xs, y1c)), fill=(63, 55, 201, 255), width=4, joint="curve")
            d.line(list(zip(xs, y2c)), fill=(150, 154, 160, 255), width=4, joint="curve")
            for px, py in list(zip(xs, y1c))[::7]:
                d.ellipse([px - 5, py - 5, px + 5, py + 5], fill=(63, 55, 201, 255), outline=(255, 255, 255, 255), width=2)
            # 캡션
            d.rounded_rectangle([x1 + 10, fy2 + 12, x2 - 60, fy2 + 22], 3, fill=gray)
    # 형광펜 자국 (왼쪽 단 몇 줄)
    hl = Image.new("RGBA", im.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    for yy in (568, 592, 616):
        hd.rounded_rectangle([104, yy - 4, 470 + int(rng.random() * 40), yy + 18], 6, fill=(255, 224, 80, 150))
    im.alpha_composite(hl)
    # 종이 결
    noise = (rng.random((PH, PW)) * 8).astype(np.uint8)
    n = Image.fromarray(noise, "L").filter(ImageFilter.GaussianBlur(0.6))
    a = np.array(im).astype(np.int16)
    a[:, :, :3] -= np.array(n)[:, :, None] // 2
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
    return im


def warp(im, quad, size):
    """quad: 출력에서 종이의 네 꼭짓점 (좌상, 우상, 우하, 좌하)"""
    w, h = im.size
    # PIL 의 QUAD 변환은 출력→입력 방향. 8계수 투시 변환을 푼다.
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    A = []
    b = []
    for (X, Y), (x, y) in zip(quad, src):
        A.append([X, Y, 1, 0, 0, 0, -x * X, -x * Y])
        b.append(x)
        A.append([0, 0, 0, X, Y, 1, -y * X, -y * Y])
        b.append(y)
    coef = np.linalg.solve(np.array(A, dtype=float), np.array(b, dtype=float))
    return im.transform(size, Image.PERSPECTIVE, tuple(coef), resample=Image.BICUBIC)


W, H = 1500, 1200
canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))


def place(sheet, quad, blur=30, alpha=105, dx=22, dy=40):
    layer = warp(sheet, quad, (W, H))
    a = layer.split()[3]
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh.putalpha(a.point(lambda v: int(v * alpha / 255)))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(sh, (dx, dy))
    canvas.alpha_composite(layer)


# 뒷장(살짝 돌아간 빈 종이) → 앞장(그림 있는 논문)
place(page(seed=7, with_figure=False), [(330, 140), (1080, 60), (1210, 1000), (390, 1080)], alpha=80)
place(page(seed=1, with_figure=True), [(250, 200), (990, 150), (1080, 1060), (300, 1110)])

bbox = canvas.getbbox()
canvas = canvas.crop(bbox)
out = sys.argv[1]
canvas.save(out, "WEBP", quality=86, method=6)
print(canvas.size)
