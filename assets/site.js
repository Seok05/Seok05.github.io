/* ─────────────────────────────────────────────────────────────
   assets/posts.js 의 데이터로 페이지를 조립한다.
   - 홈(index): 글 목록 + ?cat= 필터 + 제목/카운트/설명
   - 모든 페이지: 사이드바 카테고리 목록과 카운트
   - 글 페이지: 하단 이전/다음/관련 내비게이션 (series/order/related)
   글 HTML 안에 하드코딩된 사이드바·post-nav는 JS가 꺼진 환경을
   위한 예비이며, 이 스크립트가 데이터 기준으로 덮어쓴다.
   ───────────────────────────────────────────────────────────── */
(function () {
  var D = window.SEOK;
  if (!D) return;
  var posts = D.posts;
  var cats = D.cats;

  var listEl = document.getElementById("posts");
  var isIndex = !!listEl;
  var root = isIndex ? "./" : "../"; // 홈으로 가는 상대 경로

  function catOf(key) {
    for (var i = 0; i < cats.length; i++) if (cats[i].key === key) return cats[i];
    return null;
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
          "    <h2>" + p.title + "</h2>\n" +
          "    <p>" + p.blurb + "</p>\n" +
          '    <div class="meta-row"><span class="tag">' + (c ? c.name : p.cat) +
          "</span><span>" + p.date + "</span></div>\n" +
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
      if (idx > 0) items.push(["이전", chain[idx - 1]]);
      if (idx >= 0 && idx < chain.length - 1) items.push(["다음", chain[idx + 1]]);
    }
    (current.related || []).forEach(function (sl) {
      for (var j = 0; j < posts.length; j++)
        if (posts[j].slug === sl) items.push(["관련", posts[j]]);
    });

    if (items.length) {
      var nav = document.querySelector(".post-nav");
      if (!nav) {
        nav = document.createElement("nav");
        nav.className = "post-nav";
        var anchor = document.querySelector(".author-card");
        if (anchor) anchor.parentNode.insertBefore(nav, anchor);
        else document.querySelector("article").appendChild(nav);
      }
      nav.innerHTML = items
        .map(function (it) {
          return (
            '<a href="' + it[1].slug + '.html"><span>' + it[0] + "</span>" + it[1].title + "</a>"
          );
        })
        .join("\n");
    }
  }
})();
