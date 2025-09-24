# Senior Safe Things (SST) - Frontend

어르신 안전 관리 시스템의 프론트엔드 애플리케이션입니다.

## 📋 프로젝트 개요

Senior Safe Things는 IoT 센서를 활용하여 어르신의 안전을 실시간으로 모니터링하고 위험 상황을 즉시 알림하는 시스템입니다.

### 주요 기능
- 👴 **어르신 관리**: 등록, 수정, 삭제, 상세 조회
- 📱 **실시간 모니터링**: 센서 상태 및 어르신 상태 실시간 표시
- 🚨 **위험 감지 알림**: 실시간 알림 시스템
- 📞 **보호자 연락**: 어르신별 보호자 연락처 관리
- 📷 **카메라 확인**: 실시간 카메라 스트림 확인
- 🔐 **인증 시스템**: JWT 기반 로그인/회원가입

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Hooks + Context API
- **Real-time**: REST API Polling
- **HTTP Client**: Fetch API
- **Icons**: Lucide React

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── api/                    # API 관련
│   └── eldersApi.ts       # 어르신 관련 API 함수들
├── components/            # 재사용 가능한 컴포넌트
│   ├── elder/            # 어르신 관련 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── notifications/    # 알림 컴포넌트
├── contexts/             # React Context
│   └── NotificationContext.tsx
├── hooks/                # 커스텀 훅
├── layouts/              # 레이아웃
│   └── MobileLayout.tsx  # 모바일 목업 레이아웃
├── pages/                # 페이지 컴포넌트
│   ├── auth/            # 인증 관련 페이지
│   ├── elders/          # 어르신 관련 페이지
│   ├── register/        # 등록 페이지
│   └── camera/          # 카메라 페이지
├── router/               # 라우팅 설정
│   └── routes.tsx
├── utils/                # 유틸리티 함수
└── config/               # 설정 파일
```

## 🔌 API 연동

### 백엔드 서버
- **프로덕션**: `https://j13a503.p.ssafy.io`
- **개발**: `http://127.0.0.1:7000`

### 주요 API 엔드포인트

#### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

#### 어르신 관리
- `GET /api/seniors` - 어르신 목록 조회
- `GET /api/seniors/{id}` - 어르신 상세 조회
- `POST /api/seniors` - 어르신 등록
- `PUT /api/seniors/{id}` - 어르신 정보 수정
- `DELETE /api/seniors/{id}` - 어르신 삭제

#### 센서 데이터
- `GET /api/seniors/{id}/sensors` - 센서 상태 조회
- `GET /api/seniors/{id}/profile-image` - 프로필 이미지 조회

## 📡 실시간 기능

### 센서 데이터 API
센서 상태는 REST API를 통해 30초마다 폴링하여 실시간으로 업데이트됩니다.

```typescript
import { getSeniorSensorData } from './api/eldersApi'

// 센서 데이터 조회
const sensorData = await getSeniorSensorData(seniorId)
console.log('센서 상태:', sensorData)
```


## 🎨 UI/UX 특징

### 모바일 목업 디자인
- 실제 스마트폰 모양의 목업 컨테이너
- 반응형 디자인으로 다양한 화면 크기 지원
- 직관적인 네비게이션과 탭 바

### 센서 상태 표시
- 실시간 센서 상태 (활성/비활성)
- 색상 코딩으로 상태 구분
- 마지막 업데이트 시간 표시

### 알림 시스템
- 우측 상단 토스트 알림
- 심각도별 색상 구분
- 자동 닫기 기능

## 🔧 개발 환경 설정

### 환경 변수
```env
VITE_API_BASE_URL=https://j13a503.p.ssafy.io
VITE_SOCKET_URL=https://j13a503.p.ssafy.io
```

### 프록시 설정
개발 환경에서 CORS 문제를 해결하기 위해 Vite 프록시를 사용합니다.

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://j13a503.p.ssafy.io',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
```

## 📱 지원 센서

### 센서 타입
- **문 센서** (`door`): 안방, 화장실, 현관문, 냉장고
- **움직임 센서** (`pir`): 안방, 거실, 화장실  
- **조명 센서** (`light`): 안방, 거실, 화장실
- **기타** (`tv`): 거실 TV

### 센서 ID 규칙
```
{센서타입}_{위치}
예: door_bedroom, pir_livingroom, light_bathroom
```

## 🚨 알림 타입

### 위험 감지 알림
- `door_open`: 문이 열렸을 때
- `no_movement`: 움직임이 감지되지 않을 때
- `fall_detected`: 낙상이 감지되었을 때
- `emergency`: 응급상황 발생
- `sensor_failure`: 센서 오류

### 심각도 레벨
- `critical`: 빨간색 (낙상, 응급상황)
- `high`: 주황색 (문 열림, 움직임 없음)
- `medium`: 노란색 (센서 오류)
- `low`: 파란색 (일반 알림)

## 🔐 인증 시스템

### JWT 토큰
- 로그인 시 `access_token` 발급
- `localStorage`에 토큰 저장
- API 요청 시 `Authorization` 헤더에 포함

### 보호 기능
- 토큰 만료 시 자동 로그아웃
- 인증되지 않은 요청 시 로그인 페이지로 리다이렉트

## 🐛 디버깅

### 개발자 도구
브라우저 콘솔에서 다음 로그를 확인할 수 있습니다:

- `📡 센서 데이터 조회 시도`
- `✅ 센서 데이터 조회 성공`
- `🚨 위험 감지 알림 수신`
- `📡 센서 데이터 조회 성공`

### 연결 상태 표시
개발 모드에서는 API 연결 상태를 확인할 수 있습니다.

## 📞 백엔드 연동

### 필요한 백엔드 기능
1. **REST API**: 어르신 관리, 센서 상태 조회
2. **실시간 알림 시스템**: 위험 감지 알림
3. **JWT 인증**: 토큰 기반 인증 시스템
4. **파일 업로드**: 프로필 이미지 업로드
5. **CORS 설정**: 프론트엔드 도메인 허용

### API 명세
자세한 API 명세는 백엔드 팀과 협의하여 문서화되어 있습니다.

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 팀

- **Frontend**: React + TypeScript 개발
- **Backend**: API 서버 개발
- **IoT**: 센서 하드웨어 및 펌웨어 개발

---

**Senior Safe Things** - 어르신의 안전한 일상을 위한 스마트 솔루션