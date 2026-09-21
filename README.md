# 내 주식 뉴스

50~60대 사용자가 스마트폰에서 관심 종목의 최신 뉴스를 쉽고 크게 읽을 수 있도록 만든 개인용 주식 뉴스 웹앱입니다.

서버와 데이터베이스 없이 운영됩니다. GitHub Actions가 Google News의 공개 RSS 피드에서 기사를 수집해 `public/data/*.json`으로 저장하고, GitHub Pages에 배포된 React 앱은 이 정적 JSON만 읽습니다. 기사 제목·RSS 설명을 이용한 짧은 요약만 제공하며 매수·매도 판단이나 투자 추천은 하지 않습니다.

## 주요 기능

- 관심 종목을 큰 카드로 표시
- 종목별 최신 뉴스와 “오늘의 종목” 요약 제공
- 전체 뉴스 최신순 보기와 종목 필터
- 제목·요약·종목명 검색
- 마지막 방문 이후 들어온 새 뉴스 표시
- LocalStorage 기반 기사 저장
- 기본 / 크게 / 아주 크게 3단계 글씨 크기
- PWA 설치 및 기본 오프라인 캐시
- 375~430px 모바일 우선 UI, 44px 이상의 터치 영역
- 로그인, 서버, DB, 유료 API 없음

처음 저장소에는 삼성전자, SK하이닉스, 현대차의 화면 확인용 예시 뉴스가 각 5개씩 들어 있습니다. `Update stock news` 워크플로를 한 번 실행하면 실제 RSS 뉴스로 교체됩니다.

## 기술 구성

- React + Vite + TypeScript
- 일반 CSS 기반 디자인 토큰과 모바일 우선 반응형 레이아웃
- Phosphor SVG 아이콘
- Google News RSS + `fast-xml-parser`
- GitHub Actions + GitHub Pages
- 브라우저 LocalStorage

데이터 흐름은 다음과 같습니다.

```text
GitHub Actions
  → Google News RSS 수집
  → 제목 정규화 및 유사 기사 제거
  → 규칙 기반 요약과 카테고리 분류
  → 종목별 JSON 및 all.json 생성
  → 저장소에 자동 커밋
  → GitHub Pages 자동 재배포
```

## 1. 로컬 실행 방법

Node.js 22 이상과 npm이 필요합니다.

```bash
npm install
npm run dev
```

터미널에 표시된 주소(기본값 `http://localhost:5173`)를 브라우저에서 엽니다.

프로덕션 빌드와 미리보기:

```bash
npm run build
npm run preview
```

검증 명령:

```bash
npm test
npm run news:update -- --dry-run
npm run visual:check
```

- `npm test`: 제목 정규화와 중복 제거 단위 테스트
- `--dry-run`: 실제 RSS를 수집하고 파싱하지만 JSON 파일은 변경하지 않음
- `visual:check`: 로컬 미리보기 서버가 4173 포트에서 실행 중일 때 Chrome/Edge로 375px·430px 화면, 가로 넘침, 44px 터치 영역을 검사함. 브라우저를 찾지 못하면 `CHROME_PATH` 환경 변수를 지정합니다.

## 2. GitHub Pages 배포 방법

1. 이 폴더를 GitHub 저장소의 `main` 브랜치에 올립니다.
2. GitHub 저장소의 **Settings → Pages**로 이동합니다.
3. **Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
4. **Actions** 탭에서 `Deploy website`를 수동 실행하거나 `main` 브랜치에 push합니다.
5. 배포가 끝나면 Actions 실행 화면 또는 Settings → Pages에 사이트 주소가 표시됩니다.

`deploy.yml`은 저장소 이름을 기준으로 Vite의 base path를 자동 지정하므로 일반 프로젝트 Pages 주소(`https://사용자명.github.io/저장소명/`)에서도 동작합니다. 라우팅은 GitHub Pages의 새로고침 문제를 피하기 위해 Hash Router를 사용합니다.

## 3. 관심 종목 추가·삭제 방법

관심 종목은 [`config/stocks.json`](config/stocks.json) 한 파일에서 관리합니다.

```json
{
  "id": "naver",
  "name": "NAVER",
  "ticker": "035420",
  "keywords": ["NAVER", "네이버 AI"]
}
```

- `id`: 영문 소문자와 숫자로 만든 고유 ID. 생성되는 파일명이 `{id}.json`이 됩니다.
- `name`: 화면에 표시할 종목명
- `ticker`: 종목 코드
- `keywords`: Google News RSS에서 검색할 문구

항목을 추가한 뒤 `Update stock news`를 실행하면 종목별 JSON이 자동 생성됩니다. 항목을 삭제하면 화면에서는 즉시 사라집니다. 더 이상 쓰지 않는 기존 `public/data/{id}.json`은 필요할 때 수동으로 정리할 수 있습니다.

검색어가 너무 넓으면 관련 없는 기사가 섞일 수 있으므로 회사명과 핵심 사업을 함께 적는 방식을 권장합니다. 한 종목당 2~3개면 충분합니다.

## 4. 뉴스 업데이트 방식

실제 수집 명령은 다음과 같습니다.

```bash
npm run news:update
```

수집기는 각 검색어에 `when:7d` 조건을 붙여 Google News 한국어 RSS를 조회합니다. 각 피드에서 최대 15개, 종목별로 중복 제거 후 최대 20개를 저장합니다.

저장 정보:

- 제목
- 언론사
- 원문으로 이동하는 Google News 링크
- 기사 작성 시각
- 수집 시각
- 관련 종목
- 짧은 요약
- 카테고리

중복 제거는 URL 일치, 제목 정규화, 글자 단위 유사도를 함께 사용합니다. 여러 종목에 동시에 관련된 기사는 하나로 합치고 `relatedStocks`에 종목을 추가합니다. 일부 검색어가 실패하면 나머지 피드는 계속 처리하며, 한 종목의 결과가 모두 비면 그 종목의 기존 파일을 유지합니다. 모든 RSS 요청이 실패하면 기존 데이터가 덮어써지지 않도록 작업 자체를 실패 처리합니다.

요약은 현재 LLM을 사용하지 않습니다. RSS 설명이 충분하면 짧게 다듬고, 설명이 없으면 기사 제목을 바탕으로 중립적인 안내 문장을 만듭니다. 요약 로직은 [`scripts/summarize-news.ts`](scripts/summarize-news.ts)에 분리되어 있어 나중에 다른 방식으로 교체할 수 있습니다.

## 5. GitHub Actions 설명

### `deploy.yml`

- `main` 브랜치 push 또는 수동 실행 시 작동
- `npm ci`와 `npm run build` 실행
- 생성된 `dist`를 GitHub Pages에 배포
- Pages 배포에 필요한 최소 권한만 사용

### `update-news.yml`

- 한국 시간 기준 매일 08:00, 12:00, 16:00, 20:00 실행
- GitHub의 cron은 UTC이므로 `03:00, 07:00, 11:00, 23:00 UTC`로 설정
- `workflow_dispatch`를 지원해 Actions 화면에서 수동 실행 가능
- JSON이 실제로 바뀐 경우에만 `github-actions[bot]`이 커밋하고 push
- 뉴스 갱신 워크플로가 성공하면 `workflow_run` 이벤트로 `deploy.yml`이 이어서 실행되어 사이트가 갱신됨

자동 커밋에서 권한 오류가 나면 **Settings → Actions → General → Workflow permissions**에서 저장소 정책상 Actions의 쓰기 권한이 허용되는지 확인합니다.

## 6. API Key와 GitHub Secret

현재 기본 Google News RSS 방식에는 API Key가 필요하지 않습니다.

나중에 키가 필요한 공급원으로 바꿀 경우:

1. GitHub 저장소의 **Settings → Secrets and variables → Actions**로 이동합니다.
2. **New repository secret**을 누릅니다.
3. 예를 들어 이름을 `NEWS_API_KEY`로 지정하고 키 값을 저장합니다.
4. `update-news.yml`의 수집 단계에만 환경 변수를 전달합니다.

```yaml
- name: Fetch news
  run: npm run news:update
  env:
    NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
```

수집 스크립트에서는 `process.env.NEWS_API_KEY`로 읽습니다. `VITE_` 접두사가 붙은 환경 변수는 프론트엔드 번들에 포함될 수 있으므로 비밀 키에 절대 사용하지 않습니다. 키를 React 코드, `public` 폴더, JSON 데이터에 기록해서도 안 됩니다.

## 7. 뉴스 source 변경 방법

공급원 관련 코드는 [`scripts/fetch-news.ts`](scripts/fetch-news.ts)의 `fetchFeed` 함수에 모여 있습니다. 다른 RSS나 API로 변경할 때 이 함수가 최종적으로 `NewsArticle[]`을 반환하도록 맞추면 UI 코드는 수정할 필요가 없습니다.

유지해야 하는 데이터 계약은 [`src/types/news.ts`](src/types/news.ts)의 `NewsArticle`, `NewsCollection`, `StockNewsCollection`입니다.

모듈 역할:

- `fetch-news.ts`: 외부 피드 요청, 종목별 병합, JSON 저장
- `normalize-news.ts`: HTML 정리, 제목 정규화, 유사도 계산, 중복 제거
- `summarize-news.ts`: 짧은 요약, 카테고리, 종목별 오늘 요약

RSS/공개 API 사용 조건과 호출 한도는 공급원별 정책을 확인해야 합니다. 이 프로젝트는 기사 본문을 무단 크롤링하거나 저장하지 않고 RSS가 제공하는 제목·링크·설명만 사용합니다.

## 8. LocalStorage와 PWA

서버나 계정 없이 다음 값만 현재 브라우저에 저장합니다.

- 마지막 방문 시각: 새 뉴스 계산
- 저장한 기사
- 글씨 크기

브라우저 데이터를 지우면 이 정보도 사라집니다. 다른 기기와 동기화되지 않습니다.

`manifest.webmanifest`, PWA 아이콘, `sw.js`가 포함되어 있습니다. 서비스 워커는 앱 화면과 최근에 읽은 뉴스 JSON을 캐시합니다. 뉴스 JSON은 온라인일 때 새 데이터를 우선 확인하고, 네트워크가 끊기면 캐시된 값을 사용합니다.

## 9. 프로젝트 구조

```text
.
├─ .github/workflows/
│  ├─ deploy.yml             # GitHub Pages 빌드·배포
│  └─ update-news.yml        # 정기 RSS 수집·커밋
├─ config/
│  └─ stocks.json            # 관심 종목과 검색어
├─ public/
│  ├─ data/
│  │  ├─ all.json
│  │  ├─ samsung.json
│  │  ├─ skhynix.json
│  │  └─ hyundai.json
│  ├─ icons/                 # PWA 및 Apple 홈 화면 아이콘
│  ├─ manifest.webmanifest
│  └─ sw.js
├─ scripts/
│  ├─ fetch-news.ts          # RSS 수집과 JSON 생성
│  ├─ normalize-news.ts      # 제목 정규화·중복 제거
│  ├─ summarize-news.ts      # 규칙 기반 요약·분류
│  ├─ generate-icons.mjs     # PWA PNG 아이콘 생성
│  └─ visual-check.mjs       # 모바일 UI 자동 점검
├─ src/
│  ├─ components/            # 뉴스 카드, 종목 카드, 내비게이션
│  ├─ context/               # 뉴스 데이터 로딩 상태
│  ├─ hooks/                 # LocalStorage, 저장, 글씨 크기
│  ├─ pages/                 # 홈, 전체 뉴스, 종목, 저장, 설정
│  ├─ types/                 # 공통 데이터 타입
│  ├─ utils/                 # 날짜와 정적 JSON 로더
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ styles.css
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 주의 사항

- 이 앱의 요약은 원문을 대신하지 않습니다. 중요한 내용은 반드시 ‘기사 보기’로 원문에서 확인하세요.
- 뉴스 노출 순서와 카테고리는 투자 판단 신호가 아닙니다.
- Google News RSS의 형식이나 제공 정책이 바뀌면 수집 모듈 조정이 필요할 수 있습니다.
