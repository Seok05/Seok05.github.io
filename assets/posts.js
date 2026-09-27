/* ─────────────────────────────────────────────────────────────
   이 블로그의 단일 데이터 원장.

   새 글을 올릴 때 할 일은 두 가지뿐이다:
     1. posts/ 에 글 HTML을 넣는다 (posts/_template.html 복사 권장)
     2. 아래 posts 배열 맨 위에 항목 하나를 추가한다

   홈의 글 목록, 카테고리 카운트, 필터, 글 하단의 이전/다음
   내비게이션이 전부 이 파일 하나에서 만들어진다 (assets/site.js).
   각 글 HTML 안의 사이드바·post-nav는 자바스크립트가 꺼져 있을
   때를 위한 예비일 뿐이므로 손대지 않아도 된다.

   필드 설명 (cats):
     mark     : 표지(타이포 커버)에 크게 찍는 짧은 이름
     hue      : 표지 색상(0~360). 카테고리마다 다른 색 한 톤
     featured : 홈 맨 위 '지금 쓰는 시리즈' 자리에 올릴 카테고리 (하나만)
     art      : 표지 그림. app(앱 아이콘 + 폰 프레임 속 화면) · web(아이콘 + 브라우저 창 속 화면) · image(파일 하나) ·
                draw(site.js의 ART에 있는 그림 이름). 없으면 mark 글자로 대신한다
   필드 설명 (posts):
     slug   : posts/<slug>.html 의 파일명
     cat    : cats 중 하나의 key
     series : 시리즈 묶음 (같은 series끼리 order 순으로 이전/다음 연결)
     order  : 시리즈 안에서의 순서 (읽는 순서)
     related: 시리즈 밖 관련 글의 slug 목록 ("관련"으로 연결)
   ───────────────────────────────────────────────────────────── */

window.SEOK = {
  cats: [
    {
      key: "cheotjan",
      art: { type: "app", icon: "assets/covers/cheotjan-icon.png", shot: "assets/covers/cheotjan-home.webp" },
      mark: "첫잔",
      hue: 16,
      featured: true,
      name: "바이브코딩 · 첫잔",
      desc: "위스키 기록 앱 첫잔을 만드는 동안 쓴 일지. 그날 정한 것과 아직 모르는 것.",
    },
    {
      key: "evalue",
      art: { type: "web", icon: "assets/covers/evalue-appicon.svg", shot: "assets/covers/evalue-landing.webp" },
      mark: "EValue",
      hue: 165,
      name: "사업 · EValue",
      desc: "지금 만들고 있는 서비스 EValue(중고 전기차 매물을 매일 지켜보며 값을 견주는 도구)를 만들며 부딪힌 문제와 결정의 기록.",
    },
    {
      key: "battery",
      art: { type: "image", src: "assets/covers/battery-cells.webp", width: "68%" },
      mark: "배터리",
      hue: 350,
      name: "연구 · 배터리",
      desc: "전기차의 심장인 배터리를 실험실과 데이터 양쪽에서 들여다본 기록.",
    },
    {
      key: "dft",
      art: { type: "image", src: "assets/covers/dft-namno2.webp", width: "64%" },
      mark: "DFT",
      hue: 30,
      name: "연구 · DFT",
      desc: "배터리 재료를 원자 단위에서 계산하는 법을 바닥부터 배우는 기록. 이론과 실습을 나란히.",
    },
    {
      key: "paper",
      art: { type: "image", src: "assets/covers/paper-sheets.webp", width: "62%" },
      mark: "Paper",
      hue: 210,
      name: "연구 · Paper",
      desc: "읽은 논문을 소화해서 남기는 리뷰. 수치, 논증 구조, 저자들이 그은 한계까지.",
    },
  ],

  posts: [
    {
      slug: "dft-practice-6",
      cat: "dft",
      date: "2026.09.27",
      series: "dft",
      order: 9,
      related: ["dft-theory-3"],
      title: "DFT 실습 [6] — Na 하나를 빼서 첫 전압을 얻었다: 2.40 V",
      blurb:
        "α-NaMnO₂에서 Na를 하나 빼고 Na 금속을 기준 전극으로 계산해 첫 전압 2.40 V를 얻었습니다. 대칭을 깨서 Mn³⁺와 Mn⁴⁺를 갈라놓고, 자리별 결합 길이로 얀-텔러가 사라지는 것을 확인하고, Pulay 보정의 부호가 부피를 따라 바뀌는 것까지 본 연구 0호 데이터의 기록.",
    },
    {
      slug: "dft-practice-5",
      cat: "dft",
      date: "2026.09.27",
      series: "dft",
      order: 8,
      related: ["dft-theory-2"],
      title: "DFT 실습 [5] — 장난감을 졸업했더니 팔면체가 늘어나 있었다",
      blurb:
        "이상화 구조를 버리고 Materials Project에서 진짜 NaMnO₂를 꺼내 왔습니다. 파이썬 버전 충돌을 넘어 다형체 11개를 조회하고, 처음으로 이완 계산을 두 번 돌렸고, Mn–O 결합 여섯 개에서 얀-텔러의 지문(4개 짧고 2개 긴)을 직접 확인했습니다.",
    },
    {
      slug: "dft-practice-4",
      cat: "dft",
      date: "2026.09.27",
      series: "dft",
      order: 7,
      related: ["paper-1-wang2006"],
      title: "DFT 실습 [4] — U를 걸었더니 전자가 제자리로 돌아왔다",
      blurb:
        "한 달을 미루고 복귀한 날, 이론 [3]에 걸어둔 가설을 실측으로 회수했습니다. INCAR 여섯 줄(U=3.9 eV)에 Mn d 모멘트가 3.85에서 4.35로. 그리고 GGA와 GGA+U의 에너지를 직접 비교하면 안 되는 이유를 4.5 eV짜리 실물로 확인했습니다.",
    },
    {
      slug: "cheotjan-fingerprint",
      cat: "cheotjan",
      date: "2026.09.19",
      series: "cheotjan",
      order: 9,
      title: "첫잔 [9] — .gitignore 한 줄이 업데이트를 막은 날, 그리고 세 번째",
      blurb:
        "Expo의 OTA는 네이티브 지문이 같은 빌드에만 갑니다. 그 지문에 .gitignore, package.json의 scripts, 앱 아이콘이 들어간다는 걸 세 번 당하고서야 규칙으로 적었습니다.",
    },
    {
      slug: "cheotjan-no-numbers",
      cat: "cheotjan",
      date: "2026.09.18",
      series: "cheotjan",
      order: 8,
      related: ["price-band"],
      title: "첫잔 [8] — 앱에 숫자를 적지 않기로 했다",
      blurb:
        "\"전체 629병 훑어보기\"라고 적었더니 그 문장이 우리 데이터의 한계를 드러내고 있었습니다. 결과 개수, 시드 총수, 산지 지도의 병 수까지 전부 지웠습니다. 세는 건 정렬에만 씁니다.",
    },
    {
      slug: "cheotjan-delete-account",
      cat: "cheotjan",
      date: "2026.09.06",
      series: "cheotjan",
      order: 7,
      title: "첫잔 [7] — 로그인보다 어려운 회원 탈퇴",
      blurb:
        "카카오·Google·Apple 로그인은 반나절이면 붙습니다. 그 계정을 제대로 지우는 데는 하루가 걸렸습니다. 지우는 순서가 있고, 지우려면 로그인하는 순간에 미리 챙겨 둬야 하는 것이 있었습니다.",
    },
    {
      slug: "cheotjan-things-removed",
      cat: "cheotjan",
      date: "2026.09.04",
      series: "cheotjan",
      order: 6,
      title: "첫잔 [6] — 잔량, 개봉일, 위시, 연령 확인을 지웠다",
      blurb:
        "시장조사가 요구한 필드들을 다 만들고 다 지웠습니다. 전부 사용자에게 숙제를 내는 칸이었습니다. 저장 목록은 내 위스키 하나로, 앱 안의 연령 확인은 스토어 등급으로.",
    },
    {
      slug: "cheotjan-ai-smell",
      cat: "cheotjan",
      date: "2026.09.03",
      series: "cheotjan",
      order: 5,
      title: "첫잔 [5] — \"아직 AI스럽다\"는 말을 듣고",
      blurb:
        "AI와 만든 앱을 보여줬더니 AI스럽다는 말이 돌아왔습니다. 그 말이 정확히 어디를 가리키는지 찾아 표지·부팅·홈을 다시 짰습니다. 같은 모티프 두 번, 설명이 붙은 버튼, 세 번 반복되는 같은 행.",
    },
    {
      slug: "cheotjan-apk-103mb",
      cat: "cheotjan",
      date: "2026.09.02",
      series: "cheotjan",
      order: 4,
      title: "첫잔 [4] — APK가 103MB였다",
      blurb:
        "갤럭시에 보낼 첫 APK가 103MB였습니다. 첫 조치는 헛발질이었고, 진짜 원인은 아키텍처 네 개였습니다. 52MB를 해부한 뒤 병 그림을 줄이고 R8을 켰습니다.",
    },
    {
      slug: "cheotjan-mfds-504",
      cat: "cheotjan",
      date: "2026.08.29",
      series: "cheotjan",
      order: 3,
      title: "첫잔 [3] — 크롤링 대신 식약처: 수입신고 15만 건에서 위스키 504건",
      blurb:
        "명세에는 2,500종이라 적었는데 손으로 모은 건 464종이었습니다. 식약처 수입신고 15만 건에서 위스키 504건을 골라 시드와 맞춰 보니, 공식 데이터라도 붙이는 건 확률이라 자동으로 고치지 않기로 했습니다.",
    },
    {
      slug: "cheotjan-robots-gsshop",
      cat: "cheotjan",
      date: "2026.08.28",
      series: "cheotjan",
      order: 2,
      related: ["price-band"],
      title: "첫잔 [2] — robots.txt를 안 보고 GS샵을 주력으로 썼다",
      blurb:
        "브랜드별 국내 위스키 소매가를 주는 무료·합법 피드는 없습니다. 단일 가격을 포기하고 밴드로 바꾸자 수확률이 세 배가 됐고, 그 과정에서 넘지 말아야 할 선을 두 번 밟을 뻔했습니다.",
    },
    {
      slug: "cheotjan-score-60",
      cat: "cheotjan",
      date: "2026.08.27",
      series: "cheotjan",
      order: 1,
      related: ["price-band"],
      title: "첫잔 [1] — 60점은 \"무난\"이 아니었다",
      blurb:
        "위스키 기록 앱 첫잔의 첫날. 기획서에 적어 둔 \"60 무난 · 80 훌륭\"은 별 세 개를 100으로 환산한 숫자였습니다. Whiskybase의 실제 구간을 읽고 라벨을 형용사에서 행동으로 바꿨습니다.",
    },
    {
      slug: "paper-1-wang2006",
      cat: "paper",
      date: "2026.08.25",
      series: "paper",
      order: 1,
      related: ["dft-theory-3"],
      title: "Paper [1] — DFT는 왜 녹스는 에너지를 못 맞혔나: GGA+U로 산화 에너지 잡기",
      blurb:
        "첫 논문 리뷰. GGA의 산화 에너지 오차가 왜 둘이고 서로를 가리는지, O₂당 1.36 eV와 금속별 U가 어떻게 분리·결정·검증되는지, 수치와 논증 구조, 저자들이 스스로 그은 한계까지 해부했습니다. (Wang, Maxisch & Ceder, PRB 2006)",
    },
    {
      slug: "dft-practice-3",
      cat: "dft",
      date: "2026.08.25",
      series: "dft",
      order: 6,
      title: "DFT 실습 [3] — k점 네 개가 물리를 부순 날",
      blurb:
        "빈칸 뚫린 설계도를 그대로 실행한 사고, bash의 공백 문제, 제출 전 검문소 습관, 그리고 2×2×1 mesh에서 자기모멘트가 깨지는 순간까지. 샘플링 부족은 잡음이 아니라 다른 물리를 만든다는 것을 목격한 날.",
    },
    {
      slug: "dft-theory-3",
      cat: "dft",
      date: "2026.08.25",
      series: "dft",
      order: 5,
      related: ["paper-1-wang2006"],
      title: "DFT 이론 [3] — GGA는 왜 전압을 1 V씩 틀리는가: +U 보정의 논리",
      blurb:
        "표준 DFT의 전압 오차는 잡음이 아니라 한 방향의 계통 편향입니다. 국재화된 d 전자를 차별하는 오차의 정체, O₂ 분자의 별도 오차, 그리고 U=3.9 eV라는 숫자의 출처까지. Wang–Maxisch–Ceder (PRB 2006)를 공부하며 정리한 노트.",
    },
    {
      slug: "dft-practice-2",
      cat: "dft",
      date: "2026.08.24",
      series: "dft",
      order: 4,
      title: "DFT 실습 [2] — 폴더 여덟 개로 그린 인생 첫 수렴 곡선",
      blurb:
        "INCAR 열한 줄의 해부, 계산 로그를 4막 드라마로 읽는 법, 그리고 for 반복문 하나로 ENCUT 여덟 점을 돌려 설정값을 감이 아니라 데이터로 확정한 기록. \"가짜로 낮은 에너지\"에 속지 않는 법도 배웠습니다.",
    },
    {
      slug: "dft-theory-2",
      cat: "dft",
      date: "2026.08.24",
      series: "dft",
      order: 3,
      title: "DFT 이론 [2] — 자기모멘트 12.0은 어떻게 Mn³⁺의 증명이 되는가",
      blurb:
        "DFT에는 '산화수'라는 출력이 없습니다. 그런데 로그의 mag=11.9991 한 줄로 망간이 +3가임을 증명할 수 있습니다. 전하 장부, 결정장, 훈트 규칙, 반례표까지, 다섯 단계의 추리와 그것이 순환논법이 아닌 이유.",
    },
    {
      slug: "first-dft-run",
      cat: "dft",
      date: "2026.08.23",
      series: "dft",
      order: 2,
      title: "DFT 실습 [1] — 맥북에서 인생 첫 계산까지, 89.5초의 기록",
      blurb:
        "SSH 접속, 스케줄러 파악, POTCAR 라이브러리 정리, 입력 파일 4종, 그리고 로그 읽는 법까지. 계산재료과학의 '헬로 월드'를 처음부터 끝까지 직접 해 본 하루. 마지막 줄의 mag=12.0이 이 글의 하이라이트입니다.",
    },
    {
      slug: "dft-explained",
      cat: "dft",
      date: "2026.08.23",
      series: "dft",
      order: 1,
      title: "DFT 이론 [1] — 슈뢰딩거 방정식을 \"못 풀어서\" 만들어진 도구",
      blurb:
        "원자 배치를 넣으면 에너지가 나오는 계산기. 왜 정면돌파가 불가능한 문제였는지, 밀도 하나로 어떻게 우회했는지, 입력 파일들이 이론의 어느 부품인지까지. 사전 지식 없이 읽히게 정리한 노트.",
    },
    {
      slug: "battery-soh-range",
      cat: "battery",
      date: "2026.08.18",
      title: "배터리 건강, 왜 숫자 하나로 말하면 안 될까",
      blurb:
        "중고 전기차에서 제일 궁금한 건 결국 배터리인데, 열화는 두 갈래로 오고 그중 절반은 기록에 안 남습니다. 실측을 모아 곡선을 맞춰 보고 알게 된 것들.",
    },
    {
      slug: "graph-first",
      cat: "evalue",
      date: "2026.08.18",
      title: "데이터가 얕아도 그래프는 그린다 — 표현과 해석을 갈랐다",
      blurb:
        "\"데이터를 모으는 중입니다\"라는 문장은 사용자에게 빈 화면과 같습니다. 그림은 하루치여도 그리고, 추세를 말하는 문장만 표본이 감당할 때 붙이기로 했습니다.",
    },
    {
      slug: "theil-sen",
      cat: "evalue",
      date: "2026.08.18",
      title: "하루가 튀어도 흔들리지 않는 추세선 — Theil–Sen 회귀",
      blurb:
        "최소제곱법은 단 하루의 이상치에 기울기를 내줍니다. 모든 점쌍의 기울기 중앙값을 쓰는 방법을 배우고, 왜 이게 우리 데이터에 맞는지 테스트로 확인했습니다.",
    },
    {
      slug: "price-band",
      cat: "evalue",
      date: "2026.08.18",
      title: "\"적정가\"라는 단어를 버렸다",
      blurb:
        "숫자 하나를 내놓으면 사용자는 그것을 측정값으로 읽습니다. 우리는 감정평가사가 아니어서, 단일 값을 사분위 구간으로 바꾸고 라벨을 데이터가 보증하는 범위까지만 줄였습니다.",
    },
    {
      slug: "cohort-fallback",
      cat: "evalue",
      date: "2026.08.18",
      title: "표본이 부족할 때 무엇을 먼저 포기할까 — 폴백 사다리",
      blurb:
        "같은 조건 매물이 3대뿐인 코호트에서 회귀는 의미가 없습니다. 정밀도를 단계적으로 포기하면서 그 사실을 화면에 드러내는 5단 구조를 만들었습니다.",
    },
    {
      slug: "sold-day-attribution",
      cat: "evalue",
      date: "2026.08.18",
      title: "수집이 하루 빠지면 통계가 거짓말을 한다 — 소진일 귀속",
      blurb:
        "매물이 사라진 걸 발견한 날은 팔린 날이 아닙니다. 관측 공백을 어느 날로 귀속하느냐가 \"평균 며칠 만에 팔리는가\"를 한쪽으로 계속 밀어냅니다.",
    },
    {
      slug: "laptop-to-server",
      cat: "evalue",
      date: "2026.08.18",
      title: "노트북을 24시간 서버로 만들어 본 기록",
      blurb:
        "임시 터널의 주소는 매번 바뀌고, 회사 계정은 관리자 정책에 막히고, 홈 디렉터리는 root 소유였습니다. 고정 주소 하나를 얻기까지의 삽질과, 결국 배운 한 가지.",
    },
  ],
};
