-- 고래영어 · 이든수학 운영용 Supabase 스키마
-- 관리자 이메일 인증 후에만 학생 개인정보와 운영 기록에 접근할 수 있습니다.

create table if not exists public.students (
  id bigint primary key,
  name text not null,
  school_level text not null default '초등' check (school_level in ('초등', '중등')),
  grade integer not null check (grade between 1 and 6),
  class_name text not null,
  school_name text not null default '',
  parent_phone text not null default '',
  student_phone text not null default '',
  enrolled_date date,
  notes text not null default '',
  subjects text not null default '영어·수학',
  status text not null default '재원' check (status in ('신규', '재원', '휴회', '퇴원')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students add column if not exists school_level text not null default '초등';
alter table public.students add column if not exists school_name text not null default '';
alter table public.students add column if not exists parent_phone text not null default '';
alter table public.students add column if not exists student_phone text not null default '';
alter table public.students add column if not exists enrolled_date date;
alter table public.students add column if not exists notes text not null default '';
alter table public.students add column if not exists is_demo boolean not null default false;
alter table public.students add column if not exists updated_at timestamptz not null default now();

create table if not exists public.attendance (
  student_id bigint not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('출석', '지각', '결석', '미확인')),
  updated_at timestamptz not null default now(),
  primary key (student_id, attendance_date)
);

create table if not exists public.learning_records (
  id text primary key,
  student_id bigint not null references public.students(id) on delete cascade,
  record_date date not null default current_date,
  progress text not null,
  homework text not null default '과제 없음',
  level text not null default '좋음',
  memo text not null default '특이사항 없음',
  created_at timestamptz not null default now()
);

-- 기존 MVP 가상 명단은 보존하되 운영 화면에서는 제외합니다.
update public.students set is_demo = true where id < 10000;

alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.learning_records enable row level security;

drop policy if exists "demo students read" on public.students;
drop policy if exists "demo students write" on public.students;
drop policy if exists "demo attendance read" on public.attendance;
drop policy if exists "demo attendance write" on public.attendance;
drop policy if exists "demo records read" on public.learning_records;
drop policy if exists "demo records write" on public.learning_records;
drop policy if exists "admin students" on public.students;
drop policy if exists "admin attendance" on public.attendance;
drop policy if exists "admin learning records" on public.learning_records;

create policy "admin students" on public.students
  for all to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'dgwhale001@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'dgwhale001@gmail.com');

create policy "admin attendance" on public.attendance
  for all to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'dgwhale001@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'dgwhale001@gmail.com');

create policy "admin learning records" on public.learning_records
  for all to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'dgwhale001@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'dgwhale001@gmail.com');

revoke all on public.students from anon;
revoke all on public.attendance from anon;
revoke all on public.learning_records from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.learning_records to authenticated;
