# 프론트엔드 포팅 메뉴얼

## 프로젝트 개요
이 프로젝트는 어르신 돌봄 서비스를 위한 IoT 센서 모니터링 시스템의 프론트엔드입니다. React와 TypeScript를 기반으로 하며, 실시간 웹소켓 통신을 통해 센서 데이터를 모니터링합니다.

## 기술 스택
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **상태 관리**: React Hooks (useState, useEffect, useContext)
- **라우팅**: React Router DOM
- **통신**: Socket.IO Client
- **빌드 도구**: Vite
- **패키지 관리**: npm

## 시스템 요구사항
- Node.js 16.0 이상
- npm 8.0 이상
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone [repository-url]
cd FrontEnd
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정합니다:

```env
VITE_API_BASE_URL=https://your-backend-api-url.com
VITE_SOCKET_URL=https://your-socket-server-url.com
```

### 4. 개발 서버 실행
```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 5. 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 프로젝트 구조

```
src/
├── api/                    # API 관련 함수들
│   ├── eldersApi.ts        # 어르신 관련 API
│   └── authApi.ts         # 인증 관련 API
├── components/             # 재사용 가능한 컴포넌트들
│   ├── elder/             # 어르신 관련 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   └── notifications/     # 알림 컴포넌트
├── contexts/              # React Context
│   └── SocketContext.tsx  # 웹소켓 컨텍스트
├── pages/                 # 페이지 컴포넌트들
│   ├── home/             # 홈 페이지
│   ├── elders/           # 어르신 상세 페이지
│   └── webrtc/          # WebRTC 페이지
├── types/                # TypeScript 타입 정의
└── utils/                # 유틸리티 함수들
```

## 주요 기능

### 1. 인증 시스템
- JWT 토큰 기반 인증
- 로그인/로그아웃 기능
- 토큰 자동 갱신

### 2. 어르신 관리
- 어르신 목록 조회
- 어르신 상세 정보 조회
- 상태별 필터링 (전체, 위험, 주의, 안전)

### 3. 실시간 센서 모니터링
- 웹소켓을 통한 실시간 센서 데이터 수신
- 센서 상태 변경 알림
- 센서 데이터 로컬 저장

### 4. WebRTC 통신
- 실시간 영상 통신
- 음성 통신 지원

## API 연동

### 백엔드 API 엔드포인트
프로젝트는 다음 API 엔드포인트들과 연동됩니다:

- `GET /api/seniors` - 어르신 목록 조회
- `GET /api/seniors/{id}` - 어르신 상세 정보 조회
- `GET /api/seniors/{id}/profile-image` - 프로필 이미지 조회
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 웹소켓 이벤트
- `client:request_all_senior_status` - 전체 어르신 상태 요청
- `client:request_all_sensor_status` - 센서 상태 요청
- `server:notify_senior_status_change` - 어르신 상태 변경 알림
- `server:notify_sensor_status_change` - 센서 상태 변경 알림
- `server:emergency_situation` - 응급 상황 알림

## 배포

### 1. 정적 파일 서버 배포
```bash
npm run build
```

빌드된 `dist` 폴더의 내용을 웹 서버에 업로드합니다.

### 2. Docker 배포
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon-off;"]
```

### 3. 환경별 설정
- **개발 환경**: `npm run dev`
- **스테이징 환경**: `npm run build && npm run preview`
- **프로덕션 환경**: `npm run build`

## 문제 해결

### 일반적인 문제들

1. **의존성 설치 실패**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **빌드 실패**
   - TypeScript 타입 오류 확인
   - 환경 변수 설정 확인
   - API 엔드포인트 연결 상태 확인

3. **웹소켓 연결 실패**
   - 백엔드 서버 상태 확인
   - CORS 설정 확인
   - 네트워크 연결 상태 확인

### 로그 확인
개발자 도구의 콘솔에서 다음 로그들을 확인할 수 있습니다:
- 웹소켓 연결 상태
- API 요청/응답
- 센서 데이터 수신 상태

## 성능 최적화

### 1. 코드 분할
- React.lazy를 사용한 페이지별 코드 분할
- 동적 import를 통한 컴포넌트 지연 로딩

### 2. 메모이제이션
- React.memo를 사용한 컴포넌트 메모이제이션
- useMemo, useCallback을 사용한 값/함수 메모이제이션

### 3. 이미지 최적화
- WebP 포맷 사용
- 이미지 지연 로딩
- 적절한 이미지 크기 조정

## 보안 고려사항

1. **토큰 관리**
   - localStorage에 토큰 저장
   - 토큰 만료 시 자동 갱신
   - 로그아웃 시 토큰 삭제

2. **API 보안**
   - HTTPS 통신 필수
   - CORS 설정 확인
   - 입력 데이터 검증

3. **클라이언트 보안**
   - XSS 방지를 위한 입력 검증
   - 민감한 정보 클라이언트 저장 금지