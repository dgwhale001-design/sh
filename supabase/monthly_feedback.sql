-- 월간 학부모 피드백: 관리자와 승인된 강사가 함께 작성·열람합니다.

create table if not exists public.monthly_parent_feedback (
  id text primary key,
  student_id bigint not null references public.students(id) on delete cascade,
  report_month text not null check (report_month ~ '^\d{4}-\d{2}$'),
  teacher text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, report_month)
);

create index if not exists monthly_parent_feedback_student_month_idx
  on public.monthly_parent_feedback (student_id, report_month desc);

alter table public.monthly_parent_feedback enable row level security;

drop policy if exists "shared monthly parent feedback" on public.monthly_parent_feedback;

create policy "shared monthly parent feedback" on public.monthly_parent_feedback
  for all to authenticated
  using (public.current_app_role() in ('admin', 'teacher'))
  with check (public.current_app_role() in ('admin', 'teacher'));

revoke all on public.monthly_parent_feedback from anon;
grant select, insert, update, delete on public.monthly_parent_feedback to authenticated;
