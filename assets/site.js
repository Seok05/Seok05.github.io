/* ─────────────────────────────────────────────────────────────
   assets/posts.js 의 데이터로 페이지를 조립한다.

   홈(index.html)
     - 기본: 소개(정적) → 기록의 리듬(달력+숫자) → 지금 쓰는 시리즈
       → 시리즈 카드 → 최근 글
     - ?view=all : 전체 글을 달별로
     - ?cat=<key>: 카테고리 하나. 시리즈면 읽는 순서대로 번호를 붙인다
       제목에 갈래가 있으면(DFT 이론·실습) 표시를 달고 탭으로 나눠 본다(&track=이론)
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

  var isIndex = !!document.getElementById("listing");
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
  function monthKey(d) {
    return d.slice(0, 7); // 2026.08
  }
  function monthLabel(k) {
    return k.slice(0, 4) + "년 " + String(parseInt(k.slice(5), 10)) + "월";
  }
  function href(p) {
    return root + "posts/" + p.slug + ".html";
  }
  function catPosts(key) {
    return posts.filter(function (p) {
      return p.cat === key;
    });
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
      '" style="--hue:' + (c.hue || 245) + '" aria-hidden="true">' + inner + "</div>"
    );
  }
  // 카드 썸네일: 글에 thumb가 있으면 그 그림, 없으면 카테고리 표지
  function thumb(p) {
    if (p.thumb) return '<div class="thumb"><img src="' + root + p.thumb + '" alt="" loading="lazy" decoding="async"></div>';
    var c = catOf(p.cat);
    return '<div class="thumb thumb-cover">' + (c ? cover(c) : "") + "</div>";
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
  var view = isIndex ? (params.get("view") === "all" ? "all" : params.get("cat") ? "cat" : "home") : "post";
  var activeCat = view === "cat" && catOf(params.get("cat")) ? params.get("cat") : null;
  if (view === "cat" && !activeCat) view = "home";

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
    fetch("https://" + GC + ".goatcounter.com/counter/" + path + ".json")
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

  /* ── 헤더: 메뉴 통일 + 검색 + 테마 토글 + 스크롤 밑줄 ─── */
  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".site-nav");
  if (nav) {
    nav.innerHTML =
      '<a href="' + root + '?view=all" data-nav="all">글</a>' +
      '<a href="' + root + '#series" data-nav="series">시리즈</a>' +
      '<a href="' + GITHUB + '">GitHub</a>';
    if (view === "all") {
      var onA = nav.querySelector('[data-nav="all"]');
      if (onA) onA.classList.add("on");
    }

    var sbtn = el("button", "icon-btn search-btn", ICONS.search + "<kbd>⌘K</kbd>");
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
    var fixed = doc.getAttribute("data-theme");
    var dark = fixed ? fixed === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    doc.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
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
    footWrap.innerHTML =
      '<div class="foot-brand"><p class="foot-name">Seok Lab</p><p>연구하면서, 개발합니다</p></div>' +
      '<nav class="foot-nav" aria-label="바닥 메뉴">' +
      '<a href="' + root + '?view=all">글</a>' +
      '<a href="' + root + '#series">시리즈</a>' +
      '<a href="' + root + 'feed.xml">RSS</a>' +
      '<a href="' + GITHUB + '">GitHub</a></nav>' +
      '<p class="foot-note"><span>글의 예시 수치는 설명용이며 실제 시세가 아닙니다.</span>' +
      "<span>빌드 도구 없는 정적 HTML · GitHub Pages</span>" +
      '<span class="views" data-foot-views hidden></span></p>';
    // 이 페이지의 조회수 (수집이 켜져 있고 집계가 잡힐 때만 조용히 나타난다)
    fetchViews(location.pathname, function (n) {
      var v = footWrap.querySelector("[data-foot-views]");
      if (v) {
        v.textContent = "이 페이지 조회 " + n;
        v.hidden = false;
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

  /* ── 홈 ────────────────────────────────────────────────── */
  if (isIndex) {
    var hero = document.getElementById("hero");
    var pulseEl = document.getElementById("pulse");
    var featuredEl = document.getElementById("featured");
    var seriesEl = document.getElementById("series");
    var recentEl = document.getElementById("recent");
    var listingEl = document.getElementById("listing");
    var homeOnly = [hero, pulseEl, featuredEl, seriesEl, recentEl];

    var featuredCat = null;
    for (var f = 0; f < cats.length; f++) if (cats[f].featured) featuredCat = cats[f];
    if (!featuredCat) featuredCat = cats[0];

    if (view === "home") {
      // 소개 아래 버튼: 지금 쓰는 시리즈의 1편
      var fPosts = catPosts(featuredCat.key);
      var fChain = fPosts.filter(function (p) {
        return p.series;
      }).sort(byOrder);
      var first = fChain[0] || fPosts[fPosts.length - 1];
      var actions = document.getElementById("hero-actions");
      if (actions && first) {
        actions.insertAdjacentHTML(
          "afterbegin",
          '<a class="btn primary" href="' + href(first) + '">' + esc(featuredCat.mark || featuredCat.name) + " 일지 1편부터 읽기</a>"
        );
      }
      var allBtn = document.getElementById("hero-all");
      if (allBtn) allBtn.textContent = "전체 글 " + posts.length + "편";

      // 기록의 리듬: 잔디 달력 + 숫자 네 개
      if (pulseEl) renderPulse(pulseEl);

      // 지금 쓰는 시리즈
      if (featuredEl && fPosts.length) {
        var latest = fPosts[0];
        var listSrc = fChain.length ? fChain : fPosts;
        var shownList = fChain.length ? listSrc.slice(-5) : listSrc.slice(0, 5);
        featuredEl.innerHTML =
          '<p class="eyebrow">지금 쓰는 시리즈</p>' +
          '<article class="featured">' +
          '<a class="featured-cover" href="' + root + "?cat=" + featuredCat.key + '">' + cover(featuredCat, "lg") + "</a>" +
          '<div class="featured-body">' +
          '<h2><a href="' + root + "?cat=" + featuredCat.key + '">' + esc(featuredCat.name) + "</a></h2>" +
          '<p class="desc">' + esc(featuredCat.desc || "") + "</p>" +
          '<p class="meta">' + fPosts.length + "편 · 최근 " + latest.date + "</p>" +
          '<ol class="featured-list">' +
          shownList
            .map(function (p) {
              var n = p.order ? pad2(p.order) : "";
              return (
                '<li><a href="' + href(p) + '">' +
                (n ? '<span class="num">' + n + "</span>" : "") +
                '<span class="t">' + esc(fChain.length ? bareTitle(p.title) : p.title) + "</span>" +
                '<time datetime="' + isoDate(p.date) + '">' + shortDate(p.date) + "</time></a></li>"
              );
            })
            .join("") +
          "</ol>" +
          '<a class="more" href="' + root + "?cat=" + featuredCat.key + '">이 시리즈 모두 보기 <span aria-hidden="true">→</span></a>' +
          "</div></article>";
      }

      // 시리즈 카드
      if (seriesEl) {
        seriesEl.innerHTML =
          '<div class="sec-head"><h2>시리즈</h2><p>주제별로 묶어 두었습니다. 시리즈는 1편부터 읽는 편이 좋습니다.</p></div>' +
          '<div class="cat-grid">' +
          cats
            .map(function (c) {
              var cp = catPosts(c.key);
              var last = cp[0];
              return (
                '<a class="cat-card" href="' + root + "?cat=" + c.key + '">' +
                cover(c) +
                "<div>" +
                "<h3>" + esc(c.name) + "</h3>" +
                '<p class="desc">' + esc(c.desc || "") + "</p>" +
                '<p class="meta">' + cp.length + "편" + (last ? " · 최근 " + esc(bareTitle(last.title)) : "") + "</p>" +
                "</div></a>"
              );
            })
            .join("") +
          "</div>";
      }

      // 최근 글
      if (recentEl) {
        recentEl.innerHTML =
          '<div class="sec-head row"><h2>최근 글</h2><a class="more" href="' + root + '?view=all">전체 ' + posts.length + '편 <span aria-hidden="true">→</span></a></div>' +
          '<div class="post-grid">' +
          posts
            .slice(0, 6)
            .map(function (p) {
              return (
                '<a class="post-card" href="' + href(p) + '">' + thumb(p) +
                '<div class="post-card-body">' + metaRow(p, true) +
                "<h3>" + esc(p.title) + "</h3>" +
                "<p>" + esc(p.blurb) + "</p></div></a>"
              );
            })
            .join("") +
          "</div>";
      }
      if (listingEl) listingEl.hidden = true;
    } else {
      // 목록 보기: 홈 구획은 숨기고 listing만
      homeOnly.forEach(function (el2) {
        if (el2) el2.hidden = true;
      });
      var filter =
        '<nav class="filter" aria-label="카테고리"><a href="' + root + '?view=all"' + (view === "all" ? ' class="on"' : "") +
        '>전체 <span class="n">' + posts.length + "</span></a>" +
        cats
          .map(function (c) {
            return (
              '<a href="' + root + "?cat=" + c.key + '"' + (activeCat === c.key ? ' class="on"' : "") + ">" +
              esc(c.name) + ' <span class="n">' + (counts[c.key] || 0) + "</span></a>"
            );
          })
          .join("") +
        "</nav>";

      var html = "";
      if (view === "all") {
        html += '<div class="list-head"><h1>전체 글</h1><p class="list-desc">' + posts.length + "편. 최신 글이 위에 있습니다.</p></div>" + filter;
        var groups = [];
        var idx = {};
        posts.forEach(function (p) {
          var k = monthKey(p.date);
          if (idx[k] === undefined) {
            idx[k] = groups.length;
            groups.push({ key: k, items: [] });
          }
          groups[idx[k]].items.push(p);
        });
        html +=
          '<div class="archive">' +
          groups
            .map(function (g) {
              return (
                '<section class="month"><h2>' + monthLabel(g.key) + '<span class="n">' + g.items.length + "편</span></h2><ul>" +
                g.items
                  .map(function (p) {
                    var c = catOf(p.cat);
                    return (
                      '<li><a class="row" href="' + href(p) + '"><time datetime="' + isoDate(p.date) + '">' + shortDate(p.date) + "</time>" +
                      '<span class="row-title">' + esc(p.title) + "</span>" +
                      '<span class="row-cat">' + esc(c ? c.name : p.cat) + "</span></a></li>"
                    );
                  })
                  .join("") +
                "</ul></section>"
              );
            })
            .join("") +
          "</div>";
      } else {
        var c = catOf(activeCat);
        var cp = catPosts(activeCat);
        var series = cp.filter(function (p) {
          return p.series;
        }).sort(byOrder);
        var loose = cp.filter(function (p) {
          return !p.series;
        });
        document.title = c.name + " · Seok Lab";
        html +=
          '<div class="list-head cat-head">' + cover(c) + "<div><h1>" + esc(c.name) + "</h1>" +
          '<p class="list-desc">' + esc(c.desc || "") + "</p>" +
          '<p class="meta">' + cp.length + "편" + (cp[0] ? " · 최근 " + cp[0].date : "") + "</p></div></div>" +
          filter;
        var labels = tracksIn(series);
        var wantTrack = labels.indexOf(params.get("track")) >= 0 ? params.get("track") : "";
        if (series.length) {
          html +=
            '<div class="sub-row"><h2 class="sub">읽는 순서</h2>' +
            (labels.length > 1
              ? '<div class="track-tabs" role="group" aria-label="갈래별로 보기">' +
                [""].concat(labels)
                  .map(function (l, k) {
                    var key = k ? l : "";
                    var n = k
                      ? series.filter(function (p) {
                          var t = trackOf(p);
                          return t && t.label === l;
                        }).length
                      : series.length;
                    return (
                      '<button type="button" data-track="' + esc(key) + '" aria-pressed="' + (key === wantTrack) + '">' +
                      (k ? esc(l) : "전체") + ' <span class="n">' + n + "</span></button>"
                    );
                  })
                  .join("") +
                "</div>"
              : "") +
            '</div><ol class="series-list">' +
            series
              .map(function (p) {
                var t = trackOf(p);
                var off = wantTrack && (!t || t.label !== wantTrack);
                return (
                  "<li" + (t ? ' data-track="' + esc(t.label) + '"' : "") + (off ? " hidden" : "") + ">" +
                  '<a href="' + href(p) + '"><span class="num">' + pad2(p.order || 0) + "</span>" + thumb(p) +
                  '<span class="body">' + trackChip(p, labels) + '<span class="t">' + esc(bareTitle(p.title)) + "</span>" +
                  '<span class="b">' + esc(p.blurb) + "</span></span>" +
                  '<time datetime="' + isoDate(p.date) + '">' + p.date + "</time></a></li>"
                );
              })
              .join("") +
            "</ol>";
        }
        if (loose.length) {
          html +=
            (series.length ? '<h2 class="sub">그 밖의 글</h2>' : "") +
            '<div class="post-grid">' +
            loose
              .map(function (p) {
                return (
                  '<a class="post-card" href="' + href(p) + '">' + thumb(p) +
                  '<div class="post-card-body">' + metaRow(p, false) +
                  "<h3>" + esc(p.title) + "</h3><p>" + esc(p.blurb) + "</p></div></a>"
                );
              })
              .join("") +
            "</div>";
        }
      }
      if (listingEl) {
        listingEl.innerHTML = html;
        listingEl.hidden = false;
        // 갈래 탭: 읽는 순서에서 한 갈래(이론·실습)만 남긴다. 주소에 적어 두어 뒤로 오면 그대로다
        var tabs = listingEl.querySelectorAll(".track-tabs button");
        Array.prototype.forEach.call(tabs, function (b) {
          b.addEventListener("click", function () {
            var want = b.getAttribute("data-track");
            Array.prototype.forEach.call(tabs, function (o) {
              o.setAttribute("aria-pressed", String(o === b));
            });
            Array.prototype.forEach.call(listingEl.querySelectorAll(".series-list li"), function (li) {
              li.hidden = !!want && li.getAttribute("data-track") !== want;
            });
            var q = new URLSearchParams(location.search);
            if (want) q.set("track", want);
            else q.delete("track");
            history.replaceState(null, "", "?" + q.toString());
          });
        });
      }
    }
  }

  /* 기록의 리듬: 최근 24주 잔디 + 숫자 네 개 */
  function renderPulse(target) {
    var byDay = {};
    posts.forEach(function (p) {
      byDay[isoDate(p.date)] = (byDay[isoDate(p.date)] || 0) + 1;
    });
    var today = new Date();
    today.setHours(12, 0, 0, 0);
    // 창의 폭은 기록의 역사에 맞춘다: 첫 글 2주 전부터, 12~24주 사이
    var sinceDate = new Date(isoDate(SITE.since || posts[posts.length - 1].date));
    var histWeeks = Math.ceil((today - sinceDate) / (7 * 86400000)) + 2;
    var WEEKS = Math.max(12, Math.min(24, histWeeks));
    // 이번 주 일요일에서 (WEEKS-1)주 전 일요일까지 거슬러 올라간다
    var start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);
    var cells = "";
    var monthSpans = [];
    var lastMonth = "";
    for (var w = 0; w < WEEKS; w++) {
      var weekStart = new Date(start);
      weekStart.setDate(start.getDate() + w * 7);
      var mName = weekStart.getMonth() + 1 + "월";
      if (mName !== lastMonth) {
        monthSpans.push({ name: mName, weeks: 1 });
        lastMonth = mName;
      } else {
        monthSpans[monthSpans.length - 1].weeks++;
      }
      for (var d = 0; d < 7; d++) {
        var day = new Date(weekStart);
        day.setDate(weekStart.getDate() + d);
        var key =
          day.getFullYear() + "-" + pad2(day.getMonth() + 1) + "-" + pad2(day.getDate());
        var n = byDay[key] || 0;
        var lv = day > today ? "future" : n >= 3 ? "l3" : n === 2 ? "l2" : n === 1 ? "l1" : "";
        var label = key.replace(/-/g, ".") + (n ? " · " + n + "편" : "");
        cells += '<i class="hm-cell ' + lv + '" title="' + label + '"></i>';
      }
    }
    var since = SITE.since || posts[posts.length - 1].date;
    var days = Math.max(1, Math.round((today - new Date(isoDate(since))) / 86400000) + 1);
    var thisMonth = monthKey(
      today.getFullYear() + "." + pad2(today.getMonth() + 1) + "." + pad2(today.getDate())
    );
    var monthN = posts.filter(function (p) {
      return monthKey(p.date) === thisMonth;
    }).length;
    var seriesN = cats.length;
    target.innerHTML =
      '<div class="pulse-card">' +
      '<div><p class="eyebrow">기록의 리듬</p>' +
      '<div class="stats">' +
      '<div class="stat"><b>' + posts.length + "<i>편</i></b><span>쌓인 글</span></div>" +
      '<div class="stat"><b>' + seriesN + "<i>개</i></b><span>시리즈</span></div>" +
      '<div class="stat"><b>' + days + "<i>일째</i></b><span>" + since + "부터</span></div>" +
      '<div class="stat"><b>' + monthN + "<i>편</i></b><span>이번 달</span></div>" +
      "</div></div>" +
      '<div class="heatmap" role="img" aria-label="최근 ' + WEEKS + '주 동안 글을 쓴 날 달력">' +
      '<div class="hm-months">' +
      monthSpans
        .map(function (s) {
          return '<span style="width:' + s.weeks * 15 + 'px">' + (s.weeks > 1 ? s.name : "") + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="hm-body"><ul class="hm-dow"><li></li><li>월</li><li></li><li>수</li><li></li><li>금</li><li></li></ul>' +
      '<div class="hm-grid">' + cells + "</div></div>" +
      '<p class="hm-meta">최근 ' + WEEKS + "주 · 진한 칸일수록 그날 올린 글이 많습니다</p>" +
      "</div></div>";
  }

  /* ── 글 페이지 ─────────────────────────────────────────── */
  var article = !isIndex ? document.querySelector("article") : null;
  if (article) {
    var layout = article.parentNode;
    var sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.hidden = true; // 예비 사이드바는 접는다

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
    if (head && current) {
      var c = catOf(current.cat);
      var strip = document.createElement("nav");
      strip.className = "series-strip";
      strip.setAttribute("aria-label", "시리즈");
      strip.innerHTML =
        '<a class="ss-name" href="' + root + "?cat=" + current.cat + '">' + esc(c ? c.name : current.cat) + "</a>" +
        (pos >= 0 ? '<span class="ss-pos">' + (pos + 1) + " / " + chain.length + "편</span>" : "") +
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
        '<nav class="toc" aria-label="이 글의 소제목"><p class="side-title">이 글에서</p><ul>' +
        h2s
          .map(function (h) {
            return '<li><a href="#' + h.id + '">' + esc(h.textContent.replace(/#\s*$/, "").trim()) + "</a></li>";
          })
          .join("") +
        "</ul></nav>";
      layout.appendChild(rail);
      var links = rail.querySelectorAll("a");
      var pick = function () {
        var y = window.scrollY + 120;
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
      if (pos > 0) items.push(["prev", "이전", chain[pos - 1]]);
      if (pos >= 0 && pos < chain.length - 1) items.push(["next", "다음", chain[pos + 1]]);
      (current.related || []).forEach(function (sl) {
        for (var j = 0; j < posts.length; j++) if (posts[j].slug === sl) items.push(["rel", "관련", posts[j]]);
      });
      var anchor = article.querySelector(".author-card");
      var pnav = article.querySelector(".post-nav");

      // 글의 끝 표시
      var endMark = el("p", "post-end", "∎");
      endMark.setAttribute("aria-hidden", "true");
      var endAnchor = pnav || anchor;
      if (endAnchor) endAnchor.parentNode.insertBefore(endMark, endAnchor);

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
          '<p class="side-title">' + esc(cc ? cc.name : current.cat) + " · 전체 " + chain.length + "편</p><ol>" +
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

  /* RSS 자동 발견 */
  (function () {
    var l = document.createElement("link");
    l.rel = "alternate";
    l.type = "application/rss+xml";
    l.title = "Seok Lab";
    l.href = root + "feed.xml";
    document.head.appendChild(l);
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
    { label: "홈으로", run: function () { location.href = root; } },
    { label: "전체 글 보기", run: function () { location.href = root + "?view=all"; } },
    { label: "시리즈 보기", run: function () { location.href = root + "#series"; } },
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
})();
