"""홈 소개(hero) 그림: O3형 NaMnO2에서 Na 하나가 층 사이로 빠져나가는 장면.
render-namno2.py와 같은 구조·색(VESTA 기본)이고, 창을 가로로 넓히고 앞줄 Na 하나를
점선 빈자리로 바꾼 뒤 층 사이 오른쪽 밖으로 옮겨 그린다. 배경은 투명.
빈자리 점선은 라이트·다크 어느 바탕에서도 보이게 중간 회색이고 속은 비운다.
실행: python3 scripts/render-hero.py assets/hero-namno2.png  (같은 이름의 .webp도 만든다)"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon
from PIL import Image
import sys

a = 2.95
dO = 0.96
dNa = 2.66
a1 = np.array([a, 0.0, 0.0])
a2 = np.array([-a / 2, a * np.sqrt(3) / 2, 0.0])
SITE = {"A": 0 * a1, "B": (a1 + 2 * a2) / 3, "C": (2 * a1 + a2) / 3}
slabs = [("A", "C", "B", "A"), ("C", "B", "A", "C")]
N = 7
atoms = []
for k, (oB, mn, oT, na) in enumerate(slabs):
    z0 = k * 2 * dNa
    for i in range(-2, N):
        for j in range(-1, N):
            R = i * a1 + j * a2
            atoms.append(("Mn", SITE[mn] + R + np.array([0, 0, z0])))
            atoms.append(("O", SITE[oB] + R + np.array([0, 0, z0 - dO])))
            atoms.append(("O", SITE[oT] + R + np.array([0, 0, z0 + dO])))
            if k == 0:
                atoms.append(("Na", SITE[na] + R + np.array([0, 0, z0 + dNa])))
pos = {e: np.array([p for el, p in atoms if el == e]) for e in ("Mn", "O", "Na")}

X0, X1, Y0, Y1 = -0.3, 3.75 * a, -0.3, 1.25 * a
def inside(p, margin=0.05):
    return (X0 - margin <= p[0] <= X1 + margin) and (Y0 - margin <= p[1] <= Y1 + margin)

octa = []
for m in pos["Mn"]:
    if not inside(m):
        continue
    d = np.linalg.norm(pos["O"] - m, axis=1)
    nb = pos["O"][d < 2.2]
    if len(nb) == 6:
        octa.append((m, nb))

elev, azim = np.radians(16), np.radians(-14)
def rot(p):
    x, y, z = p
    x1 = x * np.cos(azim) - y * np.sin(azim)
    y1 = x * np.sin(azim) + y * np.cos(azim)
    y2 = y1 * np.cos(elev) - z * np.sin(elev)
    z2 = y1 * np.sin(elev) + z * np.cos(elev)
    return np.array([x1, z2, -y2])


# 빠져나갈 Na: 화면에서 가장 오른쪽 Na. 자취가 다른 원자 위로 지나가지 않는다
nas = [p for el, p in atoms if el == "Na" and inside(p)]
leaving = max(nas, key=lambda p: rot(p)[0])

prims = []
COL = {"Na": "#F9DC3C", "Mn": "#9C7AC7", "O": "#FE0300"}
RAD = {"Na": 0.95, "Mn": 0.55, "O": 0.42}
def ring(pts):
    c = np.mean(pts, axis=0)
    ang = np.arctan2([p[1] - c[1] for p in pts], [p[0] - c[0] for p in pts])
    return [p for _, p in sorted(zip(ang, pts), key=lambda t: t[0])]
for m, nb in octa:
    top = ring([v for v in nb if v[2] > m[2]])
    bot = ring([v for v in nb if v[2] < m[2]])
    for t in range(3):
        for tri in ((top[t], top[(t + 1) % 3], bot[t]), (bot[t], bot[(t + 1) % 3], top[(t + 1) % 3])):
            pr = [rot(v) for v in tri]
            dep = np.mean([p[2] for p in pr])
            n = np.cross(pr[1] - pr[0], pr[2] - pr[0])
            n = n / (np.linalg.norm(n) + 1e-9)
            shade = 0.55 + 0.45 * abs(n[2])
            prims.append((dep, "face", ([(p[0], p[1]) for p in pr], shade)))
    for v in nb:
        p0, p1 = rot(m), rot(v)
        prims.append(((p0[2] + p1[2]) / 2 + 0.01, "bond", (p0, p1)))
octa_O = np.array([v for _, nb in octa for v in nb])
for el, p in atoms:
    if not inside(p):
        continue
    if el == "Mn" and not any(np.linalg.norm(m - p) < 1e-6 for m, _ in octa):
        continue
    if el == "O" and np.linalg.norm(octa_O - p, axis=1).min() > 1e-6:
        continue
    q = rot(p)
    if el == "Na" and np.linalg.norm(p - leaving) < 1e-6:
        prims.append((q[2] + 0.02, "ghost", q))
        continue
    prims.append((q[2] + 0.02, "atom", (el, q)))

# 떠나는 Na: 같은 높이에서 a1 방향으로 창 밖까지, 맨 앞에 그린다
out_p = rot(leaving + 1.65 * a1 + np.array([0, -0.2, 0]))
g = rot(leaving)
prims.sort(key=lambda t: t[0])

fig = plt.figure(figsize=(10, 6), dpi=200)
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
    elif kind == "ghost":
        q = data
        ax.add_patch(Circle((q[0], q[1]), RAD["Na"], facecolor="none", edgecolor=(0.56, 0.58, 0.63, 1),
                            linewidth=2.0, linestyle=(0, (3, 2.6))))
    else:
        el, q = data
        r = RAD[el]
        ax.add_patch(Circle((q[0], q[1]), r, facecolor=COL[el], edgecolor=(0.15, 0.15, 0.15, 0.9), linewidth=0.8))
        ax.add_patch(Circle((q[0] - r * 0.3, q[1] + r * 0.3), r * 0.35, facecolor=(1, 1, 1, 0.45), edgecolor="none"))
# 자취(점선)와 떠나는 Na
d = out_p[:2] - g[:2]
u = d / np.linalg.norm(d)
s0 = g[:2] + u * (RAD["Na"] + 0.25)
s1 = out_p[:2] - u * (RAD["Na"] + 0.25)
ax.plot([s0[0], s1[0]], [s0[1], s1[1]], color=(0.31, 0.27, 0.9, 0.95), linewidth=2.4, linestyle=(0, (1.2, 2.6)),
        solid_capstyle="round", dash_capstyle="round")
r = RAD["Na"]
ax.add_patch(Circle((out_p[0], out_p[1]), r, facecolor=COL["Na"], edgecolor=(0.15, 0.15, 0.15, 0.9), linewidth=0.8))
ax.add_patch(Circle((out_p[0] - r * 0.3, out_p[1] + r * 0.3), r * 0.35, facecolor=(1, 1, 1, 0.45), edgecolor="none"))

pts = [d_[1][:2] for _, k, d_ in prims if k == "atom"] + [out_p[:2]]
pts = np.array(pts)
pad = 1.2
ax.set_xlim(pts[:, 0].min() - pad, pts[:, 0].max() + pad)
ax.set_ylim(pts[:, 1].min() - pad, pts[:, 1].max() + pad)
out = sys.argv[1]
fig.savefig(out, transparent=True)
im = Image.open(out).convert("RGBA")
im = im.crop(im.getbbox())
w = 1000
im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(out.replace(".png", ".webp"), "WEBP", quality=88, method=6)
print(im.size)
