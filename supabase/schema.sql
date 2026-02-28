-- =============================================
-- Writing Tutoring Reviewer - Supabase Schema
-- =============================================
-- Supabase Dashboard > SQL Editor 에서 실행하세요

-- 1. 세션 테이블: 튜터링 세션 메타정보
create table if not exists sessions (
  id text primary key,
  title text not null,
  student text not null,
  date text not null,
  description text,
  created_at timestamptz default now()
);

-- 2. 발화 테이블: 각 세션의 대화 내용
create table if not exists utterances (
  id serial primary key,
  session_id text references sessions(id) on delete cascade,
  seq integer not null,           -- 발화 순서 (0-based)
  speaker text not null,          -- 'A' (AI) or 'B' (학생)
  utterance text not null,
  start_time integer not null,    -- 밀리초
  end_time integer not null,
  unique(session_id, seq)
);

-- 3. 하이라이트 테이블
create table if not exists highlights (
  id serial primary key,
  session_id text references sessions(id) on delete cascade,
  utterance_seq integer not null,
  color text not null,            -- 'yellow', 'green', 'blue', 'pink', 'orange', 'purple'
  reviewer_name text default 'Anonymous',
  created_at timestamptz default now(),
  unique(session_id, utterance_seq, reviewer_name)
);

-- 4. 태그 테이블
create table if not exists tags (
  id serial primary key,
  session_id text references sessions(id) on delete cascade,
  utterance_seq integer not null,
  tag text not null,              -- 'scaffolding', 'probing', 'praise', etc.
  reviewer_name text default 'Anonymous',
  created_at timestamptz default now(),
  unique(session_id, utterance_seq, tag, reviewer_name)
);

-- 5. 코멘트 테이블
create table if not exists comments (
  id serial primary key,
  session_id text references sessions(id) on delete cascade,
  utterance_seq integer not null,
  text text not null,
  reviewer_name text default 'Anonymous',
  created_at timestamptz default now()
);

-- 6. 전체 평가 메모
create table if not exists global_notes (
  id serial primary key,
  session_id text references sessions(id) on delete cascade,
  text text not null,
  reviewer_name text default 'Anonymous',
  updated_at timestamptz default now(),
  unique(session_id, reviewer_name)
);

-- 인덱스
create index if not exists idx_utterances_session on utterances(session_id, seq);
create index if not exists idx_highlights_session on highlights(session_id);
create index if not exists idx_tags_session on tags(session_id);
create index if not exists idx_comments_session on comments(session_id);

-- RLS (Row Level Security) - 공개 읽기/쓰기 허용
-- 인증 없이 누구나 접근 가능하도록 설정
alter table sessions enable row level security;
alter table utterances enable row level security;
alter table highlights enable row level security;
alter table tags enable row level security;
alter table comments enable row level security;
alter table global_notes enable row level security;

create policy "Public read sessions" on sessions for select using (true);
create policy "Public insert sessions" on sessions for insert with check (true);
create policy "Public read utterances" on utterances for select using (true);
create policy "Public insert utterances" on utterances for insert with check (true);
create policy "Public read highlights" on highlights for select using (true);
create policy "Public all highlights" on highlights for all using (true);
create policy "Public read tags" on tags for select using (true);
create policy "Public all tags" on tags for all using (true);
create policy "Public read comments" on comments for select using (true);
create policy "Public all comments" on comments for all using (true);
create policy "Public read global_notes" on global_notes for select using (true);
create policy "Public all global_notes" on global_notes for all using (true);
