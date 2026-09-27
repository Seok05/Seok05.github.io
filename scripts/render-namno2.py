"""O3형 층상 NaMnO2 (MnO6 팔면체 두 층 + 사이의 Na) 볼-스틱 렌더.
VESTA 기본 색(Na 노랑, Mn 보라, O 빨강)으로 그리고 배경은 투명."""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon
from PIL import Image
import sys

a = 2.95
dO = 0.96      # Mn 층에서 O 층까지 수직 거리 (Mn-O ≈ 1.95 Å)
dNa = 2.66     # Mn 층에서 Na 층까지 (층간 5.32 Å의 절반)
a1 = np.array([a, 0.0, 0.0])
a2 = np.array([-a / 2, a * np.sqrt(3) / 2, 0.0])
SITE = {"A": 0 * a1, "B": (a1 + 2 * a2) / 3, "C": (2 * a1 + a2) / 3}

# 슬랩 k: 아래 O, Mn, 위 O, 그 위 Na 자리 (O3 적층 AB|CA|BC)
slabs = [("A", "C", "B", "A"), ("C", "B", "A", "C"), ("B", "A", "C", "B")]
N = 5  # a,b 방향 격자 수
atoms = []  # (elem, xyz)
octa = []   # Mn 좌표 + 6 O 좌표
for k, (oB, mn, oT, na) in enumerate(slabs[:2]):
    z0 = k * 2 * dNa
    for i in range(-1, N):
        for j in range(-1, N):
            R = i * a1 + j * a2
            m = SITE[mn] + R + np.array([0, 0, z0])
            atoms.append(("Mn", m))
            atoms.append(("O", SITE[oB] + R + np.array([0, 0, z0 - dO])))
            atoms.append(("O", SITE[oT] + R + np.array([0, 0, z0 + dO])))
            if k == 0:
                atoms.append(("Na", SITE[na] + R + np.array([0, 0, z0 + dNa])))
# 팔면체: 각 Mn의 이웃 O 6개 (거리 < 2.2)
pos = {e: np.array([p for el, p in atoms if el == e]) for e in ("Mn", "O", "Na")}
for m in pos["Mn"]:
    d = np.linalg.norm(pos["O"] - m, axis=1)
    nb = pos["O"][d < 2.2]
    if len(nb) == 6:
        octa.append((m, nb))

# 보이는 영역: 평행사변형 안쪽만
def inside(p, margin=0.2):
    # 직사각형 창: 층이 수평으로 보이게 x,y 좌표로 자른다
    return (-0.3 - margin <= p[0] <= 3.05 * a + margin) and (-0.3 - margin <= p[1] <= 2.35 * a + margin)

# 카메라: 살짝 위에서 비스듬히
elev, azim = np.radians(16), np.radians(-14)
def rot(p):
    x, y, z = p
    # z축 회전 후 x축 기울임
    x1 = x * np.cos(azim) - y * np.sin(azim)
    y1 = x * np.sin(azim) + y * np.cos(azim)
    y2 = y1 * np.cos(elev) - z * np.sin(elev)
    z2 = y1 * np.sin(elev) + z * np.cos(elev)
    return np.array([x1, z2, -y2])  # (screen x, screen y, depth: 클수록 앞)

prims = []  # (depth, kind, data)
COL = {"Na": "#F9DC3C", "Mn": "#9C7AC7", "O": "#FE0300"}
RAD = {"Na": 0.95, "Mn": 0.55, "O": 0.42}
# 팔면체 면
for m, nb in octa:
    if not inside(m, 0.05):
        continue
    verts = [rot(v) for v in nb]
    top = [v for v in nb if v[2] > m[2]]
    bot = [v for v in nb if v[2] < m[2]]
    def ring(pts):
        c = np.mean(pts, axis=0)
        ang = np.arctan2([p[1] - c[1] for p in pts], [p[0] - c[0] for p in pts])
        return [p for _, p in sorted(zip(ang, pts), key=lambda t: t[0])]
    top, bot = ring(top), ring(bot)
    for t in range(3):
        for tri in ((top[t], top[(t + 1) % 3], bot[t]), (bot[t], bot[(t + 1) % 3], top[(t + 1) % 3])):
            pr = [rot(v) for v in tri]
            dep = np.mean([p[2] for p in pr])
            # 면의 법선으로 명암
            n = np.cross(pr[1] - pr[0], pr[2] - pr[0])
            n = n / (np.linalg.norm(n) + 1e-9)
            shade = 0.55 + 0.45 * abs(n[2])
            prims.append((dep, "face", ([(p[0], p[1]) for p in pr], shade)))
    # Mn-O 막대
    for v in nb:
        p0, p1 = rot(m), rot(v)
        prims.append(((p0[2] + p1[2]) / 2 + 0.01, "bond", (p0, p1)))
# 원자
for el, p in atoms:
    if not inside(p, 0.05):
        continue
    if el == "Mn":
        # 팔면체가 그려지는 Mn만
        if not any(np.linalg.norm(m - p) < 1e-6 for m, _ in octa if inside(m, 0.05)):
            continue
    if el == "O":
        # 팔면체에 속한 O만
        if not any(np.linalg.norm(nb - p, axis=1).min() < 1e-6 for _, nb in octa if inside(_, 0.05)):
            continue
    q = rot(p)
    prims.append((q[2] + 0.02, "atom", (el, q)))

prims.sort(key=lambda t: t[0])

fig = plt.figure(figsize=(8, 6), dpi=200)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_aspect("equal")
ax.axis("off")
for dep, kind, data in prims:
    if kind == "face":
        pts, shade = data
        base = np.array(matplotlib.colors.to_rgb(COL["Mn"]))
        col = base * shade + (1 - shade) * 0.15
        ax.add_patch(Polygon(pts, closed=True, facecolor=(*col, 0.78), edgecolor=(0.25, 0.1, 0.4, 0.9), linewidth=0.6))
    elif kind == "bond":
        p0, p1 = data
        ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color=(0.3, 0.15, 0.45, 0.9), linewidth=1.2, solid_capstyle="round", zorder=1)
    else:
        el, q = data
        r = RAD[el]
        ax.add_patch(Circle((q[0], q[1]), r, facecolor=COL[el], edgecolor=(0.15, 0.15, 0.15, 0.9), linewidth=0.8))
        ax.add_patch(Circle((q[0] - r * 0.3, q[1] + r * 0.3), r * 0.35, facecolor=(1, 1, 1, 0.45), edgecolor="none"))

allpts = np.array([d[1][:2] for _, k, d in prims if k == "atom"])
pad = 1.2
ax.set_xlim(allpts[:, 0].min() - pad, allpts[:, 0].max() + pad)
ax.set_ylim(allpts[:, 1].min() - pad, allpts[:, 1].max() + pad)
out = sys.argv[1]
fig.savefig(out, transparent=True)
im = Image.open(out).convert("RGBA")
bbox = im.getbbox()
im = im.crop(bbox)
im.save(out)
im.save(out.replace(".png", ".webp"), "WEBP", quality=88, method=6)
print(im.size, len(atoms), len(octa))
