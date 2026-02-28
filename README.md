# 📖 Writing Tutoring Reviewer

글쓰기 튜터링 대화(AI ↔ 학생)를 분석하고, 형광펜·태그·코멘트를 남기며, 여러 리뷰어가 함께 리뷰할 수 있는 웹 앱입니다.

## 기능

- **세션 목록**: 여러 튜터링 세션을 카드 형태로 보여줌
- **대화 뷰어**: 발화를 타임스탬프와 함께 표시
- **형광펜 하이라이트**: 6가지 색상으로 발화에 색칠
- **태그**: 스캐폴딩, 탐색 질문, 칭찬, 방향 전환, 수정 제안, 학생 작성, 문제점, 우수사례
- **코멘트**: 각 발화에 자유 코멘트 (리뷰어 이름 표시)
- **전체 평가 메모**: 세션에 대한 종합 평가
- **다중 리뷰어 지원**: 접속 시 이름 입력 → 모든 리뷰가 공유됨
- **실시간 동기화**: Supabase Realtime으로 다른 리뷰어의 변경사항 즉시 반영
- **필터**: 화자별(AI/학생), 태그별 필터링
- **세션 업로드**: 웹에서 직접 XLS/XLSX/CSV 파일을 업로드하여 새 세션 추가

## 기술 스택

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Realtime)
- **Tailwind CSS**
- **Vercel** 배포

---

## 🚀 설정 가이드

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → **New Project** 생성
2. Project Settings > API 에서 다음 두 값을 복사:
   - `Project URL` (예: `https://xxxx.supabase.co`)
   - `anon public` key

### 2단계: 데이터베이스 테이블 생성

1. Supabase Dashboard → **SQL Editor** 메뉴
2. `supabase/schema.sql` 파일 내용을 복사-붙여넣기 → **Run** 클릭

### 3단계: Supabase Realtime 활성화

리뷰 데이터의 실시간 동기화를 위해 Realtime을 활성화해야 합니다:

1. Supabase Dashboard → **Database → Replication** 메뉴
2. 다음 4개 테이블을 Realtime publication에 추가:
   - `highlights`
   - `tags`
   - `comments`
   - `global_notes`

> 이 설정이 없으면 다른 리뷰어의 변경사항이 실시간으로 반영되지 않습니다 (새로고침 필요).

### 4단계: 프로젝트 설정

```bash
# 프로젝트 클론 후 의존성 설치
cd review_ui
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어 Supabase URL과 Key를 입력
```

`.env.local` 파일:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5단계: 대화 데이터 삽입

```bash
# 시딩 스크립트로 초기 데이터 삽입 (선택사항 — 웹 업로드로도 가능)
npm run seed
```

또는 앱 실행 후 웹에서 **"+ 새 세션 업로드"** 버튼으로 XLS/XLSX/CSV 파일을 직접 업로드할 수 있습니다.

### 6단계: 로컬 개발

```bash
npm run dev
# → http://localhost:3000 에서 확인
```

### 7단계: Vercel 배포

1. GitHub에 코드 push
2. [vercel.com](https://vercel.com) 접속 → **Add New Project** → **Import Git Repository**
3. **GitHub 저장소를 연결** (Vercel이 push 이벤트를 감지하여 자동 배포)
4. Root Directory를 `review_ui`로 설정 (모노레포 구조인 경우)
5. Environment Variables에 아래 두 값 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Deploy** 클릭

> **중요**: Vercel에 GitHub 저장소를 연결해야 이후 `git push`할 때 자동으로 배포가 트리거됩니다. 연결하지 않으면 수동으로 `vercel --prod` CLI 명령을 실행해야 합니다.

배포 완료 후 URL을 공유하면 누구나 접속하여 리뷰할 수 있습니다.

---

## 📁 프로젝트 구조

```
review_ui/
├── app/
│   ├── layout.js          # 루트 레이아웃 (폰트, 글로벌 스타일)
│   ├── globals.css         # Tailwind CSS
│   ├── page.js             # 세션 목록 (Server Component)
│   ├── upload/
│   │   ├── page.js         # 업로드 페이지 (Server Component)
│   │   └── UploadClient.js # 업로드 UI (Client Component)
│   └── session/[id]/
│       ├── page.js         # 세션 상세 (Server Component → 데이터 fetch)
│       └── ReviewClient.js # 리뷰 UI (Client Component → 인터랙션 + Realtime)
├── lib/
│   ├── supabase.js         # Supabase 클라이언트
│   ├── constants.js        # 상수 (색상, 태그, 시간 포맷)
│   └── parse-file.js       # XLS/XLSX/CSV 파일 파싱
├── supabase/
│   └── schema.sql          # DB 스키마 (SQL Editor에서 실행)
├── scripts/
│   └── seed.js             # 대화 데이터 시딩
└── README.md
```

## 새 세션 추가하기

### 방법 1: 웹 업로드 (권장)
앱에서 **"+ 새 세션 업로드"** 버튼 클릭 → XLS/XLSX/CSV 파일 선택 → 메타정보 입력 → 업로드

### 방법 2: 시딩 스크립트
1. XLS 파일에서 데이터를 JSON으로 변환
2. `scripts/seed.js`를 참고하여 새 시딩 스크립트 작성
3. `sessions` 테이블에 메타정보, `utterances` 테이블에 발화 데이터 삽입
