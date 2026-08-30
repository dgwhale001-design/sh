-- 고래영어 · 이든수학 MVP용 데모 스키마
-- 현재 명단은 가상 데이터이므로 익명 접근을 허용합니다.
-- 실제 학생 정보로 전환하기 전에는 Supabase Auth와 관리자 전용 RLS 정책을 적용하세요.

create table if not exists public.students (
  id integer primary key,
  name text not null,
  grade integer not null check (grade between 1 and 6),
  class_name text not null,
  subjects text not null default '영어·수학',
  status text not null default '재원',
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  student_id integer not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('출석', '지각', '결석', '미확인')),
  updated_at timestamptz not null default now(),
  primary key (student_id, attendance_date)
);

create table if not exists public.learning_records (
  id text primary key,
  student_id integer not null references public.students(id) on delete cascade,
  record_date date not null default current_date,
  progress text not null,
  homework text not null default '과제 없음',
  level text not null default '좋음',
  memo text not null default '특이사항 없음',
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.learning_records enable row level security;

drop policy if exists "demo students read" on public.students;
drop policy if exists "demo students write" on public.students;
drop policy if exists "demo attendance read" on public.attendance;
drop policy if exists "demo attendance write" on public.attendance;
drop policy if exists "demo records read" on public.learning_records;
drop policy if exists "demo records write" on public.learning_records;

create policy "demo students read" on public.students for select to anon, authenticated using (true);
create policy "demo students write" on public.students for all to anon, authenticated using (true) with check (true);
create policy "demo attendance read" on public.attendance for select to anon, authenticated using (true);
create policy "demo attendance write" on public.attendance for all to anon, authenticated using (true) with check (true);
create policy "demo records read" on public.learning_records for select to anon, authenticated using (true);
create policy "demo records write" on public.learning_records for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.students to anon, authenticated;
grant select, insert, update, delete on public.attendance to anon, authenticated;
grant select, insert, update, delete on public.learning_records to anon, authenticated;
