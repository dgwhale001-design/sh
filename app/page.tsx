'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CalendarCheck2, Check, ChevronRight, Clock3, GraduationCap, LayoutDashboard, Menu, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type View = 'dashboard' | 'attendance' | 'students' | 'learning';
type AttendanceStatus = '출석' | '지각' | '결석' | '미확인';
type Student = { id: number; name: string; grade: number; className: string; subjects: string; status: '재원' };
type LearningRecord = { id: string; studentId: number; date: string; progress: string; homework: string; level: string; memo: string };

const students: Student[] = [
  [1, '김하늘', 1, '씨앗 A'], [2, '이도윤', 1, '씨앗 A'], [3, '박서준', 1, '씨앗 B'],
  [4, '최윤아', 2, '새싹 A'], [5, '정서연', 2, '새싹 A'], [6, '한지우', 2, '새싹 B'],
  [7, '윤민준', 3, '도약 A'], [8, '오예린', 3, '도약 A'], [9, '임시우', 3, '도약 B'], [10, '조아린', 3, '도약 B'],
  [11, '강현우', 4, '성장 A'], [12, '송지민', 4, '성장 A'], [13, '배준호', 4, '성장 B'], [14, '신유나', 4, '성장 B'],
  [15, '홍도현', 5, '열매 A'], [16, '권채원', 5, '열매 A'], [17, '문지호', 5, '열매 B'],
  [18, '백서윤', 6, '완성 A'], [19, '남태윤', 6, '완성 A'], [20, '유가은', 6, '완성 B'],
].map(([id, name, grade, className]) => ({ id: id as number, name: name as string, grade: grade as number, className: className as string, subjects: '영어·수학', status: '재원' }));

const defaultAttendance = Object.fromEntries(students.map((student) => [student.id, student.id === 5 ? '결석' : student.id === 9 ? '지각' : student.id === 20 ? '미확인' : '출석'])) as Record<number, AttendanceStatus>;
const defaultRecords: LearningRecord[] = [
  { id: 'r1', studentId: 1, date: '2026-08-30', progress: '파닉스 장모음 복습', homework: '워크북 18~19쪽', level: '좋음', memo: '소리와 철자 연결이 안정적입니다.' },
  { id: 'r2', studentId: 7, date: '2026-08-30', progress: '분수의 덧셈', homework: '연산 12문제', level: '보통', memo: '통분 과정을 한 번 더 확인하도록 지도했습니다.' },
  { id: 'r3', studentId: 18, date: '2026-08-29', progress: '중등 문법 예비 과정', homework: '오답 5문제 재풀이', level: '매우 좋음', memo: '문장 구조 설명이 정확했습니다.' },
];

const navItems = [
  { id: 'dashboard' as View, label: '오늘의 운영', icon: LayoutDashboard },
  { id: 'attendance' as View, label: '출결 관리', icon: CalendarCheck2 },
  { id: 'students' as View, label: '학생 관리', icon: Users },
  { id: 'learning' as View, label: '학습 기록', icon: BookOpenCheck },
];

const pageTitle: Record<View, [string, string]> = {
  dashboard: ['오늘의 운영', '출결과 기록 누락을 한눈에 확인하세요.'],
  attendance: ['출결 관리', '학생별 출결 상태를 선택하고 저장하세요.'],
  students: ['학생 관리', '첨부 명단 20명의 정보와 최근 기록을 확인하세요.'],
  learning: ['학습 기록', '수업 진도와 과제를 학생별로 남기세요.'],
};

const statusClasses: Record<AttendanceStatus, string> = {
  출석: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  지각: 'border-amber-200 bg-amber-50 text-amber-700',
  결석: 'border-rose-200 bg-rose-50 text-rose-700',
  미확인: 'border-slate-200 bg-slate-50 text-slate-600',
};

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [attendance, setAttendance] = useState(defaultAttendance);
  const [records, setRecords] = useState(defaultRecords);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('전체');
  const [classFilter, setClassFilter] = useState('전체');
  const [selectedStudentId, setSelectedStudentId] = useState(1);
  const [message, setMessage] = useState('');
  const [recordForm, setRecordForm] = useState({ studentId: '1', progress: '', homework: '', level: '좋음', memo: '' });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('eden-admin-mvp-v1');
      if (saved) {
        const parsed = JSON.parse(saved) as { attendance?: Record<number, AttendanceStatus>; records?: LearningRecord[] };
        if (parsed.attendance) setAttendance(parsed.attendance);
        if (parsed.records) setRecords(parsed.records);
      }
    } catch {
      // 기본 명단으로 정상 시작합니다.
    } finally { setReady(true); }
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem('eden-admin-mvp-v1', JSON.stringify({ attendance, records }));
  }, [attendance, records, ready]);

  const summary = useMemo(() => (['출석', '지각', '결석', '미확인'] as AttendanceStatus[]).reduce((result, status) => ({ ...result, [status]: Object.values(attendance).filter((value) => value === status).length }), {} as Record<AttendanceStatus, number>), [attendance]);
  const uniqueClasses = Array.from(new Set(students.map((student) => student.className)));
  const filteredStudents = useMemo(() => students.filter((student) => (!query.trim() || student.name.includes(query.trim()) || student.className.includes(query.trim())) && (gradeFilter === '전체' || String(student.grade) === gradeFilter) && (classFilter === '전체' || student.className === classFilter)), [query, gradeFilter, classFilter]);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const selectedRecords = records.filter((record) => record.studentId === selectedStudent.id);

  const flash = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 4000); };
  const writeForStudent = (studentId: number) => { setRecordForm((form) => ({ ...form, studentId: String(studentId) })); setView('learning'); };

  function submitRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recordForm.progress.trim()) return flash('학습 진도를 입력해주세요.');
    const studentId = Number(recordForm.studentId);
    setRecords((current) => [{ id: `r-${Date.now()}`, studentId, date: '2026-08-30', progress: recordForm.progress.trim(), homework: recordForm.homework.trim() || '과제 없음', level: recordForm.level, memo: recordForm.memo.trim() || '특이사항 없음' }, ...current]);
    setSelectedStudentId(studentId);
    setRecordForm((form) => ({ ...form, progress: '', homework: '', memo: '' }));
    flash(`${students.find((student) => student.id === studentId)?.name} 학생의 학습 기록을 저장했습니다.`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-4 py-4 lg:block lg:p-5">
          <div className="h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-[#003f73] ring-1 ring-white/15 lg:h-24 lg:w-full">
            <img src="/brand-logo.png" alt="고래영어 이든수학" className="h-full w-full scale-[1.32] object-cover object-[center_47%]" />
          </div>
          <div className="min-w-0 lg:mt-4"><p className="truncate text-sm font-semibold text-white lg:text-base">고래영어 · 이든수학</p><p className="mt-1 text-xs text-blue-100/75">MVP 학생 관리</p></div>
          <Menu className="ml-auto size-5 text-blue-100 lg:hidden" aria-hidden="true" />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:grid lg:px-3" aria-label="주요 메뉴">
          {navItems.map((item) => { const Icon = item.icon; const active = view === item.id; return <Button key={item.id} variant="ghost" onClick={() => setView(item.id)} className={`h-10 shrink-0 justify-start gap-2.5 px-3 lg:w-full ${active ? 'bg-white/14 text-white hover:bg-white/18 hover:text-white' : 'text-blue-100/75 hover:bg-white/8 hover:text-white'}`}><Icon className="size-4" />{item.label}</Button>; })}
        </nav>
        <div className="hidden lg:absolute lg:bottom-0 lg:block lg:w-full lg:px-5 lg:pb-5"><div className="border-t border-white/12 pt-4 text-xs text-blue-100/65"><p>가상 명단 20명</p><p className="mt-1">입력 내용은 이 기기에 저장됩니다.</p></div></div>
      </aside>

      <main className="min-w-0">
        <header className="border-b bg-card/95 px-4 py-5 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4"><div className="mr-auto"><h1 className="text-xl font-semibold sm:text-2xl">{pageTitle[view][0]}</h1><p className="mt-1 text-sm text-muted-foreground">{pageTitle[view][1]}</p></div><Badge variant="outline" className="h-7 gap-1.5 px-3 text-muted-foreground"><Clock3 className="size-3.5" />2026년 8월 30일</Badge></div></header>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {message && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="size-4" />{message}</div>}
          {view === 'dashboard' && <Dashboard summary={summary} records={records} onNavigate={setView} />}

          {view === 'attendance' && <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">{(['출석', '지각', '결석', '미확인'] as AttendanceStatus[]).map((status) => <Card key={status} size="sm" className="shadow-none"><CardHeader><CardDescription>{status}</CardDescription><CardTitle className="text-2xl tabular-nums">{summary[status]}명</CardTitle></CardHeader></Card>)}</div>
            <Card className="shadow-none"><CardHeader className="border-b"><CardTitle>전체 학생 출결</CardTitle><CardDescription>상태를 선택한 뒤 저장을 완료해주세요.</CardDescription><CardAction><Button onClick={() => flash(`출결 저장 완료 · 출석 ${summary.출석}명, 지각 ${summary.지각}명, 결석 ${summary.결석}명`)}>출결 저장</Button></CardAction></CardHeader><CardContent className="pt-1"><div className="divide-y">{students.map((student) => <div key={student.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(180px,1fr)_auto] sm:items-center"><button type="button" onClick={() => { setSelectedStudentId(student.id); setView('students'); }} className="flex items-center gap-3 text-left"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold">{student.name.slice(-1)}</span><span><strong className="block text-sm">{String(student.id).padStart(2, '0')} {student.name}</strong><span className="text-xs text-muted-foreground">초등 {student.grade} · {student.className}</span></span></button><div className="grid grid-cols-4 gap-1.5">{(['출석', '지각', '결석', '미확인'] as AttendanceStatus[]).map((status) => <Button key={status} size="sm" variant="outline" aria-pressed={attendance[student.id] === status} onClick={() => { setAttendance((current) => ({ ...current, [student.id]: status })); setMessage(''); }} className={attendance[student.id] === status ? statusClasses[status] : 'text-muted-foreground'}>{status}</Button>)}</div></div>)}</div></CardContent></Card>
          </section>}

          {view === 'students' && <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row"><label className="relative block flex-1"><span className="sr-only">학생 검색</span><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 반 검색" className="h-10 pl-9" /></label><NativeSelect value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} className="w-full sm:w-32"><NativeSelectOption value="전체">전체 학년</NativeSelectOption>{[1,2,3,4,5,6].map((grade) => <NativeSelectOption key={grade} value={grade}>초등 {grade}</NativeSelectOption>)}</NativeSelect><NativeSelect value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="w-full sm:w-36"><NativeSelectOption value="전체">전체 반</NativeSelectOption>{uniqueClasses.map((name) => <NativeSelectOption key={name} value={name}>{name}</NativeSelectOption>)}</NativeSelect></div>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]"><Card className="shadow-none"><CardHeader className="border-b"><CardTitle>학생 명단</CardTitle><CardDescription>{filteredStudents.length}명 표시 중</CardDescription></CardHeader><CardContent className="px-2 pt-1 sm:px-4"><Table><TableHeader><TableRow><TableHead>학생</TableHead><TableHead>학년·반</TableHead><TableHead>오늘 출결</TableHead><TableHead className="text-right">기록</TableHead></TableRow></TableHeader><TableBody>{filteredStudents.map((student) => <TableRow key={student.id} data-state={selectedStudentId === student.id ? 'selected' : undefined} className="cursor-pointer" onClick={() => setSelectedStudentId(student.id)}><TableCell><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold">{student.name.slice(-1)}</span><strong>{student.name}</strong></div></TableCell><TableCell>초등 {student.grade}<span className="block text-xs text-muted-foreground">{student.className}</span></TableCell><TableCell><Badge variant="outline" className={statusClasses[attendance[student.id]]}>{attendance[student.id]}</Badge></TableCell><TableCell className="text-right">{records.filter((record) => record.studentId === student.id).length}건</TableCell></TableRow>)}</TableBody></Table>{filteredStudents.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 학생이 없습니다.</p>}</CardContent></Card><StudentDetail student={selectedStudent} attendance={attendance[selectedStudent.id]} records={selectedRecords} onWrite={() => writeForStudent(selectedStudent.id)} /></div>
          </section>}

          {view === 'learning' && <section className="grid items-start gap-5 xl:grid-cols-[minmax(360px,.85fr)_minmax(0,1.15fr)]">
            <Card className="shadow-none"><CardHeader className="border-b"><CardTitle>학습 기록 작성</CardTitle><CardDescription>진도와 과제를 학생 이력에 남깁니다.</CardDescription></CardHeader><CardContent><form onSubmit={submitRecord} className="space-y-4 pt-4"><Field label="학생"><NativeSelect value={recordForm.studentId} onChange={(event) => setRecordForm((form) => ({ ...form, studentId: event.target.value }))} className="w-full">{students.map((student) => <NativeSelectOption key={student.id} value={student.id}>{student.name} · 초{student.grade} {student.className}</NativeSelectOption>)}</NativeSelect></Field><Field label="학습 진도"><Input value={recordForm.progress} onChange={(event) => setRecordForm((form) => ({ ...form, progress: event.target.value }))} placeholder="예: 분수의 덧셈 2단원" /></Field><Field label="과제"><Input value={recordForm.homework} onChange={(event) => setRecordForm((form) => ({ ...form, homework: event.target.value }))} placeholder="예: 연산 12문제" /></Field><Field label="이해도"><NativeSelect value={recordForm.level} onChange={(event) => setRecordForm((form) => ({ ...form, level: event.target.value }))} className="w-full">{['매우 좋음','좋음','보통','보완 필요'].map((level) => <NativeSelectOption key={level} value={level}>{level}</NativeSelectOption>)}</NativeSelect></Field><Field label="강사 메모"><Textarea value={recordForm.memo} onChange={(event) => setRecordForm((form) => ({ ...form, memo: event.target.value }))} placeholder="잘한 점과 보완할 점을 적어주세요." className="min-h-24" /></Field><Button type="submit" size="lg" className="w-full">학습 기록 저장</Button></form></CardContent></Card>
            <Card className="shadow-none"><CardHeader className="border-b"><CardTitle>최근 학습 기록</CardTitle><CardDescription>최신 기록부터 표시됩니다.</CardDescription></CardHeader><CardContent><div className="divide-y">{records.map((record) => { const student = students.find((item) => item.id === record.studentId)!; return <button key={record.id} type="button" onClick={() => { setSelectedStudentId(student.id); setView('students'); }} className="flex w-full items-start gap-3 py-4 text-left"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold">{student.name.slice(-1)}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong>{student.name}</strong><Badge variant="secondary">{record.level}</Badge><span className="text-xs text-muted-foreground">{record.date}</span></span><span className="mt-1 block text-sm">{record.progress}</span><span className="mt-1 block text-xs text-muted-foreground">과제: {record.homework} · {record.memo}</span></span><ChevronRight className="mt-2 size-4 text-muted-foreground" /></button>; })}</div></CardContent></Card>
          </section>}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ summary, records, onNavigate }: { summary: Record<AttendanceStatus, number>; records: LearningRecord[]; onNavigate: (view: View) => void }) {
  const classes = Array.from(new Set(students.map((student) => student.className))).map((className) => { const members = students.filter((student) => student.className === className); return { className, grade: members[0].grade, count: members.length }; });
  const metrics = [
    { label: '재원 학생', value: '20명', detail: '초등 1~6학년', icon: Users },
    { label: '오늘 출석', value: `${summary.출석}명`, detail: `지각 ${summary.지각} · 결석 ${summary.결석}`, icon: CalendarCheck2 },
    { label: '학습 기록', value: `${records.length}건`, detail: '최근 저장 기록', icon: BookOpenCheck },
  ];
  return <section className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{metrics.map((metric) => { const Icon = metric.icon; return <Card key={metric.label} className="shadow-none"><CardHeader><CardDescription>{metric.label}</CardDescription><CardAction><span className="grid size-9 place-items-center rounded-lg bg-accent text-primary"><Icon className="size-4" /></span></CardAction><CardTitle className="text-3xl">{metric.value}</CardTitle><p className="text-xs text-muted-foreground">{metric.detail}</p></CardHeader></Card>; })}</div><div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]"><Card className="shadow-none"><CardHeader className="border-b"><CardTitle>반별 현황</CardTitle><CardDescription>12개 반 · 영어·수학 통합 운영</CardDescription><CardAction><Button variant="outline" onClick={() => onNavigate('students')}>전체 학생</Button></CardAction></CardHeader><CardContent className="px-2 sm:px-4"><Table><TableHeader><TableRow><TableHead>반</TableHead><TableHead>학년</TableHead><TableHead>학생</TableHead><TableHead className="text-right">과목</TableHead></TableRow></TableHeader><TableBody>{classes.map((item) => <TableRow key={item.className}><TableCell><strong>{item.className}</strong></TableCell><TableCell>초등 {item.grade}</TableCell><TableCell>{item.count}명</TableCell><TableCell className="text-right text-muted-foreground">영어·수학</TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Card className="shadow-none"><CardHeader className="border-b"><CardTitle>지금 처리할 일</CardTitle><CardDescription>누락 가능성이 높은 업무입니다.</CardDescription></CardHeader><CardContent><Task icon={CalendarCheck2} title="출결 미확인" detail="유가은 학생" count={summary.미확인} onClick={() => onNavigate('attendance')} /><Task icon={BookOpenCheck} title="학습 기록 추가" detail="오늘 수업 진도 입력" count={4} onClick={() => onNavigate('learning')} /><Task icon={GraduationCap} title="학생 정보 확인" detail="가상 명단 등록 완료" count={20} onClick={() => onNavigate('students')} /></CardContent></Card></div></section>;
}

function Task({ icon: Icon, title, detail, count, onClick }: { icon: typeof CalendarCheck2; title: string; detail: string; count: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b py-4 text-left last:border-0"><span className="grid size-9 place-items-center rounded-lg bg-accent text-primary"><Icon className="size-4" /></span><span className="flex-1"><strong className="block text-sm">{title}</strong><span className="text-xs text-muted-foreground">{detail}</span></span><Badge variant="secondary">{count}</Badge><ChevronRight className="size-4 text-muted-foreground" /></button>;
}

function StudentDetail({ student, attendance, records, onWrite }: { student: Student; attendance: AttendanceStatus; records: LearningRecord[]; onWrite: () => void }) {
  return <Card className="shadow-none xl:sticky xl:top-6"><CardHeader className="border-b"><div className="mb-2 grid size-12 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{student.name.slice(-1)}</div><CardTitle className="text-xl">{student.name}</CardTitle><CardDescription>초등 {student.grade}학년 · {student.className} · {student.subjects}</CardDescription><CardAction><Badge variant="outline" className={statusClasses[attendance]}>{attendance}</Badge></CardAction></CardHeader><CardContent><div className="grid grid-cols-3 gap-2 py-4"><Mini value={`${records.length}`} label="학습 기록" /><Mini value={attendance} label="오늘 출결" /><Mini value="재원" label="등록 상태" /></div><div className="border-t pt-4"><div className="mb-3 flex items-center justify-between"><strong className="text-sm">최근 기록</strong><Button size="sm" onClick={onWrite}>기록 작성</Button></div>{records.length ? records.slice(0,3).map((record) => <div key={record.id} className="mb-3 border-l-2 border-primary/35 pl-3"><div className="flex items-center gap-2"><strong className="text-sm">{record.progress}</strong><Badge variant="secondary">{record.level}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{record.date} · {record.memo}</p></div>) : <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">아직 저장된 학습 기록이 없습니다.</p>}</div></CardContent></Card>;
}

function Mini({ value, label }: { value: string; label: string }) { return <div className="rounded-lg bg-muted p-3 text-center"><strong className="block text-base">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>; }
