# Seok Lab 블로그 (seok05.github.io)

빌드 도구 없는 순수 정적 HTML 블로그. GitHub Pages, `.nojekyll`.

## 구조

- `DESIGN.md` — **디자인 명세.** 글자·색·간격·폭·부품의 숫자는 전부 여기서 나온다(잘 만든 개발 블로그
  7곳을 실측한 표 포함). `assets/blog.css` 맨 위 토큰이 이 문서와 1:1이다. 화면을 고치면 이 문서의 검수 순서(§6)대로 보고, 바뀐 것은 §7 기록에 적는다.
- `PLAN.md` — 진행 중인 2차 고도화 기획(공유 카드·다크 그림·긴 글 목차·속도·대비, 2026-09-30).
  끝나면 확정 규칙을 DESIGN.md에 옮기고 지운다.
- `assets/posts.js` — **단일 데이터 원장.** 카테고리 정의(`mark`·`hue`·`art` 포함, `featured`는 지금 화면에서
  쓰지 않는다) + 글 메타데이터(최신 글이 배열 맨 위).
- `assets/covers/` — 카테고리 표지 그림(분류 페이지가 없어진 뒤로는 자기 썸네일이 없는 글의 대체 썸네일로만 쓴다). 첫잔은 앱 아이콘(`cheotjan/assets/images/icon.png` 256px)
  + 홈 화면 캡처(`docs/09-제품소개서/첫잔-제품소개서-v1.4.html`에 박힌 `shot:home`을 뽑아 720px webp).
  화면이 크게 바뀌면 캡처를 다시 뽑는다. EValue는 앱 아이콘(`EValue/docs/brand/evalue-appicon.svg`) +
  랜딩 캡처(`npm --prefix ~/Desktop/EValue run dev -- --port 3011` 띄운 뒤 헤드리스 크롬으로
  1440×900@2x 찍고 위 1560px만 잘라 1200px webp; 왼쪽 아래 Next 개발 표시가 안 들어가게 자른다).
  배터리는 `scripts/render-battery.py`(원통 셀 셋), Paper는 `scripts/render-paper.py`(논문 두 장)로 그린 webp.
  DFT는 첫 계산 구조였던 O3형 NaMnO₂를 `scripts/render-namno2.py`(numpy+matplotlib, VESTA 기본색)로
  그린 `dft-namno2.webp`. VESTA에서 직접 내보낸 PNG가 생기면 같은 이름으로 바꿔 끼우면 된다.
  site.js의 `ART`(인라인 SVG 배터리·격자·문서)는 그림 파일이 없을 때의 예비다.
- `assets/thumbs/<slug>.webp`(640×400, 16:10 카드 썸네일, 라이트)와 `assets/thumbs/dark/<slug>.webp`(다크 벌),
  `assets/shots/*.webp`(글 안의 실제 화면 캡처: 폰 480px · 브라우저 1200px · 카드 960px 폭). 썸네일 33장은 한 배경 토큰
  (`--thumb-bg` 라이트 #eaeef3 · 다크 #1a1f27) 위에 스크립트로 만든다(DESIGN.md §3, PLAN.md 4.5). 손으로 고치지 않는다.
  - 직접 그린 그림(DFT·Paper·노트북 서버 16장): `python3 scripts/render-illustrations.py assets/thumbs assets/illus`가
    두 벌을 낸다(`--theme=light|dark`로 한 벌만, 함수 이름을 뒤에 주면 그 그림만). 새 DFT 글이 생기면 함수 하나를 더해
    ALL 목록에 넣는다. 글 안 그림(`assets/illus`, 1280×800)은 라이트만.
  - 화면 캡처(첫잔 11 · EValue 5 · 배터리 1): `python3 scripts/render-thumbs.py assets/shots assets/thumbs`가
    `assets/shots`의 캡처를 폰(가운데 46%)·브라우저(오른쪽 아래 80%)·카드(가운데 80%) 프레임에 넣어 두 벌을 낸다.
    새 글은 스크립트의 SHOTS 표에 한 줄(종류·캡처 파일·시작 높이) 추가. EValue 캡처는 개발 서버(3011)를 헤드리스
    크롬으로 1200px 폭으로 찍고, 첫잔은 제품소개서 v1.4의 캡처와 `/settings`·`/first-steps` 캡처(480px 폭)를 쓴다.
  - 검사: `python3 scripts/check-thumbs.py`(크기·두 벌·(8,8) 배경 픽셀, 어긋나면 종료 코드 1),
    `python3 scripts/contact-sheet.py assets/thumbs /tmp/sheet`(6열 콘택트 시트 라이트·다크 한 장씩).
  - site.js는 지금 테마의 벌을 넣고 토글·OS 설정 변화에 바꿔 끼운다. 다크 파일이 없으면 라이트로 되돌아간다.
  - 본문 그림은 `<figure class="shot">`(폰 프레임) · `<figure class="shot wide">`(카드) · `<figure class="shot web">`
    (브라우저 창)로 넣는다. 캡처 시점이 글 날짜보다 뒤면 캡션에 "(9월 22일 기준 화면)"처럼 적는다.
- `assets/site.js` — posts.js를 읽어 페이지를 조립한다.
  - 홈: 왼쪽 소개 카드(index.html에 정적: 그림·이름·한 줄·소개·GitHub/ORCID/RSS, 스크롤에 고정)
    + 오른쪽 분류 탭(전체·카테고리별, 글 수) → 글 목록(전체, 최신순). 홈이 곧 전체 글 목록이다.
    1000px 미만에서는 카드가 목록 위로 올라가 가로형이 된다. 이름·소개 문구는 posts.js `site.author` 한 곳에서
    읽는다(홈 카드와 글 끝 작가 카드가 같이 쓴다). 카드 아래 "처음이라면"은 글이 2편 이상인 갈래의 1편을 자동으로 뽑는다.
    목록은 처음 12편만 보이고 "더 보기"로 펼친다. 분류에 `note`가 있으면(EValue·배터리) 그 분류 글의 바닥글에만 붙는다.
    **탭은 목록의 줄을 숨기고 보일 뿐, 틀은 절대 바꾸지 않는다**(사용자 결정 2026-09-30, DESIGN.md 원칙 6):
    소개·탭 자리·줄 모양·정렬이 어느 탭에서나 같고, 페이지를 다시 불러오지 않고 주소만 `?cat=<key>`로 바꾼다.
    따로 된 "전체 글"(달별) 화면과 분류 페이지(표지·설명·읽는 순서·갈래 탭)는 이 결정으로 없앴다.
    예전 주소 `?view=all`·`&track=`은 같은 홈 화면의 깨끗한 주소로 정리된다.
    제목 접두어가 `표지이름 갈래 [n]`(예: `DFT 이론 [2]`, `DFT 실습 [5]`)이면 갈래로 읽어서
    글 아래 시리즈 상자에 `이론 2`·`실습 5` 표시를 단다. 따로 적을 필드는 없다. 제목 규칙만 지키면 된다.
  - 글 페이지: 사이드바를 숨기고 한 단으로. 시리즈 띠(몇 편 중 몇 편), 읽는 시간(분당 500자),
    읽기 진행바, 1180px 이상에서 오른쪽 목차(`article h2`), 소제목 앵커(#), 코드 복사 단추,
    그림 라이트박스(figure img 클릭), 링크 복사, 조회수, 이전/다음/관련, 같은 시리즈 목록,
    ←/→ 키로 앞뒤 편 이동, JSON-LD·canonical 주입.
  - α-NaMnO₂처럼 그리스 문자+붙임표로 시작하는 화학식은 `.nobr`로 묶어 붙임표에서 줄이 갈리지 않게 한다(자동).
  - 모든 페이지: 헤더 메뉴(GitHub만, 홈은 로고) + 검색 단추 통일, ⌘K/Ctrl+K/"/"로 여는 검색
    팔레트(제목·요약·카테고리, 붙임표 무시 매칭 + 명령: 무작위 글·테마 전환 등), 푸터 통일,
    위로 가기 단추, 라이트/다크 토글(`localStorage.theme`), GoatCounter 방문 수집(아래 참고).
  - 404.html은 어느 경로에서든 열리므로 `body[data-root="/"]`로 뿌리를 못박는다.
- 모든 페이지 `<head>`의 `<meta charset>` 바로 아래에 테마를 먼저 적용하는 한 줄 스크립트가 있다
  (첫 그림에서 색이 튀지 않게). 템플릿에 들어 있으니 새 글은 신경 쓸 것 없다.
- `index.html` — 소개 카드(`aside.profile`)만 정적이고 글 목록(`#home`)은 빈 컨테이너. JS가 채운다.
  예전 히어로 그림 `assets/hero-namno2.webp`(`scripts/render-hero.py`)는 지금 화면에서 쓰지 않는다.
- `posts/*.html` — 글 본문. 안에 하드코딩된 사이드바·post-nav는 JS 꺼진 환경용 예비이며
  site.js가 숨기거나 덮어쓴다(고치지 않아도 됨).
- `posts/_template.html` — 새 글 템플릿.
- `assets/blog.css` — 스타일 전부(2026-09-30 전면 재작성). 글꼴은 Pretendard 하나(CDN @import, 코드만 모노),
  숫자는 `tabular-nums`. 흰 바탕 + 푸른 기 도는 회색 + 파랑 강조(`--accent` #2f6fed) 하나, 그림자·기울기·질감 없음.
  색 규칙: 관측=회색(`--graphite`), 판단·강조=파랑(`--accent`), 경고=`--warm`. 라이트/다크는 CSS 변수로 전환,
  인쇄 스타일 포함. 글 속 인라인 SVG가 쓰는 예전 변수 이름(`--ink`·`--muted`·`--paper`·`--rule` 등)은
  새 토큰의 별칭으로 남겨 두었으니 새 도해에도 그대로 써도 된다.
- `feed.xml`·`sitemap.xml`·`robots.txt` — `node scripts/build-meta.mjs`가 posts.js에서 생성.
  같은 스크립트가 HTML 36장의 `assets/blog.css?v=…`·`site.js?v=…`·`posts.js?v=…` 해시도 찍는다(멱등).
  글을 올리거나 제목을 고치거나 CSS·JS를 고치면 다시 돌린다.
- **로고마크**: 층상 산화물 사이를 떠나는 Na 이온(실습 [6]의 2.40 V 이야기). 세 벌이 있다 —
  site.js의 `MARK`(헤더·푸터용, CSS 변수로 테마 대응), `assets/favicon.svg`(파랑 #2f6fed 타일, JS가
  주입), `assets/favicon.png`(256px 폴백, favicon.svg를 헤드리스 크롬으로 투명 배경 캡처해서 만든다).
  사용자 생성 일러스트(책상 위 연구 노트, 2026-09-30)가 `assets/note-desk.webp`(원본 1254px)에
  있고, 여기서 `assets/og.jpg`(1200×630 공유 이미지), `assets/profile.png`(글 끝 작가 카드용, 이온이
  빠져나가는 부분 512px 원형 크롭), `assets/profile-card.webp`(홈 소개 카드용, 같은 부분을 원본 (40,500)-(640,875)에서
  16:10으로 잘라 480×300)를 만들었다. 그림을 바꾸면 네 파일을 같은 요령으로 다시 만든다.

## 새 글 올리기 (전부 여기서 끝)

1. `posts/_template.html`을 `posts/<slug>.html`로 복사해 본문 작성.
2. `assets/posts.js`의 `posts` 배열에 항목 추가 — **날짜 순으로 최신이 맨 위**
   (slug/cat/date/title/blurb, 시리즈 글이면 series+order, 관련 글은 related).
   **`figure`(그날의 숫자)도 넣는다**: 그 글 본문에 있는 값 하나, 단위 포함 12자 이내(예 `2.40 V`, `103 → 52MB`).
   요약이 아니라 "그날 무엇이 나왔나"다. 애매하면 비운다.
   `thumb`은 `assets/thumbs/<slug>.webp`로 적고, 그림은 위 썸네일 절차대로 스크립트로 두 벌(라이트·다크)을 만든다.
3. 새 카테고리면 `cats` 배열에도 추가.
4. `node scripts/build-meta.mjs` 로 feed.xml·sitemap.xml 갱신 + 모든 HTML의 CSS·JS 링크에 내용 해시(`?v=`) 찍기.
   **blog.css·site.js·posts.js를 고친 뒤에도 꼭 실행한다.** GitHub Pages가 10분 캐시하므로 해시가 안 바뀌면 재방문자에게 옛 CSS가 붙는다.
5. 커밋·푸시. 카운트·목록·필터·내비게이션·검색·잔디 달력은 자동.

## 방문 통계 (GoatCounter)

- `posts.js`의 `site.goatcounter`(현재 `"seok05"`)가 계정 코드다. **goatcounter.com에서 이 코드로
  가입하는 순간 수집이 시작된다** (무료·오픈소스·개인정보 친화, 스크립트는 site.js가 주입).
  다른 코드로 가입했다면 posts.js의 값만 바꾸면 된다. 빈 문자열이면 완전히 꺼진다.
- 글 머리 메타와 푸터의 "조회 N"은 GoatCounter 공개 API에서 읽어 오며, 집계가 없거나 계정이
  없으면 조용히 숨는다. localhost에서는 수집·조회 모두 하지 않는다.

## 블로그 성격 (사용자 결정 2026-09-30)

- **연구와 개발을 같이 한다**는 뉘앙스. 태그라인은 `연구하면서, 개발합니다`(홈 제목·`<title>`·푸터·글 머리),
  작성자 카드는 `연구하면서 개발합니다.`로 시작한다. 템플릿에 반영돼 있다.

## 제목·날짜 규칙 (사용자 결정 2026-09-27)

- **시리즈 글의 제목은 `시리즈명 [n] — 제목`.** 예: `DFT 실습 [1] — …`, `첫잔 [2] — …`.
  `<title>`, `<h1>`, `posts.js`의 `title` 세 곳 모두 같은 형식. n은 `order`와 같다.
- **개발 일지(첫잔 등)의 `date`는 글을 쓴 날이 아니라 그 일이 있었던 날.** 그래서 본문도
  그날 시점으로만 쓴다(뒤에 일어난 일을 미리 알지 못한다). 커밋 날짜는 실제 날짜로 둔다.
- 첫잔 일지 목록·시점 규칙·다음 글감은 사용자와의 대화에서 정한다. 카테고리 key `cheotjan`, series `cheotjan`.

## 글 검수 체크리스트 (외부에서 만들어 온 HTML을 반영할 때)

- **덮어쓰기 전에 저장소 버전과 diff.** 외부 생성 파일은 옛 스냅샷 기반이라 이쪽에서 확장한
  내용을 되돌릴 수 있다. 의도된 변경만 골라 얹는다.
- 서버 IP·포트·계정명 마스킹 확인 (`<서버주소>` 식).
- 도해 SVG에 하드코딩 색 금지, CSS 변수만 (다크모드 대응).
- 글 안에 새 크기·여백·색을 인라인 스타일로 만들지 말 것. 필요한 부품은 DESIGN.md에 먼저 적고 blog.css에 넣는다.
- 글이 참조하는 이미지가 `assets/`에 함께 왔는지 확인.
- 본문의 줄표(—) 부연 패턴은 마침표·쉼표·괄호로 풀 것 (제목·코드·도해 라벨은 예외).
- 본문은 존댓말 서사 톤 (Paper 카테고리는 평서체 허용).

## 로컬 미리보기

`.claude/launch.json`의 "blog" 설정이 `scripts/serve.py 8940`을 띄운다(캐시 금지 헤더를 붙인 정적 서버라 고친 CSS·JS가 새로고침만으로 보인다). `.claude/`는 커밋하지 않는다.
