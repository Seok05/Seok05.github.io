"""연구 글(DFT·Paper) 카드 썸네일: 글 내용을 그림으로. 도표 캡처 대신 직접 그린다.
matplotlib(Agg)로 1280×800에 그려 640×400 webp로 줄인다. 글자는 넣지 않는다.
라이트·다크 두 벌을 만든다(assets/thumbs/<slug>.webp, assets/thumbs/dark/<slug>.webp).
글 안 그림(assets/illus, 1280×800)도 두 벌(assets/illus/dark).
사용: python3 scripts/render-illustrations.py assets/thumbs assets/illus [--theme=light|dark|both] [함수 이름 …]
색 규칙은 DESIGN.md §3·PLAN.md 4.5: 배경 --thumb-bg, 선 --graphite, 강조 --accent, 경고 --warm. 원자 색은 VESTA."""
import sys
import os
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon, FancyArrowPatch, Ellipse, RegularPolygon
from matplotlib.colors import to_rgb
from PIL import Image

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
OUT = ARGS[0] if ARGS else "assets/thumbs"      # 640×400 썸네일 (다크는 OUT/dark)
FULL = ARGS[1] if len(ARGS) > 1 else "assets/illus"      # 1280×800 글 안 그림 (다크는 FULL/dark)
FUNCS = ARGS[2:]                                  # 함수 이름을 주면 그 그림만
_theme_arg = [a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--theme=")]
THEMES_TO_RUN = ["light", "dark"] if not _theme_arg or _theme_arg[0] == "both" else [_theme_arg[0]]
W, H = 12.8, 8.0  # inches @100dpi → 1280×800

# 테마 토큰(DESIGN.md §3). 관측은 회색(GRAPH), 판단·강조는 파랑(INDIGO라는 옛 이름을 그대로 쓰되 값은 --accent),
# 경고는 WARM. 원자 색(VESTA 관례)과 구의 빛·그늘은 테마를 따르지 않는다.
THEMES = {
    "light": dict(BG="#eaeef3", INK="#191f28", GRAPH="#6b7684", ACCENT="#2f6fed", WARM="#c2570c"),
    "dark": dict(BG="#1a1f27", INK="#eceef1", GRAPH="#8f98a4", ACCENT="#6ea2ff", WARM="#f0a35e"),
}
MN, O, NA = "#9C7AC7", "#E8483C", "#F1D24B"
SHADE, HILITE = "#2a2530", "#ffffff"
THEME = "light"
BG = INK = GRAPH = INDIGO = WARM = None


def set_theme(name):
    global THEME, BG, INK, GRAPH, INDIGO, WARM
    THEME = name
    t = THEMES[name]
    BG, INK, GRAPH, INDIGO, WARM = t["BG"], t["INK"], t["GRAPH"], t["ACCENT"], t["WARM"]


set_theme("light")


def mix(c, t, to=None):
    """c를 t만큼 to 쪽으로. to를 안 주면 캔버스 배경 쪽으로(옅게). 그래서 다크에서는 어두워지고 라이트에서는 밝아진다."""
    a, b = np.array(to_rgb(c)), np.array(to_rgb(BG if to is None else to))
    return tuple(a * (1 - t) + b * t)


def sphere(ax, x, y, r, color, z=5, alpha=1.0, shadow=True):
    """동심원 겹치기로 명암을 낸 구. 빛은 왼쪽 위."""
    if shadow:
        ax.add_patch(Ellipse((x + r * 0.25, y - r * 1.05), r * 2.1, r * 0.55, color=mix(SHADE, 0.82), alpha=0.35 * alpha, zorder=z - 0.5, lw=0))
    n = 16
    for i in range(n):
        t = i / n
        rr = r * (1 - t * 0.92)
        ax.add_patch(Circle((x - r * 0.28 * t, y + r * 0.28 * t), rr, color=mix(mix(color, 0.35, SHADE), t ** 1.4 * 0.9, HILITE), alpha=alpha, zorder=z + i * 1e-3, lw=0))


def bond(ax, p, q, color=GRAPH, lw=6, z=4, alpha=1):
    ax.plot([p[0], q[0]], [p[1], q[1]], color=mix(color, 0.15, HILITE), lw=lw, solid_capstyle="round", zorder=z, alpha=alpha)
    ax.plot([p[0], q[0]], [p[1], q[1]], color=mix(color, 0.55, HILITE), lw=lw * 0.35, solid_capstyle="round", zorder=z + 1e-3, alpha=alpha)


def cloud(ax, x, y, sx, sy, color, alpha=0.9, z=2, n=24):
    for i in range(n):
        t = i / n
        ax.add_patch(Ellipse((x, y), sx * 2 * (1 - t), sy * 2 * (1 - t), color=color, alpha=alpha * 0.055, zorder=z, lw=0))


def proj(p, elev=18, azim=-32):
    e, a = np.radians(elev), np.radians(azim)
    x, y, zz = p
    x1 = x * np.cos(a) - y * np.sin(a)
    y1 = x * np.sin(a) + y * np.cos(a)
    y2 = y1 * np.cos(e) - zz * np.sin(e)
    z2 = y1 * np.sin(e) + zz * np.cos(e)
    return np.array([x1, z2, -y2])


def canvas(bg=None):
    bg = BG if bg is None else bg
    fig = plt.figure(figsize=(W, H), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1280)
    ax.set_ylim(0, 800)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.patch.set_facecolor(bg)
    return fig, ax


def save(fig, name):
    out_dir = OUT if THEME == "light" else os.path.join(OUT, "dark")
    os.makedirs(out_dir, exist_ok=True)
    p = os.path.join(out_dir, name + ".png")
    fig.savefig(p, dpi=100, facecolor=fig.get_facecolor())
    plt.close(fig)
    full = Image.open(p).convert("RGB")
    full_dir = FULL if THEME == "light" else os.path.join(FULL, "dark")
    os.makedirs(full_dir, exist_ok=True)
    full.save(os.path.join(full_dir, name + ".webp"), "WEBP", quality=84, method=6)
    full.resize((640, 400), Image.LANCZOS).save(os.path.join(out_dir, name + ".webp"), "WEBP", quality=84, method=6)
    os.remove(p)
    print("ok", THEME, name)


# ── 이론 [1] 밀도: 원자 주변 전자 밀도 지형 ─────────────────────
def dft_explained():
    fig, ax = canvas()
    xs, ys = np.meshgrid(np.linspace(0, 1280, 320), np.linspace(0, 800, 200))
    atoms = [(420, 400, 1.0), (760, 470, 1.0), (590, 250, 0.55), (600, 590, 0.55), (930, 300, 0.5), (260, 560, 0.45)]
    d = np.zeros_like(xs)
    for x, y, a in atoms:
        d += a * np.exp(-((xs - x) ** 2 + (ys - y) ** 2) / (2 * 95 ** 2))
    levels = np.linspace(0.08, d.max(), 9)
    cmap = matplotlib.colors.LinearSegmentedColormap.from_list("dens", [mix(INDIGO, 0.92), mix(INDIGO, 0.35), INDIGO])
    ax.contourf(xs, ys, d, levels=levels, cmap=cmap, alpha=0.9, zorder=1)
    ax.contour(xs, ys, d, levels=levels, colors=[mix(INDIGO, 0.2, INK)], linewidths=0.9, alpha=0.5, zorder=2)
    for x, y, a in atoms:
        sphere(ax, x, y, 22 if a > 0.9 else 15, MN if a > 0.9 else O, z=5, shadow=False)
    save(fig, "dft-explained")


# ── 실습 [1] 첫 계산: 단위 격자 상자 안의 원자 12개 ────────────
def first_dft_run():
    fig, ax = canvas()
    a, c = 2.95, 15.8
    # 긴 c축을 화면 가로로 눕힌다 (12원자 셀은 바늘처럼 길다)
    a3, a1, a2 = np.array([c, 0, 0]), np.array([0, a, 0]), np.array([0, -a / 2, a * np.sqrt(3) / 2])
    raw = lambda v: proj(v, 22, -18)
    pts = [raw(v) for v in (np.zeros(3), a1, a2, a3, a1 + a2, a1 + a3, a2 + a3, a1 + a2 + a3)]
    xs_, ys_ = [q[0] for q in pts], [q[1] for q in pts]
    S = min(1080 / (max(xs_) - min(xs_)), 620 / (max(ys_) - min(ys_)))
    cx, cy = (max(xs_) + min(xs_)) / 2, (max(ys_) + min(ys_)) / 2
    def P(v):
        q = raw(v)
        return np.array([640 + (q[0] - cx) * S, 400 + (q[1] - cy) * S]), q[2]
    corners = [o for o in (np.zeros(3), a1, a2, a1 + a2)]
    edges = []
    for o in corners:
        edges.append((o, o + a3))
    for base in (np.zeros(3), a3):
        edges += [(base, base + a1), (base, base + a2), (base + a1, base + a1 + a2), (base + a2, base + a1 + a2)]
    for p, q in edges:
        (x1, y1), _ = P(p)
        (x2, y2), _ = P(q)
        ax.plot([x1, x2], [y1, y2], color=mix(GRAPH, 0.35), lw=2.2, zorder=1, solid_capstyle="round")
    # 원자: Na·Mn·O 층 (12개, 이상화 O3)
    atoms = []
    for k, (na_z, mn_z, o1, o2) in enumerate(((0, 0.5, 0.26, 0.74),)):
        pass
    z_na, z_mn = [0, 1 / 3, 2 / 3], [1 / 6, 1 / 2, 5 / 6]
    z_o = [1 / 6 - 0.061, 1 / 6 + 0.061, 1 / 2 - 0.061, 1 / 2 + 0.061, 5 / 6 - 0.061, 5 / 6 + 0.061]
    site = {"A": np.zeros(3), "B": (a1 + 2 * a2) / 3, "C": (2 * a1 + a2) / 3}
    for i, z in enumerate(z_na):
        atoms.append((NA, 20, site["ABC"[i]] + z * a3))
    for i, z in enumerate(z_mn):
        atoms.append((MN, 15, site["CAB"[i]] + z * a3))
    for i, z in enumerate(z_o):
        atoms.append((O, 11, site["BCACAB"[i]] + z * a3))
    items = []
    for col, r, v in atoms:
        (x, y), dep = P(v)
        items.append((dep, x, y, r, col))
    for dep, x, y, r, col in sorted(items):
        sphere(ax, x, y, r * 1.6, col, z=5 + dep * 0.01, shadow=False)
    save(fig, "first-dft-run")


# ── 이론 [2] 자기모멘트 12: Mn 셋, 각각 위로 선 스핀 화살표 ─────
def dft_theory_2():
    fig, ax = canvas()
    for i, x in enumerate((360, 640, 920)):
        cloud(ax, x, 400, 150, 150, MN, alpha=0.5)
        sphere(ax, x, 330, 70, MN, z=5)
        ax.add_patch(FancyArrowPatch((x, 420), (x, 640), arrowstyle="simple,head_length=26,head_width=30,tail_width=11", color=INDIGO, zorder=8, lw=0))
        for j in range(4):  # d 전자 넷: 작은 화살표
            ax.add_patch(FancyArrowPatch((x - 54 + j * 36, 150), (x - 54 + j * 36, 215), arrowstyle="simple,head_length=9,head_width=11,tail_width=3.5", color=mix(INDIGO, 0.25), zorder=8, lw=0))
        ax.plot([x - 70, x + 70], [150, 150], color=mix(GRAPH, 0.3), lw=2, zorder=7)
    save(fig, "dft-theory-2")


# ── 실습 [2] 평면파 기저와 컷오프 ───────────────────────────────
def dft_practice_2():
    fig, ax = canvas()
    xs = np.linspace(120, 1160, 900)
    cut = 860
    for i in range(8):
        f = 1 + i * 0.9
        y0 = 700 - i * 78
        amp = 26
        y = y0 + amp * np.sin((xs - 120) / 1040 * 2 * np.pi * f)
        left = xs <= cut
        ax.plot(xs[left], y[left], color=mix(INDIGO, i / 10), lw=3.2, zorder=3)
        ax.plot(xs[~left], y[~left], color=mix(INDIGO, 0.75), lw=2.2, zorder=2, alpha=0.55, ls=(0, (4, 5)))
    ax.axvspan(cut, 1160, color=mix(WARM, 0.85), alpha=0.6, zorder=1)
    ax.plot([cut, cut], [90, 760], color=WARM, lw=3, zorder=4)
    save(fig, "dft-practice-2")


# ── 이론 [3] 국재화: 퍼진 d 전자(GGA)와 제자리에 앉은 d 전자(+U) ──
def dft_theory_3():
    fig, ax = canvas()
    cloud(ax, 400, 400, 300, 240, INDIGO, alpha=0.55)
    sphere(ax, 400, 400, 46, MN, z=6)
    for k in range(3):
        ax.add_patch(Ellipse((400, 400), 380 + k * 90, 300 + k * 70, fill=False, ec=mix(INDIGO, 0.5), lw=1.2, ls=(0, (3, 6)), zorder=2))
    ax.add_patch(FancyArrowPatch((640, 400), (760, 400), arrowstyle="simple,head_length=22,head_width=26,tail_width=8", color=GRAPH, zorder=8, lw=0))
    cloud(ax, 960, 400, 105, 105, INDIGO, alpha=1.0)
    ax.add_patch(Circle((960, 400), 118, fill=False, ec=INDIGO, lw=3.5, zorder=4))
    sphere(ax, 960, 400, 46, MN, z=6)
    save(fig, "dft-theory-3")


# ── 실습 [3] k점: 촘촘한 격자와 성긴 네 점 ─────────────────────
def dft_practice_3():
    fig, ax = canvas()
    ax.add_patch(RegularPolygon((640, 400), 6, radius=330, orientation=np.pi / 6, fill=False, ec=mix(GRAPH, 0.2), lw=3, zorder=2))
    # 촘촘한 육각 격자점
    pts = []
    for i in range(-7, 8):
        for j in range(-7, 8):
            x = 640 + (i + j / 2) * 60
            y = 400 + j * 60 * np.sqrt(3) / 2
            if abs(x - 640) < 300 and abs(y - 400) < 290 and (abs(x - 640) * 0.577 + abs(y - 400)) < 300:
                pts.append((x, y))
    for x, y in pts:
        ax.add_patch(Circle((x, y), 7, color=mix(INDIGO, 0.55), zorder=3, lw=0))
    # 성긴 2×2: 네 점만 크게, 빨갛게
    for x, y in ((640 - 150, 400 - 87), (640 + 150, 400 - 87), (640 - 150, 400 + 87), (640 + 150, 400 + 87)):
        sphere(ax, x, y, 26, O, z=6, shadow=False)
    save(fig, "dft-practice-3")


# ── Paper [1] 산화 에너지: 녹스는 금속 구와 다가오는 O₂ ─────────
def paper_1():
    fig, ax = canvas()
    sphere(ax, 520, 400, 190, "#8d939c", z=4)
    # 녹 자국
    rng = np.random.default_rng(2)
    for _ in range(26):
        ang = rng.uniform(-0.6, 1.4)
        rr = rng.uniform(40, 185)
        x, y = 520 + rr * np.cos(ang), 400 + rr * np.sin(ang)
        s = rng.uniform(14, 40)
        ax.add_patch(Ellipse((x, y), s * 1.6, s, angle=rng.uniform(0, 180), color=mix(WARM, rng.uniform(0, 0.3)), alpha=0.75, zorder=5, lw=0))
    # O2 분자 셋
    for (x, y, ang) in ((980, 560, 20), (1040, 330, -25), (860, 690, 60)):
        d = 34
        dx, dy = d * np.cos(np.radians(ang)), d * np.sin(np.radians(ang))
        bond(ax, (x - dx, y - dy), (x + dx, y + dy), color=O, lw=14, z=6)
        sphere(ax, x - dx, y - dy, 30, O, z=7, shadow=False)
        sphere(ax, x + dx, y + dy, 30, O, z=7, shadow=False)
        ax.add_patch(FancyArrowPatch((x - 90, y - 10), (x - 190, y - 40), arrowstyle="simple,head_length=16,head_width=18,tail_width=5", color=mix(GRAPH, 0.3), zorder=3, lw=0))
    save(fig, "paper-1-wang2006")


# ── 실습 [4] U를 걸었더니: 네잎 d 오비탈이 또렷해진다 ────────────
def dft_practice_4():
    fig, ax = canvas()
    cloud(ax, 640, 400, 330, 270, INDIGO, alpha=0.35)
    for ang in (45, 135, 225, 315):
        for i in range(14):
            t = i / 14
            L, Wd = 250 * (1 - t * 0.9), 120 * (1 - t * 0.9)
            cx, cy = 640 + np.cos(np.radians(ang)) * (L / 2 + 30), 400 + np.sin(np.radians(ang)) * (L / 2 + 30)
            ax.add_patch(Ellipse((cx, cy), L, Wd, angle=ang, color=mix(INDIGO, t * 0.75), zorder=3 + i * 1e-3, lw=0))
    sphere(ax, 640, 400, 52, MN, z=8, shadow=False)
    save(fig, "dft-practice-4")


# ── 실습 [5] 얀-텔러: 위아래로 늘어난 팔면체 ───────────────────
def dft_practice_5():
    fig, ax = canvas()
    c = np.array([640, 400])
    ax_up, ax_dn = c + (0, 250), c - (0, 250)
    eq = [c + (-170, 30), c + (170, 30), c + (-95, -110), c + (95, -110)]
    # 원래(정팔면체) 자리: 점선
    for p in (c + (0, 190), c - (0, 190)):
        ax.add_patch(Circle(p, 26, fill=False, ec=mix(GRAPH, 0.3), lw=2, ls=(0, (3, 5)), zorder=2))
    faces = [(ax_up, eq[0], eq[2]), (ax_up, eq[2], eq[3]), (ax_up, eq[3], eq[1]), (ax_up, eq[1], eq[0]),
             (ax_dn, eq[0], eq[2]), (ax_dn, eq[2], eq[3]), (ax_dn, eq[3], eq[1]), (ax_dn, eq[1], eq[0])]
    for k, f in enumerate(faces):
        ax.add_patch(Polygon(f, closed=True, color=mix(MN, 0.25 + (k % 4) * 0.1), alpha=0.55, zorder=3, lw=0))
        ax.add_patch(Polygon(f, closed=True, fill=False, ec=mix(MN, 0.2, INK), lw=1.2, zorder=3.5))
    for p in eq:
        bond(ax, c, p, color=GRAPH, lw=7, z=4)
        sphere(ax, *p, 26, O, z=6, shadow=False)
    for p in (ax_up, ax_dn):
        bond(ax, c, p, color=INDIGO, lw=8, z=4)
        sphere(ax, *p, 26, O, z=6, shadow=False)
        ax.add_patch(FancyArrowPatch(p + (0, 40 * np.sign(p[1] - 400)), p + (0, 95 * np.sign(p[1] - 400)), arrowstyle="simple,head_length=16,head_width=20,tail_width=6", color=INDIGO, zorder=7, lw=0))
    sphere(ax, *c, 40, MN, z=6, shadow=False)
    save(fig, "dft-practice-5")


# ── 실습 [6] Na 하나를 빼서: 층 사이에서 Na 하나가 떠오른다 ──────
def dft_practice_6():
    fig, ax = canvas()
    def slab(y0):
        for i in range(6):
            x = 200 + i * 160
            tri_up = [(x, y0 + 60), (x - 80, y0 - 20), (x + 80, y0 - 20)]
            tri_dn = [(x + 80, y0 - 20), (x + 160, y0 + 60), (x, y0 + 60)]
            ax.add_patch(Polygon(tri_up, closed=True, color=mix(MN, 0.3), alpha=0.75, zorder=2, lw=0))
            ax.add_patch(Polygon(tri_dn, closed=True, color=mix(MN, 0.5), alpha=0.75, zorder=2, lw=0))
            ax.add_patch(Polygon(tri_up, closed=True, fill=False, ec=mix(MN, 0.15, INK), lw=1, zorder=2.5))
            ax.add_patch(Polygon(tri_dn, closed=True, fill=False, ec=mix(MN, 0.15, INK), lw=1, zorder=2.5))
        for i in range(7):
            sphere(ax, 200 + i * 160 - 80, y0 - 20, 14, O, z=4, shadow=False)
            sphere(ax, 200 + i * 160, y0 + 60, 14, O, z=4, shadow=False)
    slab(560)
    slab(200)
    xs = [280 + i * 160 for i in range(6)]
    gone = 3
    for i, x in enumerate(xs):
        if i == gone:
            ax.add_patch(Circle((x, 400), 44, fill=False, ec=mix(GRAPH, 0.35), lw=2, ls=(0, (4, 5)), zorder=3))
            sphere(ax, x, 690, 44, NA, z=6)
            ax.add_patch(FancyArrowPatch((x, 470), (x, 610), arrowstyle="simple,head_length=20,head_width=24,tail_width=8", color=INDIGO, zorder=7, lw=0))
        else:
            sphere(ax, x, 400, 44, NA, z=5, shadow=False)
    save(fig, "dft-practice-6")


# ── EValue: 노트북을 24시간 서버로 — 노트북, 터널, 고정 주소 ─────
def laptop_to_server():
    fig, ax = canvas()
    # 노트북: 화면 + 받침
    ax.add_patch(Polygon([(180, 300), (560, 300), (560, 560), (180, 560)], closed=True, color=mix(INK, 0.15), zorder=3))
    ax.add_patch(Polygon([(196, 316), (544, 316), (544, 544), (196, 544)], closed=True, color="#0f1114", zorder=4))
    for k in range(6):  # 화면 안 로그 줄
        ax.plot([216, 216 + 200 - k * 22], [520 - k * 30, 520 - k * 30], color=mix("#7ee787", 0.1), lw=5, solid_capstyle="round", zorder=5, alpha=0.9 if k < 5 else 0.5)
    ax.add_patch(Polygon([(120, 300), (620, 300), (600, 270), (140, 270)], closed=True, color=mix(INK, 0.3), zorder=3))
    # 터널: 점선 곡선
    t = np.linspace(0, 1, 60)
    xs = 620 + t * 340
    ys = 420 + 120 * np.sin(t * np.pi)
    ax.plot(xs, ys, color=INDIGO, lw=6, ls=(0, (2, 3)), zorder=5, solid_capstyle="round")
    ax.add_patch(FancyArrowPatch((940, 430), (985, 420), arrowstyle="simple,head_length=22,head_width=26,tail_width=8", color=INDIGO, zorder=6, lw=0))
    # 구름 = 고정 주소
    for (cx, cy, r) in ((1090, 420, 95), (1160, 470, 75), (1010, 470, 70), (1150, 380, 60)):
        ax.add_patch(Circle((cx, cy), r, color=HILITE, zorder=7, lw=0))
        ax.add_patch(Circle((cx, cy), r, fill=False, ec=mix(INDIGO, 0.6), lw=2, zorder=7.5))
    ax.add_patch(Polygon([(1010, 400), (1160, 400), (1160, 470), (1010, 470)], closed=True, color=HILITE, zorder=7, lw=0))
    # 구름 안 자물쇠(고정)
    ax.add_patch(Polygon([(1060, 400), (1120, 400), (1120, 445), (1060, 445)], closed=True, color=INDIGO, zorder=8, lw=0))
    ax.add_patch(Circle((1090, 452), 16, fill=False, ec=INDIGO, lw=6, zorder=8))
    # 달 = 24시간
    ax.add_patch(Circle((1150, 690), 46, color=mix(WARM, 0.35), zorder=3, lw=0))
    ax.add_patch(Circle((1170, 705), 40, color=BG, zorder=3.5, lw=0))
    save(fig, "laptop-to-server")


# ── 실습 [7] 스핀을 뒤집자: 원래 구조는 엇갈림(AFM), Na 뺀 구조는 나란히(FM) ──
def dft_practice_7():
    fig, ax = canvas()
    def arrow(x, y, up, color):
        y0, y1 = (y - 95, y + 95) if up else (y + 95, y - 95)
        ax.add_patch(FancyArrowPatch((x, y0), (x, y1), arrowstyle="simple,head_length=24,head_width=28,tail_width=10", color=color, zorder=8, lw=0))
    # 왼쪽: Mn³⁺–Mn³⁺, 스핀 엇갈림. 위에 Na 둘
    for x in (250, 430):
        sphere(ax, x, 610, 34, NA, z=5, shadow=False)
        cloud(ax, x, 380, 110, 110, MN, alpha=0.4)
        sphere(ax, x, 380, 56, MN, z=6)
    bond(ax, (306, 380), (374, 380), color=GRAPH, lw=7, z=4)
    arrow(250, 380, True, INDIGO)
    arrow(430, 380, False, INDIGO)
    # 가운데 구분선
    ax.plot([640, 640], [140, 700], color=mix(GRAPH, 0.55), lw=2, ls=(0, (6, 6)), zorder=1)
    # 오른쪽: Mn³⁺–Mn⁴⁺, 스핀 나란히. Na 하나는 빈자리(점선)
    sphere(ax, 850, 610, 34, NA, z=5, shadow=False)
    ax.add_patch(Circle((1030, 610), 34, fill=False, ec=mix(GRAPH, 0.35), lw=2, ls=(0, (4, 5)), zorder=5))
    cloud(ax, 850, 380, 110, 110, MN, alpha=0.4)
    sphere(ax, 850, 380, 56, MN, z=6)
    cloud(ax, 1030, 380, 80, 80, MN, alpha=0.4)
    sphere(ax, 1030, 380, 42, MN, z=6)
    bond(ax, (906, 380), (988, 380), color=GRAPH, lw=7, z=4)
    arrow(850, 380, True, INDIGO)
    arrow(1030, 380, True, INDIGO)
    save(fig, "dft-practice-7")


# ── 실습 [8] 이웃을 세었더니: Mn⁴⁺ 이웃이 0·2·4개일 때 얀-텔러 계단 ──
def dft_practice_8():
    fig, ax = canvas()
    centers = [(260, 380), (640, 380), (1020, 380)]
    n4 = [0, 2, 4]
    stretch = [150, 118, 92]  # 축 결합 길이(왜곡)
    tops = []
    for (cx, cy), k, st in zip(centers, n4, stretch):
        # 이웃 여섯: 육각형. 앞 k개는 Mn⁴⁺(작고 진함), 나머지는 Mn³⁺(연함)
        for i in (0, 2, 3, 5):  # 위아래(1, 4)는 긴 결합의 O 뒤에 가려지므로 그리지 않는다
            ang = np.radians(30 + i * 60)
            nx, ny = cx + 150 * np.cos(ang), cy + 150 * np.sin(ang) * 0.5
            is4 = i in ([], [0, 3], [0, 2, 3, 5])[n4.index(k)]
            ax.plot([cx, nx], [cy, ny], color=mix(GRAPH, 0.6), lw=2, zorder=2)
            sphere(ax, nx, ny, 22 if is4 else 28, mix(MN, 0.0, INK) if is4 else mix(MN, 0.55), z=3, shadow=False)
        # 축 방향 O 둘 (왜곡): 위아래로
        for sgn in (1, -1):
            bond(ax, (cx, cy), (cx, cy + sgn * st), color=INDIGO, lw=8, z=5)
            sphere(ax, cx, cy + sgn * st, 20, O, z=7, shadow=False)
        sphere(ax, cx, cy, 44, MN, z=6)
        tops.append((cx, cy + st + 34))
    # 계단: 위쪽 O 높이를 잇는 점선
    xs = [tops[0][0] - 60, tops[0][0] + 60, tops[1][0] - 60, tops[1][0] + 60, tops[2][0] - 60, tops[2][0] + 60]
    ys = [tops[0][1], tops[0][1], tops[1][1], tops[1][1], tops[2][1], tops[2][1]]
    ax.plot(xs, ys, color=mix(INDIGO, 0.3), lw=3, ls=(0, (5, 5)), zorder=1, solid_capstyle="round")
    save(fig, "dft-practice-8")


# ── 실습 [9] 총정리: 충전 중의 α-NaMnO₂를 원자 단위로. 왼쪽 x = 1, 오른쪽 x = 0.5, 사이는 두 상의 경계 ──
def dft_practice_9():
    fig, ax = canvas()
    step, x_start, n = 150, 70, 7
    def slab(y0):
        for i in range(n):
            x = x_start + i * step
            tri_up = [(x, y0 + 55), (x - 75, y0 - 20), (x + 75, y0 - 20)]
            tri_dn = [(x + 75, y0 - 20), (x + 150, y0 + 55), (x, y0 + 55)]
            ax.add_patch(Polygon(tri_up, closed=True, color=mix(MN, 0.3), alpha=0.75, zorder=2, lw=0))
            ax.add_patch(Polygon(tri_dn, closed=True, color=mix(MN, 0.5), alpha=0.75, zorder=2, lw=0))
            ax.add_patch(Polygon(tri_up, closed=True, fill=False, ec=mix(MN, 0.15, INK), lw=1, zorder=2.5))
            ax.add_patch(Polygon(tri_dn, closed=True, fill=False, ec=mix(MN, 0.15, INK), lw=1, zorder=2.5))
        for i in range(n + 1):
            sphere(ax, x_start + i * step - 75, y0 - 20, 13, O, z=4, shadow=False)
            sphere(ax, x_start + i * step, y0 + 55, 13, O, z=4, shadow=False)
    # 슬랩 셋, 사이에 Na 층 둘
    for y0 in (105, 365, 625):
        slab(y0)
    # 두 상의 경계 (세로 점선)
    bx = x_start + 2 * step + 150          # Na 열 2와 3 사이, 원자 위를 지나지 않게
    ax.plot([bx, bx], [50, 720], color=mix(GRAPH, 0.35), lw=2.5, ls=(0, (7, 6)), zorder=1)
    for gy in (235, 495):
        for i in range(n):
            x = x_start + i * step + 75
            if x < bx:
                sphere(ax, x, gy, 30, NA, z=5, shadow=False)                  # x = 1: 다 찬 Na
            else:
                if (i + (0 if gy == 235 else 1)) % 2 == 0:
                    sphere(ax, x, gy, 30, NA, z=5, shadow=False)              # x = 0.5: 하나 걸러 남음
                else:
                    ax.add_patch(Circle((x, gy), 30, fill=False, ec=mix(GRAPH, 0.35), lw=2, ls=(0, (4, 5)), zorder=5))
    # 빈자리와 맞닿은 Mn⁴⁺: 슬랩마다 오른쪽 Mn의 절반, 작고 진한 점 (위·가운데는 위 Na 층의 빈자리 열, 아래는 아래 Na 층의 빈자리 열)
    for y0, cols in ((625, (4, 6)), (365, (4, 6)), (105, (3, 5))):
        for i in cols:
            ax.add_patch(Circle((x_start + i * step + 75, y0 + 17), 9, color=mix(MN, 0.0, INK), zorder=3.5, lw=0))
    # 나가는 Na: 층 사이 통로를 따라 오른쪽 가장자리 밖으로 (충전)
    for gy in (235, 495):
        ax.add_patch(FancyArrowPatch((x_start + n * step - 40, gy), (x_start + n * step + 40, gy), arrowstyle="simple,head_length=20,head_width=26,tail_width=8", color=INDIGO, zorder=7, lw=0))
        sphere(ax, x_start + n * step + 85, gy, 30, NA, z=6, shadow=False)
    save(fig, "dft-practice-9")


# ── 실습 [10] Ni 하나: Ni는 2+가 되고, 생긴 구멍은 대각 이웃 Mn 둘에 반씩 퍼진다 ──
NI = "#B7BBBD"  # VESTA 기본 Ni


def dft_practice_10():
    fig, ax = canvas()
    # 전이금속 층을 위에서 본 삼각 격자 조각: 왼쪽 Mn³⁺(b축 이웃), 가운데 Ni, 오른쪽 위아래 Mn³·⁵⁺(대각 이웃)
    ni = np.array([610, 400])
    mn3 = np.array([330, 400])
    half = [np.array([790, 598]), np.array([790, 202])]
    for q in [mn3] + half:
        ax.plot([ni[0], q[0]], [ni[1], q[1]], color=mix(GRAPH, 0.55), lw=2.2, zorder=1)
    ax.plot([half[0][0], half[1][0]], [half[0][1], half[1][1]], color=mix(GRAPH, 0.7), lw=1.6, ls=(0, (5, 6)), zorder=1)
    # 구멍 하나가 두 자리에 반씩: 두 Mn을 함께 감싸는 옅은 인디고 구름
    cloud(ax, 790, 400, 125, 300, INDIGO, alpha=0.55, z=1.5, n=30)
    # 팔면체의 긴 축(위아래 O): Mn³⁺ 길게, Mn³·⁵⁺ 짧게, Ni²⁺도 이웃에게 떠밀려 조금
    def axis(c, st, r_o=15):
        for sgn in (1, -1):
            bond(ax, c, (c[0], c[1] + sgn * st), color=INDIGO, lw=7, z=4)
            sphere(ax, c[0], c[1] + sgn * st, r_o, O, z=7, shadow=False)
    # 길이 = 60 + 520 × (긴/짧은 비 − 1): Mn³⁺ 1.14, Ni²⁺ 1.08, Mn³·⁵⁺ 1.07 (글의 표 2)
    axis(mn3, 133)
    axis(ni, 102)
    for h in half:
        axis(h, 96, r_o=13)
    sphere(ax, mn3[0], mn3[1], 50, MN, z=6)
    for h in half:
        sphere(ax, h[0], h[1], 42, mix(MN, 0.3), z=6)
    sphere(ax, ni[0], ni[1], 52, NI, z=6)
    # 전자 하나가 Mn 쪽에서 Ni로 건너간다
    ax.add_patch(FancyArrowPatch((748, 452), (672, 432), connectionstyle="arc3,rad=-0.35",
                                 arrowstyle="simple,head_length=16,head_width=18,tail_width=6", color=INDIGO, zorder=8, lw=0))
    ax.add_patch(Circle((662, 446), 9, color=INDIGO, zorder=9, lw=0))
    save(fig, "dft-practice-10")


# ── 실습 [11] CHGNet과 G1: 배열 10개의 에너지 준위를 DFT(왼쪽)와 CHGNet(오른쪽)에 나란히.
#    오른쪽 사다리는 절반 높이로 눌려 있고, 크게 엇갈리는 선은 g01(경고색) 하나다. 수치는 글의 표 4 ──
def dft_practice_11():
    fig, ax = canvas()
    dft = [0.0, 50.8, 130.5, 170.8, 179.0, 184.4, 209.1, 227.3, 263.8, 382.7]   # g05 g07 g09 g10 g06 g08 g03 g02 g01 g04
    ml = [9.1, 0.0, 37.8, 39.3, 72.3, 104.2, 121.0, 151.4, 94.1, 207.4]
    y0, k = 150, 1.4
    lx, rx, half_w = 400, 880, 110
    for i, (a, b) in enumerate(zip(dft, ml)):
        ya, yb = y0 + a * k, y0 + b * k
        low = i == 0      # DFT 최저 g05: CHGNet에서는 2위
        odd = i == 8      # 크게 어긋난 g01: DFT 9위, CHGNet 6위
        col = INDIGO if low else mix(GRAPH, 0.15)
        ax.plot([lx + half_w + 8, rx - half_w - 8], [ya, yb], color=INDIGO if low else WARM if odd else mix(GRAPH, 0.5),
                lw=3 if low else 2.2 if odd else 1.6, zorder=3 if low or odd else 2, alpha=1 if low or odd else 0.9)
        for x, y in ((lx, ya), (rx, yb)):
            ax.plot([x - half_w, x + half_w], [y, y], color=col, lw=7 if low else 5, solid_capstyle="round", zorder=4 if low else 3)
    # 두 사다리의 높이 차: 오른쪽 옆에 옅은 기둥으로
    for x, top in ((lx - half_w - 40, dft[-1]), (rx + half_w + 40, ml[-1])):
        ax.plot([x, x], [y0, y0 + top * k], color=mix(GRAPH, 0.55), lw=4, solid_capstyle="round", zorder=1)
    save(fig, "dft-practice-11")

ALL = [dft_explained, first_dft_run, dft_theory_2, dft_practice_2, dft_theory_3, dft_practice_3, paper_1,
       dft_practice_4, dft_practice_5, dft_practice_6, laptop_to_server, dft_practice_7, dft_practice_8,
       dft_practice_9, dft_practice_10, dft_practice_11]

if __name__ == "__main__":
    # 함수 이름을 주면 그 그림만 다시 그린다 (예: ... dft_practice_10). --theme=light|dark 로 한 벌만
    os.makedirs(OUT, exist_ok=True)
    funcs = [globals()[n] for n in FUNCS] if FUNCS else ALL
    for th in THEMES_TO_RUN:
        set_theme(th)
        for fn in funcs:
            fn()
