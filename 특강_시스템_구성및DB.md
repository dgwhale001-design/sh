# 고래영어·이든수학학원 예비고1 12주 특강 시스템

## 화면 구성

기존 학원 관리 앱의 로그인·학생·강사 관리 기능을 보존하고, 왼쪽 메뉴에 예비고1 12주 특강 모듈을 추가했습니다.

1. **통합 현황**: 등록 학생, 출석률, 과제율, 평균 성취도, 미완료 클리닉과 학생별 관리 상태를 실제 저장 기록으로 계산합니다.
2. **수업·일괄 기록**: 영어·수학 공통 수업 내용을 한 번 저장한 뒤 학생별 출결·과제·성취도·집중도·테스트·메모를 표에서 일괄 입력합니다.
3. **클리닉 관리**: 부족 영역, 원인, 보충 계획, 예정일, 상태, 재확인 결과와 교사 피드백을 누적합니다.
4. **학생별 이력**: 12주 주차별 성취도와 수업·클리닉 타임라인을 학생/과목별로 조회합니다.
5. **학부모 리포트**: 주간·4주·12주 리포트를 실제 기록으로만 생성하고, 교사 수정 → 원장 승인 → PDF 저장/안내문 복사 → 전달 완료 순으로 관리합니다.
6. **특강 설정**: 시작일, 교육 주수, 과목별 시간, 주의/관리 필요 기준을 변경합니다.

모바일에서는 입력표가 가로 스크롤되고 나머지 화면은 한 열로 배치됩니다.

## 데이터 흐름

    special_programs
      └─ special_enrollments ───── students
      └─ special_sessions
           └─ special_evaluations ── students
           └─ special_clinics ────── students

    students
      └─ special_reports (초안 → 원장 승인 → 전달 완료)

    모든 변경
      └─ special_audit_log

## 주요 테이블

| 테이블 | 역할 | 핵심 제약 |
|---|---|---|
| special_programs | 특강 일정·관리 기준 | 기본 12주, 시작일 2026-11-16 |
| special_enrollments | 특강 학생·수강 과목·담당 교사·초기 진단 | 프로그램+학생 유일 |
| special_sessions | 과목별 공통 차시 내용 | 과목/날짜/차시 중복 방지 |
| special_evaluations | 학생별 차시 평가 | 차시+학생 유일, 성취도·집중도 1~5 |
| special_clinics | 취약 개념과 보충 결과 | 필요/예정/진행 중/완료/재지도 필요 |
| special_reports | 리포트 내용과 승인·전달 상태 | 교사는 초안, 원장만 승인 가능 |
| special_audit_log | 중요 기록 변경 이력 | INSERT/UPDATE/DELETE 자동 기록 |

테스트를 보지 않은 학생은 test_status가 미실시 또는 결시이고 test_score는 NULL입니다.

## 보안과 권한

- Supabase Auth 로그인 후 app_users의 admin/teacher 역할을 확인합니다.
- 모든 특강 테이블은 RLS가 활성화됩니다.
- 원장만 특강 설정을 바꾸고 리포트를 승인·삭제할 수 있습니다.
- 교사는 app_users에 지정된 담당 과목의 수업 평가·클리닉과 리포트 초안만 조회·작성할 수 있습니다.
- 익명 사용자는 모든 학생·평가·리포트 테이블 접근이 차단됩니다.
- 브라우저에는 Supabase 공개 키만 넣고 서비스 역할 키는 넣지 않습니다.

## 적용 순서

1. Supabase SQL Editor에서 supabase/schema.sql을 적용합니다.
2. 이어서 supabase/special_program.sql을 적용합니다.
3. 배포 환경에 SUPABASE_URL, SUPABASE_ANON_KEY를 설정합니다.
4. Supabase Auth에 관리자/강사 계정을 만들고 app_users에 승인 역할을 등록합니다.
5. pnpm build 후 배포합니다.

CSV 백업은 특강 화면 우측 상단의 CSV 백업에서 내려받을 수 있습니다.
