/* ─────────────────────────────────────────────────────────────
   assets/posts.js 의 데이터로 페이지를 조립한다.

   홈(index.html)
     - 기본: 소개(정적) → 지금 쓰는 시리즈 → 시리즈 카드 → 최근 글
     - ?view=all : 전체 글을 달별로
     - ?cat=<key>: 카테고리 하나. 시리즈면 읽는 순서대로 번호를 붙인다
   글 페이지(posts/*.html)
     - 시리즈 띠(몇 편 중 몇 편), 읽는 시간, 오른쪽 목차, 이전/다음/관련,
       같은 시리즈 목록
   모든 페이지
     - 헤더 메뉴 통일, 라이트/다크 토글, 스크롤 시 헤더 밑줄
   글 HTML 안에 하드코딩된 사이드바·post-nav는 JS가 꺼진 환경을
   위한 예비이며, 이 스크립트가 데이터 기준으로 덮어쓰거나 숨긴다.
   ───────────────────────────────────────────────────────────── */
(function () {
  var D = window.SEOK;
  if (!D) return;
  var posts = D.posts; // 최신이 맨 위
  var cats = D.cats;
  var doc = document.documentElement;
  var GITHUB = "https://github.com/Seok05";

  var isIndex = !!document.getElementById("listing");
  var root = isIndex ? "./" : "../";

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
  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }
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
  function metaRow(p, withCat) {
    var c = catOf(p.cat);
    return (
      '<div class="meta-row">' +
      (withCat ? '<span class="tag">' + esc(c ? c.name : p.cat) + "</span>" : "") +
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

  /* ── 헤더: 메뉴 통일 + 테마 토글 + 스크롤 밑줄 ─────────── */
  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".site-nav");
  if (nav) {
    nav.innerHTML =
      '<a href="' + root + '?view=all" data-nav="all">글</a>' +
      '<a href="' + root + '#series" data-nav="series">시리즈</a>' +
      '<a href="' + GITHUB + '">GitHub</a>';
    var onNav = view === "all" ? "all" : null;
    if (onNav) {
      var a = nav.querySelector('[data-nav="' + onNav + '"]');
      if (a) a.classList.add("on");
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "밝은 화면과 어두운 화면 전환");
    btn.innerHTML =
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    btn.addEventListener("click", function () {
      var fixed = doc.getAttribute("data-theme");
      var dark = fixed ? fixed === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = dark ? "light" : "dark";
      doc.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    });
    nav.appendChild(btn);
  }
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── 홈 ────────────────────────────────────────────────── */
  if (isIndex) {
    var hero = document.getElementById("hero");
    var featuredEl = document.getElementById("featured");
    var seriesEl = document.getElementById("series");
    var recentEl = document.getElementById("recent");
    var listingEl = document.getElementById("listing");
    var homeOnly = [hero, featuredEl, seriesEl, recentEl];

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
                '<a class="post-card" href="' + href(p) + '">' +
                metaRow(p, true) +
                "<h3>" + esc(p.title) + "</h3>" +
                "<p>" + esc(p.blurb) + "</p></a>"
              );
            })
            .join("") +
          "</div>";
      }
      if (listingEl) listingEl.hidden = true;
    } else {
      // 목록 보기: 홈 구획은 숨기고 listing만
      homeOnly.forEach(function (el) {
        if (el) el.hidden = true;
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
                '<section class="month"><h2>' + monthLabel(g.key) + "</h2><ul>" +
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
        if (series.length) {
          html +=
            '<h2 class="sub">읽는 순서</h2><ol class="series-list">' +
            series
              .map(function (p) {
                return (
                  '<li><a href="' + href(p) + '"><span class="num">' + pad2(p.order || 0) + "</span>" +
                  '<span class="body"><span class="t">' + esc(bareTitle(p.title)) + "</span>" +
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
                  '<a class="post-card" href="' + href(p) + '">' + metaRow(p, false) +
                  "<h3>" + esc(p.title) + "</h3><p>" + esc(p.blurb) + "</p></a>"
                );
              })
              .join("") +
            "</div>";
        }
      }
      if (listingEl) {
        listingEl.innerHTML = html;
        listingEl.hidden = false;
      }
    }
  }

  /* ── 글 페이지 ─────────────────────────────────────────── */
  var article = !isIndex ? document.querySelector("article") : null;
  if (article) {
    var layout = article.parentNode;
    var sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.hidden = true; // 예비 사이드바는 접는다

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

    // 읽는 시간: 한국어 본문 기준 분당 500자
    var meta = article.querySelector(".post-head .meta-row");
    if (meta) {
      var text = "";
      var kids = article.children;
      for (var k = 0; k < kids.length; k++) {
        var el = kids[k];
        if (/(^|\s)(post-head|author-card|post-nav|series-strip|series-box)(\s|$)/.test(el.className)) continue;
        text += el.textContent || "";
      }
      var chars = text.replace(/\s+/g, "").length;
      var mins = Math.max(1, Math.round(chars / 500));
      var span = document.createElement("span");
      span.textContent = mins + "분 읽기";
      meta.appendChild(span);
    }

    // 오른쪽 목차 (넓은 화면에서만 CSS로 보인다)
    var heads = Array.prototype.slice.call(article.querySelectorAll("h2"));
    if (heads.length >= 2 && layout) {
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
      });
      var rail = document.createElement("aside");
      rail.className = "rail";
      rail.innerHTML =
        '<nav class="toc" aria-label="이 글의 소제목"><p class="side-title">이 글에서</p><ul>' +
        heads
          .map(function (h) {
            return '<li><a href="#' + h.id + '">' + esc(h.textContent.trim()) + "</a></li>";
          })
          .join("") +
        "</ul></nav>";
      layout.appendChild(rail);
      var links = rail.querySelectorAll("a");
      var pick = function () {
        var y = window.scrollY + 120;
        var last = heads[0];
        for (var r = 0; r < heads.length; r++) if (heads[r].offsetTop <= y) last = heads[r];
        for (var q = 0; q < links.length; q++)
          links[q].classList.toggle("on", links[q].getAttribute("href") === "#" + last.id);
      };
      pick();
      window.addEventListener("scroll", pick, { passive: true });
    }

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
        var box = document.createElement("section");
        box.className = "series-box";
        box.innerHTML =
          '<p class="side-title">' + esc(cc ? cc.name : current.cat) + " · 전체 " + chain.length + "편</p><ol>" +
          chain
            .map(function (p) {
              var on = p.slug === current.slug;
              return (
                "<li" + (on ? ' class="on"' : "") + '><span class="num">' + pad2(p.order || 0) + "</span>" +
                (on ? '<span class="t">' + esc(bareTitle(p.title)) + " <em>지금 읽는 글</em></span>" : '<a href="' + p.slug + '.html">' + esc(bareTitle(p.title)) + "</a>") +
                "</li>"
              );
            })
            .join("") +
          "</ol>";
        if (anchor) anchor.parentNode.insertBefore(box, anchor);
        else article.appendChild(box);
      }
    }
  }
})();
