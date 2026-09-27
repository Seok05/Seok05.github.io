/* ─────────────────────────────────────────────────────────────
   assets/posts.js 의 데이터로 페이지를 조립한다.
   - 홈(index): 글 목록 + ?cat= 필터 + 제목/카운트/설명
   - 모든 페이지: 사이드바 카테고리 목록과 카운트, 헤더의 테마 토글
   - 글 페이지: 읽는 시간, 소제목 목차(사이드바), 하단 이전/다음/관련
   글 HTML 안에 하드코딩된 사이드바·post-nav는 JS가 꺼진 환경을
   위한 예비이며, 이 스크립트가 데이터 기준으로 덮어쓴다.
   ───────────────────────────────────────────────────────────── */
(function () {
  var D = window.SEOK;
  if (!D) return;
  var posts = D.posts;
  var cats = D.cats;
  var doc = document.documentElement;

  var listEl = document.getElementById("posts");
  var isIndex = !!listEl;
  var root = isIndex ? "./" : "../"; // 홈으로 가는 상대 경로

  function catOf(key) {
    for (var i = 0; i < cats.length; i++) if (cats[i].key === key) return cats[i];
    return null;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isoDate(d) {
    // "2026.08.27" → "2026-08-27"
    return d.replace(/\./g, "-");
  }

  var counts = { all: posts.length };
  posts.forEach(function (p) {
    counts[p.cat] = (counts[p.cat] || 0) + 1;
  });

  // 지금 보고 있는 글 (글 페이지일 때)
  var current = null;
  if (!isIndex) {
    var m = location.pathname.match(/([^\/]+)\.html$/);
    var slug = m ? decodeURIComponent(m[1]) : null;
    for (var i = 0; i < posts.length; i++) if (posts[i].slug === slug) current = posts[i];
  }

  // 활성 카테고리
  var activeCat;
  if (isIndex) {
    activeCat = new URLSearchParams(location.search).get("cat") || "all";
    if (activeCat !== "all" && !catOf(activeCat)) activeCat = "all";
  } else {
    activeCat = current ? current.cat : null;
  }

  /* ── 헤더: 테마 토글 + 스크롤 시 밑줄 ──────────────────── */
  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".site-nav");
  if (nav) {
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
      var dark;
      var fixed = doc.getAttribute("data-theme");
      if (fixed) dark = fixed === "dark";
      else dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  /* ── 사이드바 카테고리 박스 ─────────────────────────────── */
  var box = document.querySelector(".cat-box ul");
  if (box) {
    var rows = [
      '<li><a href="' + root + '"' + (activeCat === "all" && isIndex ? ' class="on"' : "") +
        ' data-cat="all">전체보기 <span class="n">' + counts.all + "</span></a></li>",
    ];
    cats.forEach(function (c) {
      rows.push(
        '<li><a href="' + root + "?cat=" + c.key + '"' + (activeCat === c.key ? ' class="on"' : "") +
          ' data-cat="' + c.key + '">' + c.name + ' <span class="n">' + (counts[c.key] || 0) + "</span></a></li>"
      );
    });
    box.innerHTML = rows.join("\n");
  }

  /* ── 홈: 글 목록 + 필터 ────────────────────────────────── */
  if (isIndex) {
    var shown = posts.filter(function (p) {
      return activeCat === "all" || p.cat === activeCat;
    });
    listEl.innerHTML = shown
      .map(function (p) {
        var c = catOf(p.cat);
        return (
          '<li data-cat="' + p.cat + '">\n' +
          '  <a href="posts/' + p.slug + '.html">\n' +
          '    <div class="meta-row"><span class="tag">' + esc(c ? c.name : p.cat) +
          '</span><span><time datetime="' + isoDate(p.date) + '">' + p.date + "</time></span></div>\n" +
          "    <h2>" + esc(p.title) + "</h2>\n" +
          "    <p>" + esc(p.blurb) + "</p>\n" +
          "  </a>\n</li>"
        );
      })
      .join("\n");

    var cat = activeCat === "all" ? { name: "전체 글", desc: "" } : catOf(activeCat);
    var titleEl = document.getElementById("list-title");
    var countEl = document.getElementById("list-count");
    var descEl = document.getElementById("list-desc");
    if (titleEl) titleEl.textContent = cat.name;
    if (countEl) countEl.textContent = shown.length + "개의 글";
    if (descEl && cat.desc) {
      descEl.textContent = cat.desc;
      descEl.hidden = false;
    }
  }

  /* ── 글 페이지 ─────────────────────────────────────────── */
  var article = !isIndex ? document.querySelector("article") : null;
  if (article) {
    // 읽는 시간: 한국어 본문 기준 분당 500자
    var meta = article.querySelector(".post-head .meta-row");
    if (meta) {
      var text = "";
      var kids = article.children;
      for (var k = 0; k < kids.length; k++) {
        var el = kids[k];
        if (el.classList.contains("post-head") || el.classList.contains("author-card") || el.classList.contains("post-nav")) continue;
        text += el.textContent || "";
      }
      var chars = text.replace(/\s+/g, "").length;
      var mins = Math.max(1, Math.round(chars / 500));
      var span = document.createElement("span");
      span.textContent = mins + "분 읽기";
      meta.appendChild(span);
    }

    // 소제목 목차: 사이드바에 넣고, 화면에 보이는 절을 따라 표시
    var heads = Array.prototype.slice.call(article.querySelectorAll("h2"));
    var sidebar = document.querySelector(".sidebar");
    if (heads.length >= 2 && sidebar) {
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
      var toc = document.createElement("nav");
      toc.className = "toc";
      toc.setAttribute("aria-label", "이 글의 소제목");
      toc.innerHTML =
        '<p class="side-title">이 글에서</p><ul>' +
        heads
          .map(function (h) {
            return '<li><a href="#' + h.id + '">' + esc(h.textContent.trim()) + "</a></li>";
          })
          .join("") +
        "</ul>";
      sidebar.appendChild(toc);

      var links = toc.querySelectorAll("a");
      var setOn = function (id) {
        for (var q = 0; q < links.length; q++)
          links[q].classList.toggle("on", links[q].getAttribute("href") === "#" + id);
      };
      var pick = function () {
        // 헤더 아래를 지난 마지막 소제목이 현재 절
        var y = window.scrollY + 110;
        var last = heads[0];
        for (var r = 0; r < heads.length; r++) if (heads[r].offsetTop <= y) last = heads[r];
        setOn(last.id);
      };
      pick();
      window.addEventListener("scroll", pick, { passive: true });
    }
  }

  /* ── 글 페이지: 이전/다음/관련 내비게이션 ─────────────── */
  if (current) {
    var items = [];
    if (current.series) {
      var chain = posts
        .filter(function (p) {
          return p.series === current.series;
        })
        .sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        });
      var idx = -1;
      chain.forEach(function (p, k) {
        if (p.slug === current.slug) idx = k;
      });
      if (idx > 0) items.push(["prev", "이전", chain[idx - 1]]);
      if (idx >= 0 && idx < chain.length - 1) items.push(["next", "다음", chain[idx + 1]]);
    }
    (current.related || []).forEach(function (sl) {
      for (var j = 0; j < posts.length; j++)
        if (posts[j].slug === sl) items.push(["rel", "관련", posts[j]]);
    });

    if (items.length) {
      var pnav = document.querySelector(".post-nav");
      if (!pnav) {
        pnav = document.createElement("nav");
        pnav.className = "post-nav";
        var anchor = document.querySelector(".author-card");
        if (anchor) anchor.parentNode.insertBefore(pnav, anchor);
        else document.querySelector("article").appendChild(pnav);
      }
      pnav.setAttribute("aria-label", "이어지는 글");
      pnav.innerHTML = items
        .map(function (it) {
          return (
            '<a class="' + it[0] + '" href="' + it[2].slug + '.html"><span>' + it[1] + "</span>" + esc(it[2].title) + "</a>"
          );
        })
        .join("\n");
    }
  }
})();
