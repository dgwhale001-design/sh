-- 고래영어 · 이든수학 운영용 Supabase 스키마
-- 관리자는 전체 운영정보에, 승인된 강사는 학습·상담 공유정보에만 접근합니다.

create table if not exists public.app_users (
  email text primary key,
  display_name text not null default '',
  role text not null check (role in ('admin', 'teacher')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_users (email, display_name, role, active)
values ('dgwhale001@gmail.com', '원장', 'admin', true)
on conflict (email) do update
set role = 'admin', active = true, updated_at = now();

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and active = true
  limit 1
$$;

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

create table if not exists public.book_vendors (
  id text primary key,
  name text not null,
  manager text not null,
  phone text not null,
  order_method text not null default '',
  payment_method text not null default '',
  settlement_day text not null default '',
  memo text not null default '',
  status text not null default '거래중' check (status in ('거래중', '거래중지')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_parent_feedback (
  id text primary key,
  student_id bigint not null references public.students(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  subject text not null default '영어·수학',
  learning_stage text not null default '',
  learning_content text not null,
  score_info text not null default '',
  homework_status text not null default '',
  engagement text not null default '',
  learning_attitude text not null default '',
  next_progress text not null default '',
  teacher text not null default '',
  parent_message text not null,
  prepared_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, week_start)
);

create table if not exists public.consultations (
  id text primary key,
  student_id bigint references public.students(id) on delete set null,
  student_name text not null,
  consultation_date date not null,
  consultation_type text not null check (consultation_type in ('admission', 'growth', 'special')),
  manager text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultations_student_date_idx
  on public.consultations (student_id, consultation_date desc);

create index if not exists weekly_parent_feedback_student_week_idx
  on public.weekly_parent_feedback (student_id, week_start desc);

-- 기존 MVP 가상 명단은 보존하되 운영 화면에서는 제외합니다.
update public.students set is_demo = true where id < 10000;

alter table public.students enable row level security;
alter table public.academy_classes enable row level security;
alter table public.attendance enable row level security;
alter table public.learning_records enable row level security;
alter table public.book_vendors enable row level security;
alter table public.weekly_parent_feedback enable row level security;
alter table public.consultations enable row level security;
alter table public.app_users enable row level security;

drop policy if exists "demo students read" on public.students;
drop policy if exists "demo students write" on public.students;
drop policy if exists "demo attendance read" on public.attendance;
drop policy if exists "demo attendance write" on public.attendance;
drop policy if exists "demo records read" on public.learning_records;
drop policy if exists "demo records write" on public.learning_records;
drop policy if exists "admin students" on public.students;
drop policy if exists "admin academy classes" on public.academy_classes;
drop policy if exists "admin attendance" on public.attendance;
drop policy if exists "admin learning records" on public.learning_records;
drop policy if exists "admin book vendors" on public.book_vendors;
drop policy if exists "admin weekly parent feedback" on public.weekly_parent_feedback;
drop policy if exists "shared learning records" on public.learning_records;
drop policy if exists "shared weekly parent feedback" on public.weekly_parent_feedback;
drop policy if exists "shared consultations" on public.consultations;
drop policy if exists "own app profile" on public.app_users;
drop policy if exists "admin app users" on public.app_users;

create policy "admin students" on public.students
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "admin academy classes" on public.academy_classes
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "admin attendance" on public.attendance
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "shared learning records" on public.learning_records
  for all to authenticated
  using (public.current_app_role() in ('admin', 'teacher'))
  with check (public.current_app_role() in ('admin', 'teacher'));

create policy "admin book vendors" on public.book_vendors
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "shared weekly parent feedback" on public.weekly_parent_feedback
  for all to authenticated
  using (public.current_app_role() in ('admin', 'teacher'))
  with check (public.current_app_role() in ('admin', 'teacher'));

create policy "shared consultations" on public.consultations
  for all to authenticated
  using (public.current_app_role() in ('admin', 'teacher'))
  with check (public.current_app_role() in ('admin', 'teacher'));

create policy "own app profile" on public.app_users
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "admin app users" on public.app_users
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create or replace function public.get_learning_students()
returns table (
  id bigint,
  name text,
  school_level text,
  grade integer,
  class_name text,
  subjects text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.school_level, s.grade, s.class_name, s.subjects, s.status
  from public.students s
  where public.current_app_role() in ('admin', 'teacher')
    and s.is_demo = false
  order by s.name
$$;

revoke all on public.students from anon;
revoke all on public.academy_classes from anon;
revoke all on public.attendance from anon;
revoke all on public.learning_records from anon;
revoke all on public.book_vendors from anon;
revoke all on public.weekly_parent_feedback from anon;
revoke all on public.consultations from anon;
revoke all on public.app_users from anon;
revoke all on function public.current_app_role() from public, anon;
revoke all on function public.get_learning_students() from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.academy_classes to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.learning_records to authenticated;
grant select, insert, update, delete on public.book_vendors to authenticated;
grant select, insert, update, delete on public.weekly_parent_feedback to authenticated;
grant select, insert, update, delete on public.consultations to authenticated;
grant select, insert, update, delete on public.app_users to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.get_learning_students() to authenticated;
