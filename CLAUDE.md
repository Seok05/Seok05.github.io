# Seok Lab 블로그 (seok05.github.io)

빌드 도구 없는 순수 정적 HTML 블로그. GitHub Pages, `.nojekyll`.

## 구조

- `assets/posts.js` — **단일 데이터 원장.** 카테고리 정의(`mark`·`hue`·`featured`·`art` 포함) +
  글 메타데이터(최신 글이 배열 맨 위).
- `assets/covers/` — 카테고리 표지 그림. 첫잔은 앱 아이콘(`cheotjan/assets/images/icon.png` 256px)
  + 홈 화면 캡처(`docs/09-제품소개서/첫잔-제품소개서-v1.4.html`에 박힌 `shot:home`을 뽑아 720px webp).
  화면이 크게 바뀌면 캡처를 다시 뽑는다. EValue는 앱 아이콘(`EValue/docs/brand/evalue-appicon.svg`) +
  랜딩 캡처(`npm --prefix ~/Desktop/EValue run dev -- --port 3011` 띄운 뒤 헤드리스 크롬으로
  1440×900@2x 찍고 위 1560px만 잘라 1200px webp; 왼쪽 아래 Next 개발 표시가 안 들어가게 자른다).
  배터리는 `scripts/render-battery.py`(원통 셀 셋), Paper는 `scripts/render-paper.py`(논문 두 장)로 그린 webp.
  DFT는 첫 계산 구조였던 O3형 NaMnO₂를 `scripts/render-namno2.py`(numpy+matplotlib, VESTA 기본색)로
  그린 `dft-namno2.webp`. VESTA에서 직접 내보낸 PNG가 생기면 같은 이름으로 바꿔 끼우면 된다.
  site.js의 `ART`(인라인 SVG 배터리·격자·문서)는 그림 파일이 없을 때의 예비다.
- `assets/thumbs/<slug>.webp`(640×400, 16:10 카드 썸네일)와 `assets/shots/*.webp`(480px 폭, 글 안의 실제 화면).
  DFT·Paper 글의 썸네일은 `scripts/render-illustrations.py`가 글 내용을 그림으로 그린 것(밀도 지형, 단위 격자,
  스핀 화살표, 평면파 컷오프, k점 격자, 국재화, d 오비탈, 늘어난 팔면체, Na가 빠지는 층, 녹스는 금속 구).
  새 DFT 글이 생기면 함수 하나를 더해 그린다. EValue·배터리 글은 EValue 개발 서버(3011)의 매물 상세·리포트·
  결과 화면을 헤드리스 크롬으로 찍어 글마다 다른 구간을 잘랐다(시세 밴드·같은 조건 매물·추세 차트·결과 머리·
  배터리 추정 상태). 본문에는 `<figure class="shot web">`(브라우저 창 프레임)로 넣는다. 노트북 서버 글만 삽화.
  첫잔 글은 제품소개서 v1.4에 박힌 캡처와 헤드리스 크롬으로 찍은 `/settings`·`/first-steps`에서 뽑았다.
  글 안에서는 `<figure class="shot">`(폰 프레임) 또는 `<figure class="shot wide">`(카드)로 넣는다.
  캡처 시점이 글 날짜보다 뒤면 캡션에 "(9월 22일 기준 화면)"처럼 적는다.
- `assets/site.js` — posts.js를 읽어 페이지를 조립한다.
  - 홈: 소개(정적) → 지금 쓰는 시리즈(`featured` 카테고리) → 시리즈 카드 → 최근 글 6편.
    `?view=all`은 전체 글을 달별로, `?cat=<key>`는 카테고리 하나(시리즈면 읽는 순서로 번호).
    제목 접두어가 `표지이름 갈래 [n]`(예: `DFT 이론 [2]`, `DFT 실습 [5]`)이면 갈래로 읽어서
    카테고리 목록·글 아래 시리즈 상자에 `이론 2`·`실습 5` 표시를 달고, 카테고리 목록에 갈래 탭을 띄운다
    (`&track=이론`). 따로 적을 필드는 없다. 제목 규칙만 지키면 된다.
  - 글 페이지: 사이드바를 숨기고 한 단으로. 시리즈 띠(몇 편 중 몇 편), 읽는 시간(분당 500자),
    1180px 이상에서 오른쪽 목차(`article h2`), 이전/다음/관련, 같은 시리즈 목록.
  - 모든 페이지: 헤더 메뉴(글·시리즈·GitHub) 통일, 라이트/다크 토글(`localStorage.theme`).
- 모든 페이지 `<head>`의 `<meta charset>` 바로 아래에 테마를 먼저 적용하는 한 줄 스크립트가 있다
  (첫 그림에서 색이 튀지 않게). 템플릿에 들어 있으니 새 글은 신경 쓸 것 없다.
- `index.html` — 소개 문구만 정적이고 나머지 구획은 빈 컨테이너. JS가 채운다.
- `posts/*.html` — 글 본문. 안에 하드코딩된 사이드바·post-nav는 JS 꺼진 환경용 예비이며
  site.js가 숨기거나 덮어쓴다(고치지 않아도 됨).
- `posts/_template.html` — 새 글 템플릿.
- `assets/blog.css` — 스타일 전부. 색 규칙: 관측=그래파이트, 판단·강조=인디고(--accent),
  경고=--warm. 라이트/다크는 CSS 변수로 자동 전환.

## 새 글 올리기 (전부 여기서 끝)

1. `posts/_template.html`을 `posts/<slug>.html`로 복사해 본문 작성.
2. `assets/posts.js`의 `posts` 배열에 항목 추가 — **날짜 순으로 최신이 맨 위**
   (slug/cat/date/title/blurb, 시리즈 글이면 series+order, 관련 글은 related).
3. 새 카테고리면 `cats` 배열에도 추가.
4. 커밋·푸시. 카운트·목록·필터·내비게이션은 자동.

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
- 글이 참조하는 이미지가 `assets/`에 함께 왔는지 확인.
- 본문의 줄표(—) 부연 패턴은 마침표·쉼표·괄호로 풀 것 (제목·코드·도해 라벨은 예외).
- 본문은 존댓말 서사 톤 (Paper 카테고리는 평서체 허용).

## 로컬 미리보기

`.claude/launch.json`의 "blog" 설정이 `scripts/serve.py 8940`을 띄운다(캐시 금지 헤더를 붙인 정적 서버라 고친 CSS·JS가 새로고침만으로 보인다). `.claude/`는 커밋하지 않는다.
