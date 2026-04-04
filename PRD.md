# PRD — 업무자동화 진단 4단계 워크시트

## 1. 개요

수강생이 4단계(발견→정의→분해→전환)를 따라가며 자신의 업무를 분석하고, AI에게 전달할 프롬프트를 완성하는 모바일 우선 웹앱.

**배포 URL**: (Vercel 배포 후 확정)
**기술 스택**: HTML/CSS/JS (프론트) + Vercel Serverless Functions (API) + Supabase (DB) + Resend (이메일)

---

## 2. 사용자 플로우

```
[시작 페이지] → [Step 1: 발견] → [Step 2: 정의] → [Step 3: 분해] → [Step 4: 전환]
     ↑                                                                    ↓
  이름/직무 입력                                              프롬프트 복사 / 다운로드
  시작하기                                                    이메일 발송 / 수정 / 새로작성
```

---

## 3. 화면별 상세

### 3.0 시작 페이지
- 타이틀: "번거로운 반복 업무, AI로 바꿔볼 수 있을까?"
- 설명: "4단계만 따라오시면 AI에게 바로 전달할 수 있는 프롬프트가 완성됩니다."
- 입력: 이름, 직무
- 버튼: "시작하기" → Step 1으로 이동
- 프로그레스바 숨김
- **(향후)** 직무 입력 시 Gemini API로 맞춤 예시 placeholder 생성

### 3.1 Step 1: 발견
- 질문 1: "번거롭게 느껴지는 업무는 무엇인가요?"
- 질문 2: "얼마나 자주, 얼마나 오래 걸리나요?"
- 질문 3: "그럼에도 이 업무가 존재하는 이유는 뭘까요?"
- 질문 간 간격: 32px (일반보다 2배)
- "← 이전" 클릭 시 시작 페이지로 복귀 (이름/직무 유지)

### 3.2 Step 2: 정의
- Input → AI → Output 시각적 다이어그램
- SVG 화살표로 흐름 표현
- 모바일에서는 세로 배치 + 아래쪽 화살표
- Input/Output 값은 Step 3과 양방향 동기화

### 3.3 Step 3: 분해
- 1단계(Input)와 마지막 단계(Output)는 Step 2와 동기화, 색상 구분 (파란/초록)
- 중간 단계 자유 추가/삭제
- "+ 단계 추가" 버튼은 Input과 Output 사이에 배치
- 단계 사이 ↓ 화살표
- 병목 표시 기능 + 사유 입력
- 첫/마지막 단계는 삭제 불가

### 3.4 Step 4: 전환
- 1~3단계 내용으로 프롬프트 자동 생성
- 프롬프트 템플릿:
  ```
  나는 다음의 번거롭고 반복적인 업무를 AI로 개선하고 싶어.
  ■ 번거로운 업무: {taskName}
  ■ 빈도/소요 시간: {taskFreq}
  ■ 이 업무가 존재하는 이유: {taskReason}
  ■ Input: {taskInput}
  ■ Output: {taskOutput}
  ■ 업무 프로세스: {steps with bottleneck markers}
  이 업무 중 다음 지점이 병목이라고 판단했어: {bottlenecks}
  내가 제대로 짚었는지, 어떻게 하면 AI를 접목할 수 있는지 파악할 수 있도록 나를 인터뷰해줘.
  ```
- 복사 버튼 (프롬프트 영역 우상단)
- 액션 버튼: 수정하기, 다운로드, 이메일로 받기, 새로 작성
- "다음" 버튼 없음 (Step 4가 최종 화면)

### 3.5 공통 요소
- 상단 헤더: "업무자동화 진단 4단계"
- 사용자 정보 바: "홍길동 · 재경팀 회계 담당" (모든 단계 상단)
- 프로그레스바 + 라벨 (①발견 ②정의 ③분해 ④전환)
- 이전 단계 미리보기 (클릭 시 해당 단계로 이동)

---

## 4. 기능 상세

### 4.1 다운로드 (txt)
- 워크시트 전체 내용을 텍스트 파일로 다운로드
- 파일명: `업무자동화_진단_4단계_{이름}.txt`

### 4.2 이메일 발송 (배포 후)
- 모달: 이메일 입력 → 발송 버튼
- API route: `/api/send-email`
- 발송 서비스: Resend
- 수신자: 사용자 이메일 + jinbaek@woka.kr (강사 사본)
- 보안: 이메일 주소는 프론트엔드에 저장하지 않음, 모달 닫힐 때 즉시 초기화

### 4.3 DB 저장 (배포 후)
- 저장 시점: Step 3 → Step 4 전환 시
- API route: `/api/save`
- DB: Supabase (PostgreSQL)
- 스키마:
  ```sql
  CREATE TABLE worksheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    role TEXT,
    task_name TEXT,
    task_freq TEXT,
    task_reason TEXT,
    task_input TEXT,
    task_output TEXT,
    steps JSONB,          -- [{text, isBottleneck, reason, linkedInput, linkedOutput}]
    prompt TEXT,
    actions TEXT[],        -- ['copy_prompt', 'download', 'email', ...]
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- 액션 추적: 복사/다운로드/이메일/수정/새로작성 버튼 클릭 시 `actions` 배열 업데이트

### 4.4 사용자 액션 추적
- 프론트엔드 `userActions` 배열에 기록
- 추적 대상: `copy_prompt`, `download`, `email`, `edit`, `reset`
- 배포 후 DB에 함께 저장

---

## 5. 기술 아키텍처

```
[브라우저]
  ├── index.html (프론트엔드 전체)
  │
[Vercel]
  ├── /api/save          → Supabase INSERT/UPDATE
  ├── /api/send-email    → Resend API 호출
  └── /api/generate-examples → Gemini API (향후)
  │
[외부 서비스]
  ├── Supabase (PostgreSQL)  — 무료 티어
  ├── Resend (이메일)        — 무료 티어 (월 3,000건)
  └── Gemini API (향후)      — 무료 티어
```

---

## 6. 보안 요구사항

| 항목 | 대응 |
|------|------|
| API 키 노출 방지 | 모든 외부 API 호출은 Vercel API route (서버사이드)에서 수행 |
| 이메일 보호 | 프론트엔드에 저장/캐시 없음, 모달 닫힐 때 즉시 초기화 |
| DB 접근 제한 | Supabase Row Level Security + 서버사이드 접근만 허용 |
| HTTPS | Vercel 기본 제공 |
| 입력값 검증 | API route에서 sanitize 처리 |

---

## 7. 배포 계획

### Phase 1: 프론트엔드 (현재 완료)
- [x] 4단계 워크시트 UI
- [x] 프롬프트 자동 생성
- [x] 다운로드 기능
- [x] 이메일 모달 UI (발송 미연동)
- [x] 액션 추적 구조

### Phase 2: 배포 + 백엔드
- [ ] Vercel 프로젝트 생성 + 배포
- [ ] Supabase 프로젝트 + 테이블 생성
- [ ] `/api/save` 구현 (워크시트 저장)
- [ ] `/api/send-email` 구현 (Resend 연동)
- [ ] 이메일 모달 실제 발송 연결

### Phase 3: 고도화
- [ ] Gemini API 연동 (직무 맞춤 예시)
- [ ] 관리자 대시보드 (수강생 데이터 열람/분석)
- [ ] 고객사별 커스터마이징
