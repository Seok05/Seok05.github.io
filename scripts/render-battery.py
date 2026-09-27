"""배터리 표지: 21700형 원통 셀 세 개를 금속 질감으로 그린다(사진 느낌, 배경 투명).
사용: python3 scripts/render-battery.py assets/covers/battery-cells.webp"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1400, 1050


def cell(width=250, height=760, band=(196, 84, 110)):
    """수직 원통 하나를 RGBA로. 왼쪽 위 조명, 강철 캔 + 위쪽 색 띠 + 양극 단자."""
    pad = 60
    w, h = width + pad * 2, height + pad * 2
    img = np.zeros((h, w, 4), dtype=np.float32)
    x = np.linspace(-1, 1, width)
    nx = x
    nz = np.sqrt(np.clip(1 - nx**2, 0, 1))
    # 조명 방향 (왼쪽 위 앞)
    lx, lz = -0.55, 0.83
    diff = np.clip(nx * lx + nz * lz, 0, 1)
    spec = np.clip(nx * (-0.35) + nz * 0.94, 0, 1) ** 40
    rim = np.clip(1 - nz, 0, 1) ** 2
    base = np.array([70, 76, 86]) / 255.0
    hi = np.array([222, 226, 232]) / 255.0
    col = base[None, :] * (0.35 + 0.65 * diff[:, None]) + hi[None, :] * (0.55 * spec[:, None]) + 0.08 * rim[:, None]
    col = np.clip(col, 0, 1)
    body = np.repeat(col[None, :, :], height, axis=0)
    # 세로 브러시 결
    grain = (np.random.default_rng(3).random((height, width)) - 0.5) * 0.035
    body = np.clip(body + grain[:, :, None], 0, 1)
    # 위쪽 색 띠 (절연 링) 와 아래 살짝 어둡게
    band_c = np.array(band) / 255.0
    y = np.arange(height)
    band_mask = ((y > 74) & (y < 112))[:, None, None]
    band_body = np.broadcast_to(band_c[None, None, :] * (0.45 + 0.6 * diff[None, :, None]), body.shape)
    body = np.where(band_mask, band_body, body)
    fade = (1 - 0.18 * (y / height))[:, None, None]
    body = body * fade
    # 원통 본체 놓기 (위·아래 타원 곡률)
    ry = int(width * 0.16)
    img[pad : pad + height, pad : pad + width, :3] = body
    img[pad : pad + height, pad : pad + width, 3] = 1
    pil = Image.fromarray((img * 255).astype(np.uint8), "RGBA")
    d = ImageDraw.Draw(pil)
    # 아래 곡면: 본체 바깥의 아래 모서리를 타원으로 깎는다
    mask = Image.new("L", pil.size, 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([pad, pad + ry, pad + width, pad + height - ry], fill=255)
    md.ellipse([pad, pad + height - 2 * ry, pad + width, pad + height], fill=255)
    md.ellipse([pad, pad, pad + width, pad + 2 * ry], fill=255)
    a = np.array(pil)
    a[:, :, 3] = np.minimum(a[:, :, 3], np.array(mask))
    pil = Image.fromarray(a, "RGBA")
    d = ImageDraw.Draw(pil)
    # 윗면: 밝은 강철 원판 + 링 + 양극 단자
    top = [pad, pad, pad + width, pad + 2 * ry]
    d.ellipse(top, fill=(170, 176, 186, 255))
    inner = [pad + width * 0.08, pad + ry * 0.16, pad + width * 0.92, pad + ry * 1.84]
    d.ellipse(inner, fill=(120, 126, 136, 255))
    nub = [pad + width * 0.32, pad + ry * 0.05, pad + width * 0.68, pad + ry * 1.25]
    d.ellipse([nub[0], nub[1] + ry * 0.35, nub[2], nub[3] + ry * 0.35], fill=(96, 101, 110, 255))
    d.ellipse(nub, fill=(205, 210, 218, 255))
    d.ellipse([nub[0] + width * 0.06, nub[1] + ry * 0.15, nub[2] - width * 0.06, nub[3] - ry * 0.25], fill=(232, 236, 240, 255))
    return pil


def shadow_of(layer, blur=28, alpha=110, dx=26, dy=34):
    a = layer.split()[3]
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sh.putalpha(a.point(lambda v: int(v * alpha / 255)))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    return sh, dx, dy


canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
# 뒤에서 앞으로: 왼쪽 뒤, 오른쪽 뒤, 가운데 앞
spec = [
    (cell(236, 720), -14, (250, 120)),
    (cell(236, 720), 11, (760, 140)),
    (cell(262, 790), -4, (500, 180)),
]
for layer, ang, (x, y) in spec:
    rot = layer.rotate(ang, resample=Image.BICUBIC, expand=True)
    sh, dx, dy = shadow_of(rot)
    canvas.alpha_composite(sh, (x + dx, y + dy))
    canvas.alpha_composite(rot, (x, y))

bbox = canvas.getbbox()
canvas = canvas.crop(bbox)
out = sys.argv[1]
canvas.save(out, "WEBP", quality=88, method=6)
print(canvas.size)
