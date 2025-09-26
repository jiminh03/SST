# 📋 SST 어르신 케어 시스템 포팅 메뉴얼

## 🎯 프로젝트 개요

**SST 어르신 케어 시스템**은 React + TypeScript 기반의 모바일 웹 애플리케이션으로, 어르신의 실시간 모니터링과 보호자 연락 기능을 제공합니다.

### 주요 기능
- 🏠 어르신 목록 조회 및 상세 정보 관리
- 📹 실시간 영상 스트리밍 (WebRTC)
- 🔔 실시간 알림 시스템 (Socket.IO)
- 📱 모바일 최적화 UI/UX
- 🔐 JWT 기반 인증 시스템

---

## 🛠️ 기술 스택

### Frontend
- **React 19.1.1** - UI 프레임워크
- **TypeScript 5.8.3** - 타입 안전성
- **Vite 7.1.2** - 빌드 도구
- **React Router DOM 7.8.2** - 라우팅
- **Tailwind CSS 4.1.13** - 스타일링
- **Socket.IO Client 4.8.1** - 실시간 통신
- **Lucide React 0.543.0** - 아이콘

### 개발 도구
- **ESLint 9.33.0** - 코드 품질 관리
- **PostCSS 8.5.6** - CSS 처리
- **Autoprefixer 10.4.21** - CSS 호환성

---

## 📁 프로젝트 구조

```
src/
├── api/                    # API 관련
│   ├── eldersApi.ts       # 어르신 관련 API
│   └── types.ts           # API 타입 정의
├── components/            # 재사용 가능한 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── elder/            # 어르신 관련 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── notifications/    # 알림 컴포넌트
│   └── webrtc/           # WebRTC 관련 컴포넌트
├── contexts/             # React Context
│   ├── NotificationContext.tsx
│   └── SocketContext.tsx
├── layouts/             # 레이아웃
│   └── MobileLayout.tsx
├── pages/               # 페이지 컴포넌트
│   ├── auth/           # 인증 관련
│   ├── elders/         # 어르신 관리
│   ├── home/           # 홈페이지
│   ├── notifications/  # 알림 페이지
│   ├── settings/      # 설정 페이지
│   └── webrtc/        # WebRTC 페이지
├── router/             # 라우팅 설정
│   └── routes.tsx
├── store/              # 상태 관리
│   └── eldersStore.ts
├── utils/              # 유틸리티 함수
│   └── formatAge.ts
└── main.tsx           # 앱 진입점
```

---

## 🚀 설치 및 실행

### 1. 필수 요구사항
- **Node.js** 18.0.0 이상
- **npm** 9.0.0 이상

### 2. 프로젝트 클론 및 설치
```bash
# 프로젝트 클론
git clone <repository-url>
cd FrontEnd

# 의존성 설치
npm install
```

### 3. 환경 설정

#### API 서버 설정
`vite.config.ts`에서 백엔드 서버 URL 설정:
```typescript
export default defineConfig({
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'https://j13a503.p.ssafy.io',  // 백엔드 서버 URL
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

#### WebSocket 서버 설정
`src/pages/home/HomePage.tsx`에서 WebSocket 서버 URL 설정:
```typescript
useEffect(() => {
  const token = localStorage.getItem('access_token')
  if (token) {
    connectSocket('https://j13a503.p.ssafy.io', token)  // WebSocket 서버 URL
  }
}, [connectSocket])
```

### 4. 개발 서버 실행
```bash
# 개발 서버 시작
npm run dev

# 또는
npm start
```

### 5. 프로덕션 빌드
```bash
# TypeScript 컴파일 + Vite 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 🔧 환경별 설정

### 개발 환경
- **포트**: 5175
- **API 프록시**: `/api` → `https://j13a503.p.ssafy.io/api`
- **WebSocket**: `https://j13a503.p.ssafy.io`

### 프로덕션 환경
- **빌드 결과**: `dist/` 폴더
- **정적 파일**: `public/` 폴더의 파일들이 복사됨

---

## 🔐 인증 시스템

### JWT 토큰 관리
- **토큰 저장**: `localStorage.getItem('access_token')`
- **토큰 사용**: API 요청 시 `Authorization: Bearer <token>` 헤더
- **WebSocket 인증**: 연결 시 `auth: { token: jwt }` 옵션

### 로그인 플로우
1. 사용자가 이메일/비밀번호 입력
2. 백엔드에서 JWT 토큰 발급
3. 토큰을 localStorage에 저장
4. 모든 API 요청에 토큰 포함

---

## 📡 API 연동

### 주요 API 엔드포인트
```typescript
// 어르신 목록 조회
GET /api/seniors

// 어르신 상세 정보
GET /api/seniors/{id}

// 어르신 센서 데이터
GET /api/seniors/{id}/sensors
GET /api/sensors/{id}

// 프로필 이미지
GET /api/seniors/{id}/profile-image

// 로그인
POST /api/auth/login

// 회원가입
POST /api/auth/register
```

### API 응답 형식
```typescript
interface Senior {
  senior_id: number
  profile_img?: string
  full_name: string
  address: string
  birth_date: string
  health_info?: string
  guardian_contact?: string
  device_id?: string
  created_at?: string
}
```

---

## 🔌 WebSocket 연동

### Socket.IO 설정
- **서버 URL**: `https://j13a503.p.ssafy.io`
- **인증**: JWT 토큰을 연결 시 전송
- **이벤트**: 실시간 알림 및 WebRTC 신호 교환

### 주요 이벤트
```typescript
// 연결 이벤트
'connect' - 서버 연결 성공
'disconnect' - 서버 연결 끊김
'connect_error' - 연결 오류

// 알림 이벤트
'notification' - 실시간 알림 수신

// WebRTC 이벤트
'client:register_offer' - Offer 등록
'server:new_offer' - 새 Offer 수신
'client:send_answer' - Answer 전송
'server:new_answer' - 새 Answer 수신
```

### Socket Context 사용법
```typescript
import { useSocket } from '../contexts/SocketContext'

const { socket, isConnected, addEventListener, emit } = useSocket()

// 이벤트 리스너 등록
addEventListener('notification', (data) => {
  console.log('알림 수신:', data)
})

// 이벤트 전송
emit('client:register_offer', offerData)
```

---

## 📱 모바일 최적화

### 반응형 디자인
- **Tailwind CSS** 사용
- **모바일 우선** 디자인
- **터치 친화적** UI 요소

### 주요 브레이크포인트
```css
/* 모바일 */
@media (max-width: 768px) { ... }

/* 태블릿 */
@media (min-width: 769px) { ... }

/* 데스크톱 */
@media (min-width: 1024px) { ... }
```

---

## 🎥 WebRTC 설정

### 미디어 스트림 설정
```typescript
const constraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: true
}
```

### ICE 서버 설정
```typescript
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}
```

---

## 🚨 알림 시스템

### 인앱 알림
- **NotificationContext** 사용
- **커스텀 이벤트** 기반 알림 표시
- **자동 사라짐** 기능 (5초 후)

### 알림 타입
```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  type: NotificationType
  title: string
  message: string
}
```

---

## 🔍 디버깅 및 로깅

### 개발자 도구 활용
1. **브라우저 콘솔** - JavaScript 오류 및 로그
2. **네트워크 탭** - API 요청/응답 확인
3. **WebSocket 탭** - 실시간 통신 상태 확인

### 주요 로그 포인트
```typescript
// Socket 연결 상태
console.log('✅ Socket.IO 연결 성공:', socket.id)
console.log('❌ Socket.IO 연결 끊김')

// API 요청/응답
console.log('📡 API 요청:', url, data)
console.log('📥 API 응답:', response)
```

---

## 🐛 문제 해결

### 자주 발생하는 문제

#### 1. CORS 오류
```bash
# 해결방법: vite.config.ts에서 프록시 설정 확인
proxy: {
  '/api': {
    target: 'https://j13a503.p.ssafy.io',
    changeOrigin: true,
    secure: true
  }
}
```

#### 2. WebSocket 연결 실패
```typescript
// 해결방법: 토큰 유효성 및 서버 URL 확인
const token = localStorage.getItem('access_token')
if (token) {
  connectSocket('https://j13a503.p.ssafy.io', token)
}
```

#### 3. TypeScript 빌드 오류
```bash
# 해결방법: 사용하지 않는 import 제거
npm run build
```

#### 4. 이미지 로드 실패 (404)
```typescript
// 해결방법: 프로필 이미지가 없는 경우 기본 이미지 사용
const imageUrl = senior.profile_img || '/default-profile.png'
```

---

## 📦 배포 가이드

### 1. 빌드 생성
```bash
npm run build
```

### 2. 배포 파일 확인
- `dist/` 폴더에 정적 파일 생성
- `index.html` - 메인 페이지
- `viewer.html` - WebRTC 뷰어 페이지
- `assets/` - CSS, JS 번들 파일

### 3. 웹 서버 설정
- **Nginx**, **Apache**, **IIS** 등 사용 가능
- **SPA 라우팅**을 위한 fallback 설정 필요

#### Nginx 설정 예시
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔄 업데이트 및 유지보수

### 의존성 업데이트
```bash
# 패키지 업데이트 확인
npm outdated

# 안전한 업데이트
npm update

# 주요 버전 업데이트 (주의)
npm install react@latest
```

### 코드 품질 관리
```bash
# ESLint 실행
npm run lint

# 타입 체크
npx tsc --noEmit
```

---

## 📞 지원 및 문의

### 개발팀 연락처
- **프로젝트명**: SST 어르신 케어 시스템
- **버전**: 0.0.0
- **개발 환경**: SSAFY 13기 P21A503

### 기술 지원
- **Frontend**: React + TypeScript + Vite
- **Backend**: Spring Boot (추정)
- **Database**: MySQL/PostgreSQL (추정)
- **Infrastructure**: AWS (추정)

---

## 📝 변경 이력

### v0.0.0 (현재)
- ✅ 기본 프로젝트 구조 설정
- ✅ Socket.IO 통합 및 Context 관리
- ✅ WebRTC 실시간 영상 스트리밍
- ✅ 모바일 최적화 UI/UX
- ✅ JWT 인증 시스템
- ✅ 실시간 알림 시스템

---

**🎉 포팅 완료를 축하합니다!**

이 메뉴얼을 따라하시면 SST 어르신 케어 시스템을 성공적으로 포팅하실 수 있습니다. 추가 문의사항이 있으시면 언제든 연락주세요!