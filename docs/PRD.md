# 챌린지 달성 관리 서비스 PRD

## 1. 제품 개요

### 1.1 목적

- 사용자들이 개인적인 챌린지를 설정하고 일일 달성 여부를 관리할 수 있는 웹 서비스
- 모임 단위로 챌린지를 공유하고 서로 격려하며 동기부여를 제공하는 플랫폼

### 1.2 주요 기능

- 모임 생성 및 관리
- 개인별 챌린지 설정
- 일일 챌린지 달성 기록
- 게시글 기반 챌린지 검증
- 커뮤니티 상호작용
- 달성률 통계 및 시각화

## 2. 기능 상세

### 2.1 모임 관리

- 모임 생성/수정/삭제
- 모임 멤버 초대 및 관리
- 모임별 챌린지 템플릿 제공
- 모임별 게시판 관리

### 2.2 챌린지 관리

- 개인별 챌린지 설정
  - 템플릿 선택 또는 커스텀 챌린지 생성
  - 챌린지 목표 설정
  - 챌린지 기간 설정
- 챌린지 카테고리
  - 운동
  - 학습
  - 건강
  - 기타 (사용자 정의)

### 2.3 게시글 시스템

- 게시글 작성
  - 텍스트 입력
  - 이미지 업로드
  - 챌린지 태그
- 게시글 검증
  - 기본적으로 게시글 작성 시 챌린지 달성도는 1.0으로 설정
  - 모임 멤버들이 게시글을 보고 부족하다고 판단할 경우 표시 가능
  - 부족 표시 시 달성도 조정: (1.0 / 모임 인원)을 반올림한 값으로 조정
  - 예시: 모임 인원이 5명일 경우, 부족 표시 시 달성도는 0.2로 조정
- 게시글 상호작용
  - 댓글 작성
  - 공감 표시
  - 부족 표시

### 2.4 달력 및 통계

- 월별 달력 뷰
  - 챌린지 달성 상태 표시
  - 일별 게시글 목록 조회
- 통계 대시보드
  - 개인별 월간 달성률
  - 모임별 평균 달성률
  - 챌린지별 달성률

## 3. 기술 스택

### 3.1 프론트엔드

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Clerk (인증)

### 3.2 백엔드

- Next.js API Routes
- Drizzle ORM
- PostgreSQL

### 3.3 스토리지

- AWS S3 (이미지 저장)
- Cloudinary (이미지 최적화)

## 4. 데이터베이스 스키마

### 4.1 주요 테이블

```typescript
// 모임
interface IGroup {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
}

// 사용자-모임 관계
interface IGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: Date;
}

// 챌린지
interface IChallenge {
  id: string;
  userId: string;
  groupId: string;
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// 게시글
interface IPost {
  id: string;
  userId: string;
  groupId: string;
  challengeId: string;
  content: string;
  imageUrl?: string;
  achievement: number; // 1.0 또는 (1.0 / 모임 인원) 반올림 값
  createdAt: Date;
}

// 게시글 부족 표시
interface IInsufficientMark {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

// 댓글
interface IComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// 공감
interface ILike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}
```

## 5. API 엔드포인트

### 5.1 모임 관련

- `POST /api/groups` - 모임 생성
- `GET /api/groups` - 모임 목록 조회
- `GET /api/groups/:id` - 모임 상세 조회
- `POST /api/groups/:id/members` - 모임 멤버 추가
- `DELETE /api/groups/:id/members/:userId` - 모임 멤버 제거

### 5.2 챌린지 관련

- `POST /api/challenges` - 챌린지 생성
- `GET /api/challenges` - 챌린지 목록 조회
- `GET /api/challenges/:id` - 챌린지 상세 조회
- `PUT /api/challenges/:id` - 챌린지 수정
- `DELETE /api/challenges/:id` - 챌린지 삭제

### 5.3 게시글 관련

- `POST /api/posts` - 게시글 작성
- `GET /api/posts` - 게시글 목록 조회
- `GET /api/posts/:id` - 게시글 상세 조회
- `POST /api/posts/:id/insufficient` - 게시글 부족 표시
- `DELETE /api/posts/:id/insufficient` - 게시글 부족 표시 취소
- `POST /api/posts/:id/comments` - 댓글 작성
- `POST /api/posts/:id/likes` - 공감 표시

### 5.4 통계 관련

- `GET /api/stats/monthly` - 월간 통계 조회
- `GET /api/stats/group/:groupId` - 모임별 통계 조회
- `GET /api/stats/user/:userId` - 사용자별 통계 조회

## 6. UI/UX 요구사항

### 6.1 주요 페이지

- 로그인/회원가입 페이지
- 모임 목록/생성 페이지
- 모임 상세 페이지
  - 달력 뷰
  - 게시판 뷰
  - 통계 뷰
- 챌린지 설정 페이지
- 게시글 작성/상세 페이지

### 6.2 반응형 디자인

- 모바일 최적화
- 태블릿 지원
- 데스크톱 지원

## 7. 보안 요구사항

### 7.1 인증/인가

- Clerk을 통한 사용자 인증
- 모임별 권한 관리
- API 엔드포인트 보안

### 7.2 데이터 보호

- 이미지 업로드 제한
- 부적절한 콘텐츠 필터링
- 개인정보 보호

## 8. 성능 요구사항

### 8.1 로딩 시간

- 초기 페이지 로딩: 2초 이내
- 이미지 로딩: 3초 이내
- API 응답: 1초 이내

### 8.2 동시 접속자

- 최대 1000명 동시 접속 지원
- API 요청 제한: 분당 100회

## 9. 향후 확장 계획

### 9.1 추가 기능

- 챌린지 알림 시스템
- 챌린지 성공률 예측
- 모임 간 챌린지 대결
- 챌린지 인증서 발급

### 9.2 플랫폼 확장

- 모바일 앱 개발
- API 공개
- 타 서비스 연동
