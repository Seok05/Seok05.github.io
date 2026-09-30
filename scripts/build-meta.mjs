/* posts.js를 읽어 feed.xml(RSS)·sitemap.xml·robots.txt를 만들고,
   모든 HTML의 blog.css·site.js·posts.js 링크에 내용 해시(?v=)를 찍고, 글꼴 CSS 링크(preconnect)를 head에 넣는다.
   새 글을 올릴 때, 그리고 CSS·JS를 고쳤을 때 한 번 실행: node scripts/build-meta.mjs */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "assets/posts.js"), "utf8");
const SEOK = new Function("window", src + "; return window.SEOK;")({});

const SITE = (SEOK.site && SEOK.site.url) || "https://seok05.github.io";
const TITLE = (SEOK.site && SEOK.site.title) || "Seok Lab";
const DESC = "연구하면서 개발하는 Seok의 블로그. 배터리 재료의 DFT 계산과 EValue·첫잔 개발 기록.";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (d) => new Date(d.replace(/\./g, "-") + "T09:00:00+09:00").toUTCString();
const catName = (key) => (SEOK.cats.find((c) => c.key === key) || {}).name || key;

const posts = SEOK.posts; // 최신이 맨 위

/* ── feed.xml ── */
const items = posts
  .map((p) => {
    const url = `${SITE}/posts/${p.slug}.html`;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <category>${esc(catName(p.cat))}</category>
      <description>${esc(p.blurb)}</description>
    </item>`;
  })
  .join("\n");

writeFileSync(
  join(root, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(TITLE)}</title>
    <link>${SITE}/</link>
    <description>${esc(DESC)}</description>
    <language>ko</language>
    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
);

/* ── sitemap.xml ── */
const urls = [`  <url><loc>${SITE}/</loc><lastmod>${posts[0].date.replace(/\./g, "-")}</lastmod></url>`].concat(
  posts.map(
    (p) => `  <url><loc>${SITE}/posts/${p.slug}.html</loc><lastmod>${p.date.replace(/\./g, "-")}</lastmod></url>`
  )
);
writeFileSync(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`
);

/* ── robots.txt ── */
writeFileSync(join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`feed.xml · sitemap.xml · robots.txt — ${posts.length}편 반영`);

/* ── 자산 버전 ──
   GitHub Pages는 파일을 600초 캐시한다. 링크에 해시가 없으면 배포 직후 10분 동안 재방문자가
   새 HTML에 옛 CSS·JS를 받아 화면이 깨진다. 내용이 바뀐 파일만 해시가 바뀌므로 다시 받는다. */
const ASSETS = ["blog.css", "site.js", "posts.js"];
const ver = Object.fromEntries(
  ASSETS.map((f) => [f, createHash("sha1").update(readFileSync(join(root, "assets", f))).digest("hex").slice(0, 8)])
);
const htmlFiles = ["index.html", "404.html"].concat(
  readdirSync(join(root, "posts"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => join("posts", f))
);
// 뿌리 페이지는 assets/…, 글은 ../assets/…, 404는 /assets/… 로 적혀 있다. 접두어는 그대로 두고 ?v=만 바꾼다
const linkRe = /((?:\.\.\/|\/)?assets\/(blog\.css|site\.js|posts\.js))(\?v=[0-9a-f]+)?(?=["'])/g;
/* 글꼴 CSS는 blog.css 안의 @import가 아니라 HTML에서 직접 부른다(blog.css를 기다리지 않고 나란히 받는다).
   blog.css <link> 바로 앞에 preconnect + stylesheet 두 줄. 이미 있으면 그대로 */
const FONT_HOST = "https://cdn.jsdelivr.net";
const FONT_CSS = `${FONT_HOST}/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css`;
const fontLinks = (indent) =>
  `${indent}<link rel="preconnect" href="${FONT_HOST}" crossorigin />\n${indent}<link rel="stylesheet" href="${FONT_CSS}" />\n`;
const withFontLinks = (html) =>
  html.includes(FONT_CSS)
    ? html
    : html.replace(/^([ \t]*)<link rel="stylesheet" href="[^"]*assets\/blog\.css/m, (m, indent) => fontLinks(indent) + m);
let stamped = 0;
for (const rel of htmlFiles) {
  const p = join(root, rel);
  const before = readFileSync(p, "utf8");
  const after = withFontLinks(before).replace(linkRe, (m, path, file) => `${path}?v=${ver[file]}`);
  if (after !== before) {
    writeFileSync(p, after);
    stamped++;
  }
}
console.log(`자산 버전 ${ASSETS.map((f) => f + "=" + ver[f]).join(" · ")} — HTML ${stamped}개 갱신`);
