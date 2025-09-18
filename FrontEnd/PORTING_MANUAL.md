# 어르신 안전 관리 시스템 포팅 메뉴얼

## 📋 프로젝트 개요

**프로젝트명**: 어르신 안전 관리 시스템 (SST - Senior Safety Tracking)  
**프로젝트 타입**: React + TypeScript 웹 애플리케이션  
**목적**: 어르신의 안전 상태 모니터링 및 관리  
**개발 환경**: Vite + React 19 + TypeScript + Tailwind CSS  

## 🛠 기술 스택

### 핵심 기술
- **Frontend Framework**: React 19.1.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.1.2
- **Styling**: Tailwind CSS 4.1.13
- **Routing**: React Router DOM 7.8.2
- **Icons**: Lucide React 0.543.0

### 개발 도구
- **Linting**: ESLint 9.33.0
- **Type Checking**: TypeScript ESLint 8.39.1
- **CSS Processing**: PostCSS 8.5.6 + Autoprefixer 10.4.21

## 📁 프로젝트 구조

```
S13P21A503/FrontEnd/
├── public/                     # 정적 파일
│   ├── icons/                  # 아이콘 이미지
│   └── vite.svg
├── src/
│   ├── api/                    # API 관련
│   │   ├── eldersApi.ts       # 어르신 관련 API
│   │   └── types.ts           # 타입 정의
│   ├── components/            # 재사용 컴포넌트
│   │   ├── common/            # 공통 컴포넌트
│   │   │   ├── AddressSearch.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── SSTLogo.tsx
│   │   ├── elder/             # 어르신 관련 컴포넌트
│   │   │   └── ElderCard.tsx
│   │   └── layout/            # 레이아웃 컴포넌트
│   │       ├── FilterBar.tsx
│   │       ├── Header.tsx
│   │       └── TabBar.tsx
│   ├── layouts/               # 레이아웃
│   │   └── MobileLayout.tsx
│   ├── pages/                 # 페이지 컴포넌트
│   │   ├── auth/              # 인증 페이지
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── camera/            # 카메라 페이지
│   │   │   └── CameraPage.tsx
│   │   ├── elders/            # 어르신 관리 페이지
│   │   │   ├── ElderDetailPage.tsx
│   │   │   ├── ElderEditPage.tsx
│   │   │   └── EldersPage.tsx
│   │   ├── home/              # 홈 페이지
│   │   │   └── HomePage.tsx
│   │   ├── notifications/     # 알림 페이지
│   │   │   └── NotificationsPage.tsx
│   │   ├── register/          # 어르신 등록 페이지
│   │   │   └── RegisterPage.tsx
│   │   ├── settings/          # 설정 페이지
│   │   │   └── SettingsPage.tsx
│   │   └── splash/            # 스플래시 페이지
│   │       └── SplashPage.tsx
│   ├── router/                # 라우팅
│   │   └── routes.tsx
│   ├── store/                 # 상태 관리
│   │   └── eldersStore.ts
│   ├── utils/                 # 유틸리티
│   │   └── formatAge.ts
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── main.tsx              # 앱 진입점
│   └── index.css             # 글로벌 스타일
├── package.json              # 의존성 관리
├── vite.config.ts            # Vite 설정
├── tailwind.config.ts        # Tailwind CSS 설정
├── tsconfig.json             # TypeScript 설정
└── eslint.config.js          # ESLint 설정
```

## 🚀 포팅 가이드

### 1. 환경 요구사항

#### 필수 소프트웨어
- **Node.js**: 18.0.0 이상 (권장: 20.x LTS)
- **npm**: 9.0.0 이상 또는 **yarn**: 1.22.0 이상
- **Git**: 최신 버전

#### 권장 개발 환경
- **IDE**: Visual Studio Code
- **브라우저**: Chrome, Firefox, Safari (최신 버전)
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

### 2. 프로젝트 설치

#### 2.1 저장소 클론
```bash
git clone [저장소 URL]
cd S13P21A503/FrontEnd
```

#### 2.2 의존성 설치
```bash
# npm 사용
npm install

# 또는 yarn 사용
yarn install
```

#### 2.3 개발 서버 실행
```bash
# npm 사용
npm run dev

# 또는 yarn 사용
yarn dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드 및 배포

#### 3.1 프로덕션 빌드
```bash
# npm 사용
npm run build

# 또는 yarn 사용
yarn build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

#### 3.2 빌드 미리보기
```bash
# npm 사용
npm run preview

# 또는 yarn 사용
yarn preview
```

#### 3.3 정적 파일 서버 배포
빌드된 `dist/` 폴더를 웹 서버에 업로드하면 됩니다.

**권장 서버**:
- Nginx
- Apache
- Vercel
- Netlify
- GitHub Pages

### 4. 환경 설정

#### 4.1 API 서버 설정
`src/api/eldersApi.ts`에서 API 서버 주소를 수정하세요:

```typescript
// 로컬 개발 서버
const possibleUrls = [
  'http://127.0.0.1:7000/seniors',  // 로컬 개발 서버
  'https://your-domain.com/api/seniors'  // 프로덕션 서버
]
```

#### 4.2 환경 변수 설정 (선택사항)
`.env` 파일을 생성하여 환경별 설정을 관리할 수 있습니다:

```env
# .env.local (로컬 개발용)
VITE_API_BASE_URL=http://127.0.0.1:7000

# .env.production (프로덕션용)
VITE_API_BASE_URL=https://your-domain.com/api
```

### 5. 주요 기능

#### 5.1 인증 시스템
- **직원 회원가입**: `/auth/register`
- **직원 로그인**: `/auth/login`
- **스플래시 화면**: `/`

#### 5.2 어르신 관리
- **어르신 목록**: `/home`
- **어르신 등록**: `/register`
- **어르신 상세보기**: `/elders/:id`
- **어르신 정보 수정**: `/elders/:id/edit`

#### 5.3 모니터링
- **카메라 확인**: `/camera`
- **알림 확인**: `/notifications`

#### 5.4 설정
- **시스템 설정**: `/settings`

### 6. API 연동

#### 6.1 지원하는 API 엔드포인트
- `POST /staffs` - 직원 회원가입
- `POST /auth/login` - 직원 로그인
- `POST /seniors` - 어르신 등록 (multipart/form-data)
- `GET /seniors` - 어르신 목록 조회
- `GET /seniors/:id` - 어르신 상세 조회
- `PUT /seniors/:id` - 어르신 정보 수정

#### 6.2 API 응답 형식
```typescript
// 성공 응답
{
  "senior_id": 1,
  "name": "홍길동",
  "address": "서울시 강남구",
  "health_info": "안전"
}

// 에러 응답
{
  "errorCode": "VALIDATION_ERROR",
  "message": "필수 필드가 누락되었습니다."
}
```

### 7. 스타일링 가이드

#### 7.1 Tailwind CSS 커스텀 설정
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          500: '#3b82f6',
          600: '#2563eb'
        }
      },
      fontFamily: {
        'sans': ['"Pretendard Variable"', 'Pretendard', ...]
      }
    }
  }
}
```

#### 7.2 주요 색상 팔레트
- **Primary Blue**: `#0088FF`
- **Success Green**: `#10B981`
- **Warning Yellow**: `#F59E0B`
- **Danger Red**: `#EF4444`
- **Gray Scale**: `#F9FAFB` ~ `#111827`

### 8. 문제 해결

#### 8.1 일반적인 문제

**Q: 개발 서버가 시작되지 않아요**
```bash
# Node.js 버전 확인
node --version

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

**Q: API 호출이 실패해요**
- 브라우저 개발자 도구의 Network 탭에서 요청 확인
- CORS 설정 확인
- API 서버 상태 확인

**Q: 스타일이 적용되지 않아요**
- Tailwind CSS 클래스명 확인
- 브라우저 캐시 삭제 (`Ctrl + F5`)
- PostCSS 설정 확인

#### 8.2 브라우저 호환성
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### 9. 성능 최적화

#### 9.1 빌드 최적화
- 코드 스플리팅 자동 적용
- Tree shaking으로 불필요한 코드 제거
- 이미지 최적화 (WebP 지원)

#### 9.2 런타임 최적화
- React 19의 새로운 최적화 기능 활용
- 메모이제이션 적절히 사용
- 가상 스크롤링 (필요시)

### 10. 보안 고려사항

#### 10.1 프론트엔드 보안
- XSS 방지를 위한 입력값 검증
- CSRF 토큰 사용 (백엔드에서 제공시)
- 민감한 정보는 환경 변수로 관리

#### 10.2 API 보안
- JWT 토큰 기반 인증
- HTTPS 통신 강제
- API 레이트 리미팅

### 11. 모니터링 및 로깅

#### 11.1 개발 환경
- 브라우저 개발자 도구 활용
- React DevTools 확장 프로그램 사용
- Vite의 HMR(Hot Module Replacement) 활용

#### 11.2 프로덕션 환경
- 에러 추적 서비스 연동 (Sentry 등)
- 성능 모니터링 (Web Vitals)
- 사용자 분석 (Google Analytics 등)

### 12. 추가 개발 가이드

#### 12.1 새로운 페이지 추가
1. `src/pages/` 폴더에 새 페이지 컴포넌트 생성
2. `src/router/routes.tsx`에 라우트 추가
3. 필요시 `src/components/`에 재사용 컴포넌트 생성

#### 12.2 새로운 API 연동
1. `src/api/eldersApi.ts`에 API 함수 추가
2. TypeScript 타입 정의 추가
3. 에러 처리 및 로딩 상태 관리

#### 12.3 스타일 수정
1. Tailwind CSS 클래스 사용 우선
2. 커스텀 스타일 필요시 `src/index.css`에 추가
3. 컴포넌트별 스타일은 인라인 스타일 사용

## 📞 지원 및 문의

프로젝트 관련 문의사항이나 기술 지원이 필요한 경우:
- **이슈 트래커**: GitHub Issues 활용
- **문서**: 이 포팅 메뉴얼 참조
- **개발팀**: 프로젝트 담당자에게 문의

---

**마지막 업데이트**: 2024년 1월  
**문서 버전**: 1.0.0
