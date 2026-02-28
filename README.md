# 📖 Writing Tutoring Reviewer

글쓰기 튜터링 대화(AI ↔ 학생)를 분석하고, 형광펜·태그·코멘트를 남기며, 여러 리뷰어가 함께 리뷰할 수 있는 웹 앱입니다.

## 기능

- **세션 목록**: 여러 튜터링 세션을 카드 형태로 보여줌
- **대화 뷰어**: 207개 발화를 타임스탬프와 함께 표시
- **형광펜 하이라이트**: 6가지 색상으로 발화에 색칠
- **태그**: 스캐폴딩, 탐색 질문, 칭찬, 방향 전환, 수정 제안, 학생 작성, 문제점, 우수사례
- **코멘트**: 각 발화에 자유 코멘트 (리뷰어 이름 표시)
- **전체 평가 메모**: 세션에 대한 종합 평가
- **다중 리뷰어 지원**: 접속 시 이름 입력 → 모든 리뷰가 공유됨
- **필터**: 화자별(AI/학생), 태그별 필터링

## 기술 스택

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + RLS)
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

### 3단계: 프로젝트 설정

```bash
# 프로젝트 클론 후 의존성 설치
cd tutoring-reviewer
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

### 4단계: 대화 데이터 삽입

```bash
# XLS에서 추출한 207개 발화 데이터를 Supabase에 삽입
npm run seed
```

### 5단계: 로컬 개발

```bash
npm run dev
# → http://localhost:3000 에서 확인
```

### 6단계: Vercel 배포

1. GitHub에 코드 push
2. [vercel.com](https://vercel.com) 접속 → Import Git Repository
3. Environment Variables 에 아래 두 값 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** 클릭

배포 완료 후 URL을 공유하면 누구나 접속하여 리뷰할 수 있습니다.

---

## 📁 프로젝트 구조

```
tutoring-reviewer/
├── app/
│   ├── layout.js          # 루트 레이아웃 (폰트, 글로벌 스타일)
│   ├── globals.css         # Tailwind CSS
│   ├── page.js             # 세션 목록 (Server Component)
│   └── session/[id]/
│       ├── page.js         # 세션 상세 (Server Component → 데이터 fetch)
│       └── ReviewClient.js # 리뷰 UI (Client Component → 인터랙션)
├── lib/
│   ├── supabase.js         # Supabase 클라이언트
│   └── constants.js        # 상수 (색상, 태그, 시간 포맷)
├── supabase/
│   └── schema.sql          # DB 스키마 (SQL Editor에서 실행)
├── scripts/
│   └── seed.js             # 대화 데이터 시딩
└── README.md
```

## 새 세션 추가하기

1. XLS 파일에서 데이터를 JSON으로 변환
2. `scripts/seed.js`를 참고하여 새 시딩 스크립트 작성
3. `sessions` 테이블에 메타정보, `utterances` 테이블에 발화 데이터 삽입
