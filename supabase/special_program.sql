-- 예비고1 영어·수학 12주 특강 통합 학습관리
-- Supabase SQL Editor에서 schema.sql 실행 후 이 파일을 실행할 수 있습니다.

alter table public.app_users
  add column if not exists subject text not null default '영어·수학'
  check (subject in ('영어', '수학', '영어·수학'));

create or replace function public.current_app_subject()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select subject
  from public.app_users
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and active = true
  limit 1
$$;

create table if not exists public.special_programs (
  id text primary key,
  name text not null,
  start_date date not null,
  total_weeks integer not null default 12 check (total_weeks between 1 and 24),
  hours_per_subject numeric(4,1) not null default 5 check (hours_per_subject > 0),
  warning_threshold numeric(2,1) not null default 3 check (warning_threshold between 1 and 5),
  danger_threshold numeric(2,1) not null default 2 check (danger_threshold between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.special_programs
  (id, name, start_date, total_weeks, hours_per_subject, warning_threshold, danger_threshold)
values
  ('prehigh-2026', '예비고1 영어·수학 12주 특강', '2026-11-16', 12, 5, 3, 2)
on conflict (id) do nothing;

create table if not exists public.special_enrollments (
  program_id text not null references public.special_programs(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  subjects text not null check (subjects in ('영어', '수학', '영어·수학')),
  english_teacher text not null default '',
  math_teacher text not null default '',
  initial_level text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (program_id, student_id)
);

create table if not exists public.special_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.special_programs(id) on delete cascade,
  subject text not null check (subject in ('영어', '수학')),
  session_date date not null,
  week_no integer not null check (week_no between 1 and 24),
  session_no integer not null check (session_no between 1 and 60),
  teacher text not null,
  material_progress text not null,
  goal text not null default '',
  content text not null default '',
  homework text not null default '',
  test_info text not null default '',
  status text not null default '정상' check (status in ('정상', '일정 변경', '보강', '취소')),
  created_by text not null default coalesce(auth.jwt() ->> 'email', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, subject, session_date, session_no)
);

create table if not exists public.special_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.special_sessions(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  attendance text not null check (attendance in ('출석', '지각', '결석', '공결', '보강')),
  homework_status text not null check (homework_status in ('완료', '부분 완료', '미완료', '미제출', '면제')),
  progress_override text not null default '',
  homework_override text not null default '',
  achievement integer not null check (achievement between 1 and 5),
  focus integer not null check (focus between 1 and 5),
  test_status text not null default '미실시' check (test_status in ('응시', '미실시', '결시', '재시험 예정')),
  test_name text not null default '',
  test_score numeric(7,2),
  test_max numeric(7,2),
  memo text not null default '',
  created_by text not null default coalesce(auth.jwt() ->> 'email', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id),
  check (
    (test_status = '응시' and test_score is not null and test_max is not null and test_max > 0 and test_score >= 0)
    or
    (test_status <> '응시' and test_score is null)
  )
);

alter table public.special_evaluations add column if not exists progress_override text not null default '';
alter table public.special_evaluations add column if not exists homework_override text not null default '';

create table if not exists public.special_clinics (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.special_programs(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  subject text not null check (subject in ('영어', '수학')),
  created_date date not null default current_date,
  session_id uuid references public.special_sessions(id) on delete set null,
  area text not null,
  cause text not null default '',
  plan text not null default '',
  teacher text not null,
  planned_date date,
  completed_date date,
  retest_result text not null default '',
  feedback text not null default '',
  status text not null default '필요' check (status in ('필요', '예정', '진행 중', '완료', '재지도 필요')),
  created_by text not null default coalesce(auth.jwt() ->> 'email', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_reports (
  id uuid primary key default gen_random_uuid(),
  student_id bigint not null references public.students(id) on delete cascade,
  report_type text not null check (report_type in ('주간', '4주 종합', '12주 최종')),
  subject text not null check (subject in ('통합', '영어', '수학')),
  period_label text not null,
  teacher text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default '초안' check (status in ('초안', '승인', '전달 완료')),
  approved_at timestamptz,
  approved_by text not null default '',
  delivered_at timestamptz,
  created_by text not null default coalesce(auth.jwt() ->> 'email', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_email text not null default coalesce(auth.jwt() ->> 'email', ''),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists special_sessions_program_date_idx on public.special_sessions(program_id, session_date desc);
create index if not exists special_enrollments_student_idx on public.special_enrollments(student_id);
create index if not exists special_evaluations_student_idx on public.special_evaluations(student_id);
create index if not exists special_clinics_student_status_idx on public.special_clinics(student_id, status);
create index if not exists special_reports_student_created_idx on public.special_reports(student_id, created_at desc);

create or replace function public.audit_special_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.special_audit_log(table_name, record_id, action, old_data, new_data)
  values (
    tg_table_name,
    coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'), (to_jsonb(new) ->> 'student_id'), (to_jsonb(old) ->> 'student_id'), ''),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_special_sessions on public.special_sessions;
create trigger audit_special_sessions after insert or update or delete on public.special_sessions
for each row execute function public.audit_special_change();
drop trigger if exists audit_special_enrollments on public.special_enrollments;
create trigger audit_special_enrollments after insert or update or delete on public.special_enrollments
for each row execute function public.audit_special_change();
drop trigger if exists audit_special_evaluations on public.special_evaluations;
create trigger audit_special_evaluations after insert or update or delete on public.special_evaluations
for each row execute function public.audit_special_change();
drop trigger if exists audit_special_clinics on public.special_clinics;
create trigger audit_special_clinics after insert or update or delete on public.special_clinics
for each row execute function public.audit_special_change();
drop trigger if exists audit_special_reports on public.special_reports;
create trigger audit_special_reports after insert or update or delete on public.special_reports
for each row execute function public.audit_special_change();

alter table public.special_programs enable row level security;
alter table public.special_enrollments enable row level security;
alter table public.special_sessions enable row level security;
alter table public.special_evaluations enable row level security;
alter table public.special_clinics enable row level security;
alter table public.special_reports enable row level security;
alter table public.special_audit_log enable row level security;

drop policy if exists "special programs read" on public.special_programs;
create policy "special programs read" on public.special_programs for select to authenticated
using (public.current_app_role() in ('admin', 'teacher'));
drop policy if exists "special programs admin write" on public.special_programs;
create policy "special programs admin write" on public.special_programs for all to authenticated
using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

drop policy if exists "special enrollments read" on public.special_enrollments;
create policy "special enrollments read" on public.special_enrollments for select to authenticated
using (
  public.current_app_role() = 'admin'
  or (
    public.current_app_role() = 'teacher'
    and (
      public.current_app_subject() = '영어·수학'
      or subjects = public.current_app_subject()
      or subjects = '영어·수학'
    )
  )
);
drop policy if exists "special enrollments admin write" on public.special_enrollments;
create policy "special enrollments admin write" on public.special_enrollments for all to authenticated
using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

drop policy if exists "special sessions shared" on public.special_sessions;
create policy "special sessions shared" on public.special_sessions for all to authenticated
using (
  public.current_app_role() = 'admin'
  or (
    public.current_app_role() = 'teacher'
    and (public.current_app_subject() = '영어·수학' or subject = public.current_app_subject())
  )
)
with check (
  public.current_app_role() = 'admin'
  or (
    public.current_app_role() = 'teacher'
    and (public.current_app_subject() = '영어·수학' or subject = public.current_app_subject())
  )
);
drop policy if exists "special evaluations shared" on public.special_evaluations;
create policy "special evaluations shared" on public.special_evaluations for all to authenticated
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.special_sessions session
    where session.id = session_id
      and public.current_app_role() = 'teacher'
      and (public.current_app_subject() = '영어·수학' or session.subject = public.current_app_subject())
  )
)
with check (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.special_sessions session
    where session.id = session_id
      and public.current_app_role() = 'teacher'
      and (public.current_app_subject() = '영어·수학' or session.subject = public.current_app_subject())
  )
);
drop policy if exists "special clinics shared" on public.special_clinics;
create policy "special clinics shared" on public.special_clinics for all to authenticated
using (
  public.current_app_role() = 'admin'
  or (
    public.current_app_role() = 'teacher'
    and (public.current_app_subject() = '영어·수학' or subject = public.current_app_subject())
  )
)
with check (
  public.current_app_role() = 'admin'
  or (
    public.current_app_role() = 'teacher'
    and (public.current_app_subject() = '영어·수학' or subject = public.current_app_subject())
  )
);

drop policy if exists "special reports read" on public.special_reports;
create policy "special reports read" on public.special_reports for select to authenticated
using (
  public.current_app_role() = 'admin'
  or (
    public.current_app_role() = 'teacher'
    and (
      public.current_app_subject() = '영어·수학'
      or subject = public.current_app_subject()
    )
  )
);
drop policy if exists "special reports create" on public.special_reports;
create policy "special reports create" on public.special_reports for insert to authenticated
with check (
  status = '초안'
  and (
    public.current_app_role() = 'admin'
    or (
      public.current_app_role() = 'teacher'
      and (
        public.current_app_subject() = '영어·수학'
        or subject = public.current_app_subject()
      )
    )
  )
);
drop policy if exists "special reports update" on public.special_reports;
create policy "special reports update" on public.special_reports for update to authenticated
using (public.current_app_role() = 'admin' or (public.current_app_role() = 'teacher' and status = '초안'))
with check (public.current_app_role() = 'admin' or (public.current_app_role() = 'teacher' and status = '초안'));
drop policy if exists "special reports delete" on public.special_reports;
create policy "special reports delete" on public.special_reports for delete to authenticated
using (public.current_app_role() = 'admin');
drop policy if exists "special audit admin read" on public.special_audit_log;
create policy "special audit admin read" on public.special_audit_log for select to authenticated
using (public.current_app_role() = 'admin');

revoke all on public.special_programs, public.special_enrollments, public.special_sessions, public.special_evaluations,
  public.special_clinics, public.special_reports, public.special_audit_log from anon;
grant select, insert, update, delete on public.special_programs, public.special_enrollments, public.special_sessions,
  public.special_evaluations, public.special_clinics, public.special_reports to authenticated;
grant select on public.special_audit_log to authenticated;
grant usage, select on sequence public.special_audit_log_id_seq to authenticated;
revoke all on function public.current_app_subject() from public, anon;
grant execute on function public.current_app_subject() to authenticated;
