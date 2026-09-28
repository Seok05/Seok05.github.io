"""연구 글(DFT·Paper) 카드 썸네일: 글 내용을 그림으로. 도표 캡처 대신 직접 그린다.
matplotlib(Agg)로 1280×800에 그려 640×400 webp로 줄인다. 글자는 넣지 않는다.
사용: python3 scripts/render-illustrations.py assets/thumbs assets/illus"""
import sys
import os
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon, FancyArrowPatch, Ellipse, RegularPolygon
from matplotlib.colors import to_rgb
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "assets/thumbs"      # 640×400 썸네일
FULL = sys.argv[2] if len(sys.argv) > 2 else "assets/illus"      # 1280×800 글 안 그림
W, H = 12.8, 8.0  # inches @100dpi → 1280×800
BG_DFT = "#f8efe6"    # hue 30 종이
BG_PAPER = "#e6eef8"  # hue 210 종이
MN, O, NA = "#9C7AC7", "#E8483C", "#F1D24B"
INK, INDIGO, GRAPH, WARM = "#2a2530", "#4F46E5", "#7a7f88", "#b45309"


def mix(c, t, to="#ffffff"):
    a, b = np.array(to_rgb(c)), np.array(to_rgb(to))
    return tuple(a * (1 - t) + b * t)


def sphere(ax, x, y, r, color, z=5, alpha=1.0, shadow=True):
    """동심원 겹치기로 명암을 낸 구. 빛은 왼쪽 위."""
    if shadow:
        ax.add_patch(Ellipse((x + r * 0.25, y - r * 1.05), r * 2.1, r * 0.55, color=mix(INK, 0.82), alpha=0.35 * alpha, zorder=z - 0.5, lw=0))
    n = 16
    for i in range(n):
        t = i / n
        rr = r * (1 - t * 0.92)
        ax.add_patch(Circle((x - r * 0.28 * t, y + r * 0.28 * t), rr, color=mix(mix(color, 0.35, INK), t ** 1.4 * 0.9), alpha=alpha, zorder=z + i * 1e-3, lw=0))


def bond(ax, p, q, color=GRAPH, lw=6, z=4, alpha=1):
    ax.plot([p[0], q[0]], [p[1], q[1]], color=mix(color, 0.15), lw=lw, solid_capstyle="round", zorder=z, alpha=alpha)
    ax.plot([p[0], q[0]], [p[1], q[1]], color=mix(color, 0.55), lw=lw * 0.35, solid_capstyle="round", zorder=z + 1e-3, alpha=alpha)


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


def canvas(bg):
    fig = plt.figure(figsize=(W, H), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1280)
    ax.set_ylim(0, 800)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.patch.set_facecolor(bg)
    return fig, ax


def save(fig, name):
    p = os.path.join(OUT, name + ".png")
    fig.savefig(p, dpi=100, facecolor=fig.get_facecolor())
    plt.close(fig)
    full = Image.open(p).convert("RGB")
    full.save(os.path.join(FULL, name + ".webp"), "WEBP", quality=84, method=6)
    full.resize((640, 400), Image.LANCZOS).save(os.path.join(OUT, name + ".webp"), "WEBP", quality=84, method=6)
    os.remove(p)
    print("ok", name)


# ── 이론 [1] 밀도: 원자 주변 전자 밀도 지형 ─────────────────────
def dft_explained():
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_PAPER)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas("#e4f4ef")
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
    ax.plot(xs, ys, color="#149c8a", lw=6, ls=(0, (2, 3)), zorder=5, solid_capstyle="round")
    ax.add_patch(FancyArrowPatch((940, 430), (985, 420), arrowstyle="simple,head_length=22,head_width=26,tail_width=8", color="#149c8a", zorder=6, lw=0))
    # 구름 = 고정 주소
    for (cx, cy, r) in ((1090, 420, 95), (1160, 470, 75), (1010, 470, 70), (1150, 380, 60)):
        ax.add_patch(Circle((cx, cy), r, color="#ffffff", zorder=7, lw=0))
        ax.add_patch(Circle((cx, cy), r, fill=False, ec=mix("#149c8a", 0.6), lw=2, zorder=7.5))
    ax.add_patch(Polygon([(1010, 400), (1160, 400), (1160, 470), (1010, 470)], closed=True, color="#ffffff", zorder=7, lw=0))
    # 구름 안 자물쇠(고정)
    ax.add_patch(Polygon([(1060, 400), (1120, 400), (1120, 445), (1060, 445)], closed=True, color="#149c8a", zorder=8, lw=0))
    ax.add_patch(Circle((1090, 452), 16, fill=False, ec="#149c8a", lw=6, zorder=8))
    # 달 = 24시간
    ax.add_patch(Circle((1150, 690), 46, color=mix(WARM, 0.35), zorder=3, lw=0))
    ax.add_patch(Circle((1170, 705), 40, color="#e4f4ef", zorder=3.5, lw=0))
    save(fig, "laptop-to-server")


# ── 실습 [7] 스핀을 뒤집자: 원래 구조는 엇갈림(AFM), Na 뺀 구조는 나란히(FM) ──
def dft_practice_7():
    fig, ax = canvas(BG_DFT)
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
    fig, ax = canvas(BG_DFT)
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


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(FULL, exist_ok=True)
    dft_explained()
    first_dft_run()
    dft_theory_2()
    dft_practice_2()
    dft_theory_3()
    dft_practice_3()
    paper_1()
    dft_practice_4()
    dft_practice_5()
    dft_practice_6()
    laptop_to_server()
    dft_practice_7()
    dft_practice_8()
