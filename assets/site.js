/* ─────────────────────────────────────────────────────────────
   assets/posts.js 의 데이터로 페이지를 조립한다.

   홈(index.html) · 디자인 기준은 DESIGN.md
     - 왼쪽 소개 카드(정적) · 오른쪽 분류 탭(전체·분류마다) → 글 목록(최신순)
     - 탭은 목록 안의 글만 거른다. 틀은 그대로, 주소만 ?cat=<key>로 바뀐다
   글 페이지(posts/*.html)
     - 시리즈 띠, 읽는 시간, 읽기 진행바, 오른쪽 목차, 소제목 앵커(#),
       코드 복사 단추, 그림 라이트박스, 링크 복사, 조회수(GoatCounter),
       이전/다음/관련, 같은 시리즈 목록, ←/→ 키로 앞뒤 편 이동
   모든 페이지
     - 헤더 메뉴 통일 + 검색(⌘K 팔레트) + 테마 토글, 푸터 통일,
       위로 가기 단추, 방문 수집(GoatCounter 설정이 있을 때만)
   글 HTML 안에 하드코딩된 사이드바·post-nav·푸터는 JS가 꺼진 환경을
   위한 예비이며, 이 스크립트가 데이터 기준으로 덮어쓰거나 숨긴다.
   ───────────────────────────────────────────────────────────── */
(function () {
  var D = window.SEOK;
  if (!D) return;
  var posts = D.posts; // 최신이 맨 위
  var cats = D.cats;
  var SITE = D.site || {};
  var doc = document.documentElement;
  var GITHUB = "https://github.com/Seok05";

  var isIndex = !!document.getElementById("home");
  // 404처럼 어느 경로에서든 열리는 페이지는 body[data-root]로 뿌리를 못박는다
  var root = document.body.getAttribute("data-root") || (isIndex ? "./" : "../");

  /* ── 도우미 ─────────────────────────────────────────────── */
  function catOf(key) {
    for (var i = 0; i < cats.length; i++) if (cats[i].key === key) return cats[i];
    return null;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function isoDate(d) {
    return d.replace(/\./g, "-"); // 2026.08.27 → 2026-08-27
  }
  function shortDate(d) {
    return d.slice(5); // 08.27
  }
  function href(p) {
    return root + "posts/" + p.slug + ".html";
  }
  function byOrder(a, b) {
    return (a.order || 0) - (b.order || 0);
  }
  function chainOf(seriesKey) {
    return posts
      .filter(function (p) {
        return p.series === seriesKey;
      })
      .sort(byOrder);
  }
  // "첫잔 [1] — 제목" → "제목" (번호를 따로 보여줄 때만 쓴다)
  function bareTitle(t) {
    return t.replace(/^.+?\s\[\d+\]\s—\s/, "");
  }
  // 목록 메타용 시리즈 표기. "DFT 실습 [9] — …" → "DFT 실습 9", "첫잔 [10] — …" → "첫잔 10". 시리즈가 아니면 null
  function seriesTag(p) {
    var m = /^(.+?)\s\[(\d+)\]\s—\s/.exec(p.title);
    return m ? m[1] + " " + parseInt(m[2], 10) : null;
  }
  // 시리즈 안의 갈래. "DFT 이론 [2] — …"는 표지 이름(mark) "DFT" 뒤의 "이론"이 갈래이고,
  // "첫잔 [2] — …"처럼 mark만 있으면 갈래가 없다(null)
  function trackOf(p) {
    var m = /^(.+?)\s\[(\d+)\]\s—\s/.exec(p.title);
    var c = catOf(p.cat);
    if (!m || !c || !c.mark || m[1].indexOf(c.mark + " ") !== 0) return null;
    return { label: m[1].slice(c.mark.length + 1), n: parseInt(m[2], 10) };
  }
  // 목록에 나오는 갈래 이름(처음 나오는 순서). 둘 이상일 때만 표시한다
  function tracksIn(list) {
    var out = [];
    list.forEach(function (p) {
      var t = trackOf(p);
      if (t && out.indexOf(t.label) < 0) out.push(t.label);
    });
    return out;
  }
  function trackChip(p, labels) {
    var t = trackOf(p);
    if (!t || labels.length < 2) return "";
    return '<span class="track tr' + labels.indexOf(t.label) + '">' + esc(t.label) + " " + t.n + "</span>";
  }
  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  var ICONS = {
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
    link:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    copy:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 14 7-7 7 7"/></svg>',
  };

  /* 로고마크: 층상 산화물 사이를 떠나는 Na 이온 (실습 [6]의 2.40 V 이야기).
     층은 잉크, 떠난 자리는 점선, 떠나는 이온만 인디고. */
  var MARK =
    '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<g fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M7 21 17 13 27 21 37 13 47 21 57 13"/>' +
    '<path d="M7 51 17 43 27 51 37 43 47 51 57 43"/></g>' +
    '<circle cx="21" cy="32" r="6" fill="none" stroke="var(--faint)" stroke-width="3" stroke-dasharray="2.6 3"/>' +
    '<circle cx="43" cy="32" r="7.2" fill="var(--accent)"/>' +
    "</svg>";

  /* 표지 그림(draw). currentColor가 카테고리 색이고, 종이색은 --paper를 쓴다. */
  var ART = {
    battery:
      '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="30" y="41" width="122" height="62" rx="13"/>' +
      '<path d="M152 62h8a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7h-8"/></g>' +
      '<g fill="currentColor">' +
      '<rect x="44" y="55" width="19" height="34" rx="4"/>' +
      '<rect x="69" y="55" width="19" height="34" rx="4"/>' +
      '<rect x="94" y="55" width="19" height="34" rx="4" opacity=".55"/>' +
      '<rect x="119" y="55" width="19" height="34" rx="4" opacity=".22"/></g>' +
      '<path d="M30 128c30-1 62-5 92-12s34-9 48-16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 8" opacity=".75"/>' +
      "</svg>",
    lattice:
      '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">' +
      '<g stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".5">' +
      '<path d="M100 75L146 75M100 75L123 35M100 75L77 35M100 75L54 75M100 75L77 115M100 75L123 115"/>' +
      '<path d="M146 75L123 35L77 35L54 75L77 115L123 115Z" fill="none"/></g>' +
      '<g fill="currentColor">' +
      '<circle cx="146" cy="75" r="9"/><circle cx="123" cy="35" r="9"/><circle cx="77" cy="35" r="9"/>' +
      '<circle cx="54" cy="75" r="9"/><circle cx="77" cy="115" r="9"/><circle cx="123" cy="115" r="9"/>' +
      '<circle cx="100" cy="75" r="15"/>' +
      '<circle cx="134.5" cy="55" r="4.5" opacity=".45"/><circle cx="100" cy="35" r="4.5" opacity=".45"/><circle cx="65.5" cy="55" r="4.5" opacity=".45"/>' +
      '<circle cx="65.5" cy="95" r="4.5" opacity=".45"/><circle cx="100" cy="115" r="4.5" opacity=".45"/><circle cx="134.5" cy="95" r="4.5" opacity=".45"/></g>' +
      "</svg>",
    paper:
      '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M64 20h52l22 22v82a7 7 0 0 1-7 7H64a7 7 0 0 1-7-7V27a7 7 0 0 1 7-7z" fill="var(--paper)" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M116 20v22h22" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>' +
      '<g stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".5"><path d="M72 58h32M72 70h50M72 82h42"/></g>' +
      '<g fill="currentColor"><rect x="72" y="104" width="9" height="16" rx="2" opacity=".6"/><rect x="86" y="94" width="9" height="26" rx="2"/>' +
      '<rect x="100" y="108" width="9" height="12" rx="2" opacity=".6"/><rect x="114" y="98" width="9" height="22" rx="2"/></g>' +
      "</svg>",
  };

  function cover(c, size) {
    var art = c.art || {};
    var inner;
    if (art.type === "app" && art.shot) {
      // 앱 아이콘(왼쪽 위) + 폰 프레임 속 화면 캡처(오른쪽 아래, 아래로 잘림)
      inner =
        '<div class="cover-app">' +
        (art.icon ? '<img class="app-icon" src="' + root + art.icon + '" alt="" loading="lazy" decoding="async">' : "") +
        '<div class="phone"><img src="' + root + art.shot + '" alt="" loading="lazy" decoding="async"></div>' +
        "</div>";
    } else if (art.type === "web" && art.shot) {
      // 아이콘(왼쪽 위) + 브라우저 창 속 랜딩 페이지(오른쪽 아래, 아래로 잘림)
      inner =
        '<div class="cover-web">' +
        (art.icon ? '<img class="app-icon" src="' + root + art.icon + '" alt="" loading="lazy" decoding="async">' : "") +
        '<div class="browser"><div class="browser-bar"><i></i><i></i><i></i></div>' +
        '<img src="' + root + art.shot + '" alt="" loading="lazy" decoding="async"></div>' +
        "</div>";
    } else if (art.type === "image" && art.src) {
      inner =
        '<div class="cover-img"><img src="' + root + art.src + '" alt="" loading="lazy" decoding="async"' +
        (art.width ? ' style="width:' + art.width + '"' : "") + "></div>";
    } else if (art.type === "draw" && ART[art.name]) {
      inner = '<div class="cover-draw">' + ART[art.name] + "</div>";
    } else {
      inner = '<span class="cover-mark">' + esc(c.mark || c.name) + "</span>";
    }
    return (
      '<div class="cover' + (size ? " cover-" + size : "") + (inner.indexOf("cover-mark") < 0 ? " has-art" : "") +
      '" aria-hidden="true">' + inner + "</div>"
    );
  }
  // 지금 화면이 어두운가. 사용자가 고른 테마(data-theme)가 있으면 그것, 없으면 OS 설정
  function isDark() {
    var fixed = doc.getAttribute("data-theme");
    return fixed ? fixed === "dark" : !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  // 카드 썸네일: 글에 thumb가 있으면 그 그림, 없으면 카테고리 표지.
  // 썸네일은 라이트·다크 두 벌(assets/thumbs/<slug>.webp · assets/thumbs/dark/<slug>.webp). 처음부터 지금 테마의 것을
  // 넣고, 다크 파일이 없으면 라이트로 되돌린다(새 글이 다크 벌을 빠뜨려도 깨지지 않게)
  function thumb(p) {
    if (p.thumb) {
      var light = root + p.thumb;
      var dark = root + p.thumb.replace(/^assets\/thumbs\//, "assets/thumbs/dark/");
      return (
        '<div class="thumb"><img src="' + (isDark() ? dark : light) + '" data-light="' + light + '" data-dark="' + dark +
        '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=this.getAttribute(\'data-light\')"></div>'
      );
    }
    var c = catOf(p.cat);
    return '<div class="thumb thumb-cover">' + (c ? cover(c) : "") + "</div>";
  }
  // 테마가 바뀌면 화면에 있는 썸네일을 다른 벌로 바꾼다
  function swapThumbs() {
    var dark = isDark();
    Array.prototype.forEach.call(document.querySelectorAll("img[data-dark]"), function (img) {
      var want = img.getAttribute(dark ? "data-dark" : "data-light");
      if (img.getAttribute("src") === want) return;
      img.onerror = dark
        ? function () {
            this.onerror = null;
            this.src = this.getAttribute("data-light");
          }
        : null;
      img.src = want;
    });
  }

  function metaRow(p, withCat) {
    var c = catOf(p.cat);
    return (
      '<div class="meta-row">' +
      (withCat ? '<span class="tag">' + esc(c ? c.name : p.cat) + "</span>" : "") +
      (p.tag ? '<span class="tag">' + esc(p.tag) + "</span>" : "") +
      '<span><time datetime="' + isoDate(p.date) + '">' + p.date + "</time></span></div>"
    );
  }

  var counts = { all: posts.length };
  posts.forEach(function (p) {
    counts[p.cat] = (counts[p.cat] || 0) + 1;
  });

  var params = new URLSearchParams(location.search);

  var current = null;
  if (!isIndex) {
    var m = location.pathname.match(/([^\/]+)\.html$/);
    var slug = m ? decodeURIComponent(m[1]) : null;
    for (var i = 0; i < posts.length; i++) if (posts[i].slug === slug) current = posts[i];
  }

  /* ── 방문 수집 (GoatCounter). 계정 코드가 있을 때만, 로컬에서는 끈다 ── */
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var GC = !isLocal && SITE.goatcounter ? SITE.goatcounter : "";
  if (GC && !document.querySelector("script[data-goatcounter]")) {
    var gs = document.createElement("script");
    gs.async = true;
    gs.setAttribute("data-goatcounter", "https://" + GC + ".goatcounter.com/count");
    gs.src = "https://gc.zgo.at/count.js";
    document.head.appendChild(gs);
  }
  function fetchViews(path, cb) {
    if (!GC || !window.fetch) return;
    // count.js의 visit_count와 같은 규칙: 경로를 통째로 인코딩한다("/" → "%2F")
    fetch("https://" + GC + ".goatcounter.com/counter/" + encodeURIComponent(path) + ".json")
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        if (!j || !j.count) return;
        var n = parseInt(String(j.count).replace(/\D/g, ""), 10);
        if (n > 0) cb(n.toLocaleString("ko-KR"));
      })
      .catch(function () {});
  }

  /* ── 본문으로 건너뛰기 ──────────────────────────────────── */
  var skip = el("a", "skip-link", "본문으로 건너뛰기");
  skip.href = "#";
  skip.addEventListener("click", function (e) {
    e.preventDefault();
    var t = document.querySelector("article, main");
    if (t) {
      t.setAttribute("tabindex", "-1");
      t.focus({ preventScroll: false });
    }
  });
  document.body.insertBefore(skip, document.body.firstChild);

  /* ── 헤더: 로고마크 + 메뉴 통일 + 검색 + 테마 토글 ─────── */
  var header = document.querySelector(".site-header");
  var brandImg = document.querySelector(".site-name .avatar-sm");
  if (brandImg) {
    var markEl = el("span", "logo-mark", MARK);
    brandImg.parentNode.replaceChild(markEl, brandImg);
  }
  var nav = document.querySelector(".site-nav");
  if (nav) {
    nav.innerHTML = '<a href="' + GITHUB + '">GitHub</a>'; // 홈으로 가는 길은 로고가 맡는다

    var isMac = /Mac|iP(hone|ad|od)/.test(navigator.platform || "");
    var sbtn = el("button", "icon-btn search-btn", ICONS.search + "<kbd>" + (isMac ? "⌘K" : "Ctrl K") + "</kbd>");
    sbtn.type = "button";
    sbtn.setAttribute("aria-label", "글 찾기");
    sbtn.addEventListener("click", function () {
      openPalette();
    });
    nav.appendChild(sbtn);

    var btn = el(
      "button",
      "icon-btn theme-toggle",
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
        '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
    );
    btn.type = "button";
    btn.setAttribute("aria-label", "밝은 화면과 어두운 화면 전환");
    btn.addEventListener("click", toggleTheme);
    nav.appendChild(btn);
  }
  function toggleTheme() {
    var next = isDark() ? "light" : "dark";
    doc.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    swapThumbs();
  }
  // 사용자가 테마를 고르지 않았을 때 OS 설정이 바뀌면 썸네일도 따라간다
  if (window.matchMedia) {
    var mqDark = window.matchMedia("(prefers-color-scheme: dark)");
    var onMq = function () {
      if (!doc.getAttribute("data-theme")) swapThumbs();
    };
    if (mqDark.addEventListener) mqDark.addEventListener("change", onMq);
    else if (mqDark.addListener) mqDark.addListener(onMq);
  }
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── 푸터 통일 ──────────────────────────────────────────── */
  var footWrap = document.querySelector(".site-footer .wrap");
  if (footWrap) {
    // 분류에 붙은 주의 문구(예: EValue의 "실제 시세가 아닙니다")는 그 분류의 글 아래에만
    var footCat = !isIndex && current ? catOf(current.cat) : null;
    var footNote = footCat && footCat.note ? esc(footCat.note) : "";
    footWrap.innerHTML =
      '<p class="foot-copy">© ' + new Date().getFullYear() + " Seok Lab · 연구하면서, 개발합니다</p>" +
      '<nav class="foot-nav" aria-label="바닥 메뉴">' +
      '<a href="' + root + '">글</a>' +
      '<a href="' + root + 'feed.xml">RSS</a>' +
      '<a href="' + GITHUB + '">GitHub</a></nav>' +
      '<p class="foot-note"' + (footNote ? "" : " hidden") + ">" + footNote +
      '<span class="views" data-foot-views hidden></span></p>';
    // 이 페이지의 조회수 (수집이 켜져 있고 집계가 잡힐 때만 조용히 나타난다)
    fetchViews(location.pathname, function (n) {
      var v = footWrap.querySelector("[data-foot-views]");
      if (v) {
        v.textContent = "이 페이지 조회 " + n;
        v.hidden = false;
        v.parentNode.hidden = false;
      }
    });
  }

  /* ── 위로 가기 ──────────────────────────────────────────── */
  var toTop = el("button", "to-top", ICONS.up);
  toTop.type = "button";
  toTop.setAttribute("aria-label", "맨 위로");
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(toTop);
  window.addEventListener(
    "scroll",
    function () {
      toTop.classList.toggle("show", window.scrollY > 640);
    },
    { passive: true }
  );

  /* ── 홈: 소개(정적) → 분류 탭 → 글 목록 ──────────────────
     탭은 목록 안의 글만 거른다. 소개·탭 자리·줄 모양·순서(최신순)는 어느 탭에서도 같고,
     페이지를 다시 불러오지 않는다. 주소의 ?cat=만 바꿔 두어서 새로고침·공유·뒤로 가기에도 그대로다 */
  // 목록 한 줄: 왼쪽에 메타·제목·요약, 오른쪽에 썸네일.
  // 시리즈 글은 접두어를 메타로 내린다: 메타 "DFT 실습 9 · 복습 · 2026.09.28", 제목은 본 제목만.
  // 시리즈 표기에 분류 이름이 들어 있으므로 분류를 따로 반복하지 않는다. 시리즈가 아니면 "EValue · 날짜"
  function row(p) {
    var c = catOf(p.cat);
    var st = seriesTag(p);
    var meta = [esc(st || (c ? c.mark || c.name : p.cat))];
    if (p.tag) meta.push(esc(p.tag));
    meta.push('<time datetime="' + isoDate(p.date) + '">' + p.date + "</time>");
    return (
      '<a class="post-row" href="' + href(p) + '">' +
      '<span class="row-text">' +
      '<span class="row-meta">' + meta.join('<i aria-hidden="true">·</i>') + "</span>" +
      '<span class="row-title">' + esc(st ? bareTitle(p.title) : p.title) + "</span>" +
      '<span class="row-desc">' + esc(p.blurb) + "</span>" +
      "</span>" +
      thumb(p) +
      "</a>"
    );
  }

  if (isIndex) {
    // 소개 카드의 이름·문구도 posts.js의 site.author에서(index.html에 박힌 것은 예비)
    if (SITE.author) {
      var pName = document.querySelector(".profile-name");
      var pBio = document.querySelector(".profile-bio");
      if (pName) pName.textContent = SITE.author.name;
      if (pBio) pBio.textContent = SITE.author.bio;
    }
    var homeEl = document.getElementById("home");
    var baseTitle = document.title;
    var tabItems = [{ key: "", label: "전체", n: posts.length }].concat(
      cats.map(function (c) {
        return { key: c.key, label: c.mark || c.name, n: counts[c.key] || 0 };
      })
    );
    homeEl.innerHTML =
      '<nav class="tabs" aria-label="분류">' +
      tabItems
        .map(function (t) {
          return (
            '<a href="' + root + (t.key ? "?cat=" + t.key : "") + '" data-cat="' + t.key + '">' +
            esc(t.label) + ' <span class="n">' + t.n + "</span></a>"
          );
        })
        .join("") +
      "</nav>" +
      '<ul class="post-list">' +
      posts
        .map(function (p) {
          return '<li data-cat="' + esc(p.cat) + '">' + row(p) + "</li>";
        })
        .join("") +
      "</ul>" +
      '<p class="list-more" hidden><button type="button" class="btn" data-more>더 보기 <span class="n"></span></button></p>';

    // 처음엔 12편만. "더 보기"를 누르면 전부 보이고, 그 상태는 이 탭(브라우저 탭)이 살아 있는 동안 남아서
    // 글을 읽고 뒤로 와도 펼쳐진 채다(브라우저의 스크롤 복원이 맞아야 한다). 탭마다 그 분류의 첫 12편
    var PAGE = 12;
    var expanded = false;
    try {
      expanded = sessionStorage.getItem("homeExpanded") === "1";
    } catch (e) {}
    var moreWrap = homeEl.querySelector(".list-more");
    var moreBtn = moreWrap.querySelector("[data-more]");
    var tabBar = homeEl.querySelector(".tabs");
    var rows = homeEl.querySelectorAll(".post-list > li");
    var curKey = "";
    var filterTo = function (key) {
      var c = key ? catOf(key) : null;
      if (!c) key = "";
      curKey = key;
      Array.prototype.forEach.call(tabBar.children, function (a) {
        var on = a.getAttribute("data-cat") === key;
        a.classList.toggle("on", on);
        if (on) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      var matched = 0;
      var shown = 0;
      Array.prototype.forEach.call(rows, function (li) {
        var match = !key || li.getAttribute("data-cat") === key;
        var show = match && (expanded || matched < PAGE);
        if (match) matched++;
        if (show) shown++;
        li.hidden = !show;
      });
      var rest = matched - shown;
      moreBtn.querySelector(".n").textContent = rest + "편";
      moreWrap.hidden = rest === 0;
      document.title = c ? c.name + " · Seok Lab" : baseTitle;
      return key;
    };
    moreBtn.addEventListener("click", function () {
      expanded = true;
      try {
        sessionStorage.setItem("homeExpanded", "1");
      } catch (e) {}
      filterTo(curKey);
    });
    var urlFor = function (key) {
      return location.pathname + (key ? "?cat=" + key : "");
    };

    // 처음 열 때: ?cat=만 읽는다. 예전 주소(?view=all, &track=)는 같은 화면의 깨끗한 주소로 바꿔 둔다
    var startKey = filterTo(params.get("cat") || "");
    if (location.search !== (startKey ? "?cat=" + startKey : "")) history.replaceState(null, "", urlFor(startKey));

    // 좁은 화면에서 탭 줄이 옆으로 밀릴 때, 고른 탭이 가려져 있으면 보이는 곳으로 옮긴다
    var onTab = tabBar.querySelector(".on");
    if (onTab && tabBar.scrollWidth > tabBar.clientWidth) {
      var barBox = tabBar.getBoundingClientRect();
      var tabBox = onTab.getBoundingClientRect();
      if (tabBox.right > barBox.right || tabBox.left < barBox.left) tabBar.scrollLeft += tabBox.left - barBox.left - 24;
    }

    tabBar.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-cat]");
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // 새 탭으로 열기는 그대로 둔다
      e.preventDefault();
      history.replaceState(null, "", urlFor(filterTo(a.getAttribute("data-cat"))));
    });

    // 처음이라면: 글이 2편 이상인 갈래(DFT 이론·DFT 실습·첫잔)의 1편. 분류 순서, 그 안에서는 읽는 순서로 처음 나온 갈래 순.
    // 소개 카드 안에 그린다. 탭과 무관하게 늘 같은 자리
    var starts = [];
    cats.forEach(function (c) {
      var seen = {};
      var order = [];
      posts
        .filter(function (p) {
          return p.cat === c.key && p.series;
        })
        .sort(byOrder)
        .forEach(function (p) {
          var m = /^(.+?)\s\[(\d+)\]\s—\s/.exec(p.title);
          if (!m) return;
          var n = parseInt(m[2], 10);
          if (!seen[m[1]]) {
            seen[m[1]] = { label: m[1], count: 0, n: n, post: p };
            order.push(m[1]);
          }
          var t = seen[m[1]];
          t.count++;
          if (n < t.n) {
            t.n = n;
            t.post = p;
          }
        });
      order.forEach(function (k) {
        if (seen[k].count >= 2) starts.push(seen[k]);
      });
    });
    var startEl = document.querySelector(".profile-start");
    if (startEl && starts.length) {
      startEl.innerHTML =
        '<p class="side-title">처음이라면</p><ul>' +
        starts
          .map(function (t) {
            return (
              '<li><a href="' + href(t.post) + '"><span class="n">' + esc(t.label + " " + t.n) + "</span>" +
              '<span class="t">' + esc(bareTitle(t.post.title)) + "</span></a></li>"
            );
          })
          .join("") +
        "</ul>";
      startEl.hidden = false;
    }
  }

  /* ── 글 페이지 ─────────────────────────────────────────── */
  var article = !isIndex ? document.querySelector("article") : null;
  if (article) {
    var layout = article.parentNode;
    var sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.hidden = true; // 예비 사이드바는 접는다
    document.body.classList.add("is-post");

    // 작가 카드: 글에 박힌 문구 대신 posts.js의 site.author 한 곳에서 읽는다(박힌 것은 JS 없는 환경용 예비)
    var acard = article.querySelector(".author-card");
    if (acard && SITE.author) {
      var ac = current ? catOf(current.cat) : null;
      acard.innerHTML =
        '<img src="' + root + 'assets/profile.png" alt="" width="48" height="48">' +
        '<div><p class="who">' + esc(SITE.author.name) + "</p><p>" + esc(SITE.author.bio) +
        (ac ? ' <a href="' + root + "?cat=" + current.cat + '">' + esc(ac.mark || ac.name) + " 글 더 보기</a>" : "") +
        "</p></div>";
    }

    // 읽기 진행바
    var pbar = el("div", "progress-bar");
    pbar.setAttribute("aria-hidden", "true");
    document.body.appendChild(pbar);
    var paintProgress = function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var x = total > 0 ? Math.min(1, window.scrollY / total) : 0;
      pbar.style.transform = "scaleX(" + x + ")";
    };
    paintProgress();
    window.addEventListener("scroll", paintProgress, { passive: true });
    window.addEventListener("resize", paintProgress, { passive: true });

    // 시리즈 띠: 몇 편 중 몇 편, 앞뒤 이동
    var chain = current && current.series ? chainOf(current.series) : [];
    var pos = -1;
    chain.forEach(function (p, k) {
      if (p.slug === current.slug) pos = k;
    });
    var head = article.querySelector(".post-head");
    if (head && current && pos >= 0 && chain.length > 1) {
      var chipDup = head.querySelector(".meta-row .chip-cat");
      if (chipDup) chipDup.remove();
      var c = catOf(current.cat);
      var strip = document.createElement("nav");
      strip.className = "series-strip";
      strip.setAttribute("aria-label", "시리즈");
      strip.innerHTML =
        '<a class="ss-name" href="' + root + "?cat=" + current.cat + '">' + esc(c ? c.name : current.cat) + "</a>" +
        '<span class="ss-pos">' + (pos + 1) + " / " + chain.length + "</span>" +
        '<span class="ss-links">' +
        (pos > 0 ? '<a href="' + chain[pos - 1].slug + '.html" aria-label="이전 편">←</a>' : '<span class="dim">←</span>') +
        (pos >= 0 && pos < chain.length - 1 ? '<a href="' + chain[pos + 1].slug + '.html" aria-label="다음 편">→</a>' : '<span class="dim">→</span>') +
        "</span>";
      head.parentNode.insertBefore(strip, head);
    }

    // 읽는 시간: 한국어 본문 기준 분당 500자 (+ 링크 복사 + 조회수)
    var meta = article.querySelector(".post-head .meta-row");
    if (meta) {
      var text = "";
      var kids = article.children;
      for (var k = 0; k < kids.length; k++) {
        var kEl = kids[k];
        if (/(^|\s)(post-head|author-card|post-nav|series-strip|series-box)(\s|$)/.test(kEl.className)) continue;
        text += kEl.textContent || "";
      }
      var chars = text.replace(/\s+/g, "").length;
      var mins = Math.max(1, Math.round(chars / 500));
      var span = document.createElement("span");
      span.textContent = mins + "분 읽기";
      meta.appendChild(span);

      var vSpan = el("span", "views");
      vSpan.hidden = true;
      meta.appendChild(vSpan);
      fetchViews(location.pathname, function (n) {
        vSpan.textContent = "조회 " + n;
        vSpan.hidden = false;
      });

      var cbtn = el("button", "copylink", ICONS.link + "<span>링크 복사</span>");
      cbtn.type = "button";
      cbtn.addEventListener("click", function () {
        var url = (SITE.url || location.origin) + location.pathname;
        copyText(url, function () {
          cbtn.classList.add("done");
          cbtn.querySelector("span").textContent = "복사됨";
          setTimeout(function () {
            cbtn.classList.remove("done");
            cbtn.querySelector("span").textContent = "링크 복사";
          }, 1600);
        });
      });
      meta.appendChild(cbtn);
    }

    // 소제목 id + 오른쪽 목차 + 앵커(#)
    var heads = Array.prototype.slice.call(article.querySelectorAll("h2, h3"));
    var used = {};
    heads.forEach(function (h) {
      if (!h.id) {
        var base = (h.textContent || "").trim().replace(/\s+/g, "-").replace(/[^\w\-가-힣]/g, "").slice(0, 40) || "s";
        var id = base;
        var n = 2;
        while (used[id] || document.getElementById(id)) id = base + "-" + n++;
        h.id = id;
      }
      used[h.id] = true;
      var a = el("a", "anchor-a", "#");
      a.href = "#" + h.id;
      a.setAttribute("aria-label", "이 소제목으로 바로 가는 링크");
      h.appendChild(a);
    });
    var h2s = heads.filter(function (h) {
      return h.tagName === "H2";
    });
    if (h2s.length >= 2 && layout) {
      var rail = document.createElement("aside");
      rail.className = "rail";
      rail.innerHTML =
        '<nav class="toc" aria-label="이 글의 소제목"><p class="side-title">목차</p><ul>' +
        h2s
          .map(function (h) {
            return '<li><a href="#' + h.id + '">' + esc(h.textContent.replace(/#\s*$/, "").trim()) + "</a></li>";
          })
          .join("") +
        "</ul></nav>";
      layout.appendChild(rail);
      var links = rail.querySelectorAll("a");
      var pick = function () {
        var y = window.scrollY + Math.min(240, window.innerHeight * 0.3);
        var last = h2s[0];
        for (var r = 0; r < h2s.length; r++) if (h2s[r].offsetTop <= y) last = h2s[r];
        for (var q = 0; q < links.length; q++)
          links[q].classList.toggle("on", links[q].getAttribute("href") === "#" + last.id);
      };
      pick();
      window.addEventListener("scroll", pick, { passive: true });
    }

    // 코드 복사 단추
    Array.prototype.forEach.call(article.querySelectorAll("pre"), function (pre) {
      if (pre.parentNode.classList && pre.parentNode.classList.contains("pre-wrap")) return;
      var wrapEl = el("div", "pre-wrap");
      pre.parentNode.insertBefore(wrapEl, pre);
      wrapEl.appendChild(pre);
      var b = el("button", "copy-btn", ICONS.copy + "<span>복사</span>");
      b.type = "button";
      b.setAttribute("aria-label", "코드 복사");
      b.addEventListener("click", function () {
        copyText(pre.textContent, function () {
          b.classList.add("done");
          b.querySelector("span").textContent = "복사됨";
          setTimeout(function () {
            b.classList.remove("done");
            b.querySelector("span").textContent = "복사";
          }, 1600);
        });
      });
      wrapEl.appendChild(b);
    });

    // 그림 라이트박스: 스크린샷·삽화를 눌러 크게 본다
    Array.prototype.forEach.call(article.querySelectorAll("figure img"), function (img) {
      img.classList.add("zoomable");
      img.addEventListener("click", function () {
        var fig = img.closest("figure");
        var cap = fig ? fig.querySelector("figcaption") : null;
        var box = el("div", "lightbox");
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-label", "그림 크게 보기");
        var big = new Image();
        big.src = img.currentSrc || img.src;
        big.alt = img.alt || "";
        box.appendChild(big);
        if (cap) box.appendChild(el("figcaption", "", cap.innerHTML));
        var close = function () {
          box.remove();
          document.removeEventListener("keydown", onKey);
        };
        var onKey = function (e) {
          if (e.key === "Escape") close();
        };
        box.addEventListener("click", close);
        document.addEventListener("keydown", onKey);
        document.body.appendChild(box);
      });
    });

    // 하단: 이전/다음/관련 + 같은 시리즈 목록
    if (current) {
      var items = [];
      if (pos > 0) items.push(["prev", "이전 글", chain[pos - 1]]);
      if (pos >= 0 && pos < chain.length - 1) items.push(["next", "다음 글", chain[pos + 1]]);
      (current.related || []).forEach(function (sl) {
        for (var j = 0; j < posts.length; j++) if (posts[j].slug === sl) items.push(["rel", "관련 글", posts[j]]);
      });
      var anchor = article.querySelector(".author-card");
      var pnav = article.querySelector(".post-nav");

      if (items.length) {
        if (!pnav) {
          pnav = document.createElement("nav");
          pnav.className = "post-nav";
          if (anchor) anchor.parentNode.insertBefore(pnav, anchor);
          else article.appendChild(pnav);
        }
        pnav.setAttribute("aria-label", "이어지는 글");
        pnav.innerHTML = items
          .map(function (it) {
            return '<a class="' + it[0] + '" href="' + it[2].slug + '.html"><span>' + it[1] + "</span>" + esc(it[2].title) + "</a>";
          })
          .join("\n");
      } else if (pnav) {
        pnav.remove();
      }
      if (chain.length > 1) {
        var cc = catOf(current.cat);
        var chainTracks = tracksIn(chain);
        var sbox = document.createElement("section");
        sbox.className = "series-box";
        sbox.innerHTML =
          '<p class="side-title">' + esc(cc ? cc.name : current.cat) + ' 시리즈 <span class="n">' + chain.length + "편</span></p><ol>" +
          chain
            .map(function (p) {
              var on = p.slug === current.slug;
              return (
                "<li" + (on ? ' class="on"' : "") + '><span class="num">' + pad2(p.order || 0) + "</span>" +
                "<span>" + trackChip(p, chainTracks) +
                (on ? '<span class="t">' + esc(bareTitle(p.title)) + " <em>지금 읽는 글</em></span>" : '<a href="' + p.slug + '.html">' + esc(bareTitle(p.title)) + "</a>") +
                "</span>" +
                "</li>"
              );
            })
            .join("") +
          "</ol>";
        if (anchor) anchor.parentNode.insertBefore(sbox, anchor);
        else article.appendChild(sbox);
      }

      // ← / → 키로 앞뒤 편 이동 (본문 입력 중이 아닐 때만)
      document.addEventListener("keydown", function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
        if (document.body.classList.contains("pal-open")) return;
        var t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        if (e.key === "ArrowLeft" && pos > 0) location.href = chain[pos - 1].slug + ".html";
        if (e.key === "ArrowRight" && pos >= 0 && pos < chain.length - 1) location.href = chain[pos + 1].slug + ".html";
      });

      // 검색엔진용 구조화 데이터 + 대표 주소
      injectSeo(current);
    }
  }

  function injectSeo(p) {
    var base = SITE.url || "";
    if (!base) return;
    var url = base + "/posts/" + p.slug + ".html";
    var link = document.createElement("link");
    link.rel = "canonical";
    link.href = url;
    document.head.appendChild(link);
    var ld = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: isoDate(p.date),
      inLanguage: "ko",
      author: { "@type": "Person", name: "Seok", url: base + "/" },
      mainEntityOfPage: url,
      description: p.blurb,
    };
    if (p.thumb) ld.image = base + "/" + p.thumb;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  /* RSS 자동 발견 + SVG 파비콘 (지원 브라우저는 이 쪽을 쓴다) */
  (function () {
    var l = document.createElement("link");
    l.rel = "alternate";
    l.type = "application/rss+xml";
    l.title = "Seok Lab";
    l.href = root + "feed.xml";
    document.head.appendChild(l);
    var f = document.createElement("link");
    f.rel = "icon";
    f.type = "image/svg+xml";
    f.href = root + "assets/favicon.svg";
    document.head.appendChild(f);
  })();

  function copyText(text, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        ok();
      } catch (e) {}
      ta.remove();
    }
  }

  /* ── 팔레트: ⌘K / Ctrl+K / "/" 로 여는 빠른 찾기 ───────── */
  var pal = null;
  var palInput = null;
  var palList = null;
  var palSel = 0;
  var palItems = [];

  var COMMANDS = [
    { label: "홈으로 (전체 글)", run: function () { location.href = root; } },
    {
      label: "무작위 글 열기",
      run: function () {
        var p = posts[Math.floor(Math.random() * posts.length)];
        location.href = href(p);
      },
    },
    { label: "밝기 전환 (라이트/다크)", run: function () { toggleTheme(); } },
    { label: "RSS 구독", run: function () { location.href = root + "feed.xml"; } },
  ];

  function buildPalette() {
    pal = el("div", "palette");
    pal.hidden = true;
    pal.innerHTML =
      '<div class="pal-panel" role="dialog" aria-modal="true" aria-label="글 찾기">' +
      '<div class="pal-input">' + ICONS.search +
      '<input type="text" placeholder="글 제목·내용·카테고리로 찾기" aria-label="검색어">' +
      "<kbd>esc</kbd></div>" +
      '<ul class="pal-list"></ul>' +
      '<div class="pal-hint"><span><kbd>↑</kbd><kbd>↓</kbd> <b>이동</b></span><span><kbd>↵</kbd> <b>열기</b></span><span class="pal-k">' +
      posts.length + "편 수록</span></div></div>";
    document.body.appendChild(pal);
    palInput = pal.querySelector("input");
    palList = pal.querySelector(".pal-list");
    pal.addEventListener("mousedown", function (e) {
      if (e.target === pal) closePalette();
    });
    palInput.addEventListener("input", function () {
      renderPal(palInput.value);
    });
    palInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        movePal(1);
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        movePal(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        var it = palItems[palSel];
        if (it) runPal(it);
      } else if (e.key === "Escape") {
        closePalette();
      }
    });
  }

  // "얀텔러"로 "얀-텔러"도 찾도록, 붙임표·가운뎃점·공백을 걷어낸 사본으로도 대본다
  function squash(s) {
    return s.toLowerCase().replace(/[\s\-–—·.,()\[\]"']/g, "");
  }
  function palScore(p, q) {
    var hay = (p.title + " " + p.blurb + " " + ((catOf(p.cat) || {}).name || "")).toLowerCase();
    var hayS = squash(hay);
    var title = p.title.toLowerCase();
    var titleS = squash(title);
    var score = 0;
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var tS = squash(t);
      if (hay.indexOf(t) < 0 && (!tS || hayS.indexOf(tS) < 0)) return 0;
      score += title.indexOf(t) === 0 ? 12 : title.indexOf(t) >= 0 || titleS.indexOf(tS) >= 0 ? 6 : 1;
    }
    return score;
  }

  function renderPal(q) {
    q = (q || "").trim();
    palItems = [];
    var html = "";
    if (!q) {
      posts.slice(0, 5).forEach(function (p) {
        palItems.push({ type: "post", p: p });
      });
      COMMANDS.forEach(function (cmd) {
        palItems.push({ type: "cmd", cmd: cmd });
      });
    } else {
      var scored = posts
        .map(function (p) {
          return { p: p, s: palScore(p, q) };
        })
        .filter(function (x) {
          return x.s > 0;
        })
        .sort(function (a, b) {
          return b.s - a.s;
        })
        .slice(0, 9);
      scored.forEach(function (x) {
        palItems.push({ type: "post", p: x.p });
      });
      COMMANDS.forEach(function (cmd) {
        if (cmd.label.toLowerCase().indexOf(q.toLowerCase()) >= 0) palItems.push({ type: "cmd", cmd: cmd });
      });
    }
    if (!palItems.length) {
      palList.innerHTML = '<li class="pal-empty">"' + esc(q) + '" 에 맞는 글이 없습니다</li>';
      return;
    }
    palSel = 0;
    html = palItems
      .map(function (it, i) {
        if (it.type === "post") {
          var c = catOf(it.p.cat);
          return (
            '<li class="pal-item' + (i === palSel ? " on" : "") + '" data-i="' + i + '"><a href="' + href(it.p) + '">' +
            '<span class="t">' + esc(it.p.title) + "</span>" +
            '<span class="pal-meta">' + esc(c ? c.mark || c.name : "") + " · " + shortDate(it.p.date) + "</span>" +
            '<span class="b">' + esc(it.p.blurb) + "</span>" +
            "</a></li>"
          );
        }
        return (
          '<li class="pal-item pal-cmd' + (i === palSel ? " on" : "") + '" data-i="' + i + '"><button type="button">' +
          '<span class="t">' + esc(it.cmd.label) + '</span><span class="pal-meta">명령</span></button></li>'
        );
      })
      .join("");
    palList.innerHTML = html;
    Array.prototype.forEach.call(palList.querySelectorAll(".pal-item"), function (li) {
      li.addEventListener("mouseenter", function () {
        palSel = parseInt(li.getAttribute("data-i"), 10);
        paintPalSel();
      });
      li.addEventListener("click", function (e) {
        var it = palItems[parseInt(li.getAttribute("data-i"), 10)];
        if (it && it.type === "cmd") {
          e.preventDefault();
          runPal(it);
        } else {
          closePalette();
        }
      });
    });
  }

  function paintPalSel() {
    Array.prototype.forEach.call(palList.querySelectorAll(".pal-item"), function (li, i) {
      li.classList.toggle("on", i === palSel);
    });
    var onEl = palList.querySelector(".pal-item.on");
    if (onEl && onEl.scrollIntoView) onEl.scrollIntoView({ block: "nearest" });
  }

  function movePal(d) {
    if (!palItems.length) return;
    palSel = (palSel + d + palItems.length) % palItems.length;
    paintPalSel();
  }

  function runPal(it) {
    if (it.type === "post") {
      location.href = href(it.p);
    } else {
      closePalette();
      it.cmd.run();
    }
  }

  function openPalette() {
    if (!pal) buildPalette();
    pal.hidden = false;
    document.body.classList.add("pal-open");
    palInput.value = "";
    renderPal("");
    palInput.focus();
  }

  function closePalette() {
    if (!pal) return;
    pal.hidden = true;
    document.body.classList.remove("pal-open");
  }

  // 페이지 안의 "글 찾기" 단추(404 등)
  Array.prototype.forEach.call(document.querySelectorAll("[data-open-palette]"), function (b) {
    b.addEventListener("click", openPalette);
  });

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (pal && !pal.hidden) closePalette();
      else openPalette();
      return;
    }
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      openPalette();
    }
  });

  /* α-NaMnO₂처럼 그리스 문자와 붙임표로 시작하는 화학식은 붙임표에서 줄이 갈리지 않게
     한 덩어리로 묶는다. 목록까지 다 그린 뒤 한 번만 돈다. 코드·도해 안은 건드리지 않는다 */
  var CHEM = /[αβγδλ]-[A-Za-z0-9₀-₉]+/;
  var CHEM_ALL = /[αβγδλ]-[A-Za-z0-9₀-₉]+/g;
  var mainEl = document.querySelector("main");
  if (mainEl && document.createTreeWalker) {
    var walker = document.createTreeWalker(mainEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!CHEM.test(n.nodeValue)) return NodeFilter.FILTER_SKIP;
        return n.parentNode.closest("pre, code, svg, script, style, .nobr")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    var hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    hits.forEach(function (n) {
      var frag = document.createDocumentFragment();
      var text = n.nodeValue;
      var last = 0;
      text.replace(CHEM_ALL, function (m, at) {
        if (at > last) frag.appendChild(document.createTextNode(text.slice(last, at)));
        frag.appendChild(el("span", "nobr", esc(m)));
        last = at + m.length;
        return m;
      });
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }
})();
