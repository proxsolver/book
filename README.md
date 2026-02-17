# 날두독서 관리 프로그램 (Nal-Du Reading)

매일 꾸준히 책을 읽는 습관을 만드는 독서 관리 앱입니다.

## 주요 기능

- 📚 **다중 책 관리**: 여러 권의 책을 동시에 관리
- 📊 **진행률 추적**: 각 책의 읽기 진행률과 목표 페이지 자동 계산
- 📅 **독서 습관 추적**: 습관 시작일부터 경과 일수 표시
- 💾 **데이터 백업**: JSON 형식으로 내보내기/가져오기
- ✨ **매일 명언**: 독서 동기를 부여하는 일일 명언 제공
- 🎯 **1000일 챌린지**: 꾸준한 독서 습관 만들기

## 설치 및 실행

### 사전 요구사항
- Node.js (v18 이상)

### 설치
```bash
npm install
```

### 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm run preview
```

### PM2로 실행 (서버 운영 시)
```bash
pm2 start ecosystem.config.cjs
```

## 사용 방법

1. **프로필 설정**: 이름과 독서 습관 시작일을 입력
2. **책 추가**: 읽을 책의 제목, 시작 페이지, 하루 읽기 페이지 수 입력
3. **진행 확인**: 각 책의 진행률과 예상 완료일 자동 계산
4. **데이터 저장**: 브라우저 로컬 스토리지에 자동 저장

## 기술 스택

- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 개발 서버
- **Lucide React** - 아이콘
- **date-fns** - 날짜 처리

## 데이터 구조

```typescript
interface Book {
  id: string;
  title: string;
  startDate: string;      // 시작일 (YYYY-MM-DD)
  startPage: number;       // 시작 페이지
  pagesPerDay: number;    // 하루 읽기 페이지 수
}

interface UserProfile {
  name: string;
  habitStartDate: string; // 독서 습관 시작일
}
```

## 라이선스

MIT
