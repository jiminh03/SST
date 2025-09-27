# 어르신 돌봄 IoT 센서 모니터링 시스템

## 프로젝트 소개
어르신 돌봄을 위한 IoT 센서 모니터링 시스템의 프론트엔드 애플리케이션입니다. 실시간 센서 데이터를 모니터링하고 어르신의 안전 상태를 추적할 수 있는 웹 애플리케이션입니다.

## 주요 기능

### 실시간 모니터링
- 웹소켓을 통한 실시간 센서 데이터 수신
- 문, 움직임 감지, 조명, 기타 센서 상태 모니터링
- 센서 상태 변경 시 즉시 알림

### 어르신 관리
- 어르신 목록 조회 및 관리
- 상태별 필터링 (전체, 위험, 주의, 안전)
- 어르신별 상세 정보 및 센서 상태 확인

### 실시간 통신
- WebRTC를 통한 실시간 영상 통신
- 보호자 연락처 관리 및 연락 기능

### 사용자 인증
- JWT 토큰 기반 인증 시스템
- 로그인/로그아웃 기능
- 자동 토큰 갱신

## 기술 스택

### Frontend
- **React 18**: 사용자 인터페이스 구축
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 스타일링 및 반응형 디자인
- **React Router DOM**: 클라이언트 사이드 라우팅

### 통신
- **Socket.IO Client**: 실시간 웹소켓 통신
- **Fetch API**: REST API 통신
- **WebRTC**: 실시간 영상 통신

### 개발 도구
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **ESLint**: 코드 품질 관리
- **npm**: 패키지 관리

## 설치 및 실행

### 사전 요구사항
- Node.js 16.0 이상
- npm 8.0 이상
- 모던 웹 브라우저

### 설치
```bash
# 저장소 클론
git clone [repository-url]
cd FrontEnd

# 의존성 설치
npm install
```

### 환경 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정합니다:

```env
VITE_API_BASE_URL=https://your-backend-api-url.com
VITE_SOCKET_URL=https://your-socket-server-url.com
```

### 개발 서버 실행
```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드
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
│   │   └── ElderCard.tsx  # 어르신 카드 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   │   ├── Header.tsx     # 헤더 컴포넌트
│   │   └── FilterBar.tsx # 필터 바 컴포넌트
│   └── notifications/     # 알림 컴포넌트
├── contexts/              # React Context
│   └── SocketContext.tsx  # 웹소켓 컨텍스트
├── pages/                 # 페이지 컴포넌트들
│   ├── home/             # 홈 페이지
│   │   └── HomePage.tsx  # 홈 페이지 컴포넌트
│   ├── elders/           # 어르신 상세 페이지
│   │   └── ElderDetailPage.tsx # 어르신 상세 페이지
│   └── webrtc/          # WebRTC 페이지
├── types/                # TypeScript 타입 정의
└── utils/                # 유틸리티 함수들
```

## 주요 컴포넌트

### HomePage
- 어르신 목록 표시
- 상태별 필터링 기능
- 실시간 상태 업데이트

### ElderDetailPage
- 어르신 상세 정보 표시
- 센서 상태 모니터링
- 실시간 센서 데이터 업데이트
- WebRTC 통신 기능

### ElderCard
- 어르신 정보 카드 표시
- 상태 표시 및 네비게이션
- 호버 효과 및 애니메이션

### SocketContext
- 웹소켓 연결 관리
- 이벤트 리스너 등록/해제
- 연결 상태 관리

## API 연동

### REST API
- **GET /api/seniors**: 어르신 목록 조회
- **GET /api/seniors/{id}**: 어르신 상세 정보 조회
- **GET /api/seniors/{id}/profile-image**: 프로필 이미지 조회
- **POST /api/auth/login**: 로그인
- **POST /api/auth/logout**: 로그아웃

### 웹소켓 이벤트
- **client:request_all_senior_status**: 전체 어르신 상태 요청
- **client:request_all_sensor_status**: 센서 상태 요청
- **server:notify_senior_status_change**: 어르신 상태 변경 알림
- **server:notify_sensor_status_change**: 센서 상태 변경 알림
- **server:emergency_situation**: 응급 상황 알림

## 센서 타입

### 문 센서
- 현관문 (door_entrance)
- 안방문 (door_bedroom)
- 화장실문 (door_bathroom)
- 냉장고문 (door_fridge)

### 움직임 감지 센서
- 안방 (pir_bedroom)
- 거실 (pir_livingroom)
- 화장실 (pir_bathroom)

### 조명 센서
- 안방 (light_bedroom)
- 거실 (light_livingroom)
- 화장실 (light_bathroom)

### 기타 센서
- TV (tv_livingroom)

## 상태 관리

### 어르신 상태
- **안전**: 정상 상태
- **주의**: 주의가 필요한 상태
- **위험**: 위험한 상태

### 센서 상태
- **active**: 센서가 활성화된 상태
- **inactive**: 센서가 비활성화된 상태

## 데이터 저장

### 로컬 저장소
- 센서 데이터는 localStorage에 저장
- 어르신별 센서 데이터 분리 저장
- 페이지 새로고침 시 데이터 복원

### 실시간 업데이트
- 웹소켓을 통한 실시간 데이터 수신
- 센서 상태 변경 시 즉시 UI 업데이트
- 자동 재연결 기능

## 스타일링

### 디자인 시스템
- Tailwind CSS를 사용한 유틸리티 기반 스타일링
- 반응형 디자인 적용
- 다크/라이트 모드 지원

### 컴포넌트 스타일
- 일관된 색상 팔레트 사용
- 부드러운 애니메이션 및 전환 효과
- 접근성을 고려한 디자인

## 성능 최적화

### 코드 분할
- React.lazy를 사용한 페이지별 코드 분할
- 동적 import를 통한 컴포넌트 지연 로딩

### 메모이제이션
- React.memo를 사용한 컴포넌트 메모이제이션
- useMemo, useCallback을 사용한 값/함수 메모이제이션

### 이미지 최적화
- WebP 포맷 사용
- 이미지 지연 로딩
- 적절한 이미지 크기 조정

## 보안

### 인증 및 권한
- JWT 토큰 기반 인증
- 토큰 자동 갱신
- 로그아웃 시 토큰 삭제

### 데이터 보호
- HTTPS 통신 필수
- 민감한 정보 클라이언트 저장 금지
- 입력 데이터 검증

## 테스트

### 테스트 환경
- 개발 환경에서의 기능 테스트
- 다양한 브라우저에서의 호환성 테스트
- 모바일 디바이스에서의 반응형 테스트

### 테스트 시나리오
- 로그인/로그아웃 테스트
- 센서 데이터 수신 테스트
- 실시간 통신 테스트
- 에러 처리 테스트

## 배포

### 정적 파일 배포
```bash
npm run build
```

빌드된 `dist` 폴더의 내용을 웹 서버에 업로드합니다.

### Docker 배포
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon-off;"]
```

## 문제 해결

### 일반적인 문제
1. **의존성 설치 실패**: `rm -rf node_modules package-lock.json && npm install`
2. **빌드 실패**: TypeScript 타입 오류 및 환경 변수 확인
3. **웹소켓 연결 실패**: 백엔드 서버 상태 및 CORS 설정 확인

### 디버깅
- 개발자 도구 콘솔에서 로그 확인
- 네트워크 탭에서 API 요청/응답 확인
- React DevTools를 사용한 컴포넌트 상태 확인

## 기여하기

### 개발 환경 설정
1. 프로젝트 포크
2. 로컬에 클론
3. 의존성 설치
4. 개발 서버 실행

### 코드 스타일
- ESLint 규칙 준수
- TypeScript 타입 안전성 유지
- 의미있는 변수명 및 함수명 사용

### 커밋 메시지
- 명확하고 간결한 커밋 메시지 작성
- 기능별로 분리된 커밋
- 테스트 코드 포함

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 연락처
프로젝트 관련 문의사항이나 버그 리포트는 이슈를 통해 제출해주세요.