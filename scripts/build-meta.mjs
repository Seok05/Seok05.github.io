/* posts.js를 읽어 feed.xml(RSS)·sitemap.xml을 만든다.
   새 글을 올릴 때 한 번 실행: node scripts/build-meta.mjs               */
import { readFileSync, writeFileSync } from "node:fs";
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
