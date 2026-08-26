# Seok Lab 블로그 (seok05.github.io)

빌드 도구 없는 순수 정적 HTML 블로그. GitHub Pages, `.nojekyll`.

## 구조

- `assets/posts.js` — **단일 데이터 원장.** 카테고리 정의 + 글 메타데이터(최신 글이 배열 맨 위).
- `assets/site.js` — posts.js를 읽어 렌더링: 홈의 글 목록·필터·카운트, 모든 페이지의 사이드바
  카테고리, 글 하단의 이전/다음/관련 내비게이션(`series`/`order`/`related` 필드).
- `index.html` — 목록 컨테이너만 있는 껍데기. 글 목록은 JS가 채운다.
- `posts/*.html` — 글 본문. 안에 하드코딩된 사이드바·post-nav는 JS 꺼진 환경용 예비이며
  site.js가 덮어쓴다(고치지 않아도 됨).
- `posts/_template.html` — 새 글 템플릿.
- `assets/blog.css` — 스타일 전부. 색 규칙: 관측=그래파이트, 판단·강조=인디고(--accent),
  경고=--warm. 라이트/다크는 CSS 변수로 자동 전환.

## 새 글 올리기 (전부 여기서 끝)

1. `posts/_template.html`을 `posts/<slug>.html`로 복사해 본문 작성.
2. `assets/posts.js`의 `posts` 배열 **맨 위에** 항목 추가
   (slug/cat/date/title/blurb, 시리즈 글이면 series+order, 관련 글은 related).
3. 새 카테고리면 `cats` 배열에도 추가.
4. 커밋·푸시. 카운트·목록·필터·내비게이션은 자동.

## 글 검수 체크리스트 (외부에서 만들어 온 HTML을 반영할 때)

- **덮어쓰기 전에 저장소 버전과 diff.** 외부 생성 파일은 옛 스냅샷 기반이라 이쪽에서 확장한
  내용을 되돌릴 수 있다. 의도된 변경만 골라 얹는다.
- 서버 IP·포트·계정명 마스킹 확인 (`<서버주소>` 식).
- 도해 SVG에 하드코딩 색 금지, CSS 변수만 (다크모드 대응).
- 글이 참조하는 이미지가 `assets/`에 함께 왔는지 확인.
- 본문의 줄표(—) 부연 패턴은 마침표·쉼표·괄호로 풀 것 (제목·코드·도해 라벨은 예외).
- 본문은 존댓말 서사 톤 (Paper 카테고리는 평서체 허용).

## 로컬 미리보기

`.claude/launch.json`의 "blog" 설정(python3 http.server 8940). `.claude/`는 커밋하지 않는다.
