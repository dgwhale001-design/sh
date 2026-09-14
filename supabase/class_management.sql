-- 학생관리 > 반 관리 기능
-- 관리자만 반을 등록·수정하고 학생을 배정할 수 있습니다.

create table if not exists public.academy_classes (
  id text primary key,
  name text not null unique,
  school_level text not null default '초등' check (school_level in ('초등', '중등')),
  grade integer not null check (grade between 1 and 6),
  subject text not null default '영어·수학',
  monthly_tuition integer not null default 0 check (monthly_tuition >= 0),
  features text not null default '',
  status text not null default '운영중' check (status in ('운영중', '운영종료')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_classes enable row level security;

drop policy if exists "admin academy classes" on public.academy_classes;
create policy "admin academy classes" on public.academy_classes
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

revoke all on public.academy_classes from anon;
grant select, insert, update, delete on public.academy_classes to authenticated;
