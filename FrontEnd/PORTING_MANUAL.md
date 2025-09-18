## 🖥️ 프론트엔드 (Frontend)

**작성자**: 개발팀

---

### 1. 개요

- **목적**: ElderCare Management System (어르신 돌봄 관리 시스템) 프론트엔드 애플리케이션 포팅 및 실행 가이드
- **개발 환경**: Node.js 18.0.0+, React 18.2.0, TypeScript 5.0.2, Vite 4.4.5

---

### 2. 환경 설정

- **필요 도구**: Node.js 18.0.0 이상, npm 9.0.0 이상 (또는 yarn 1.22.0 이상)

```bash
cd FrontEnd
npm install   # 또는 yarn install
```

---

### 3. 애플리케이션 실행

```bash
npm run dev   # 또는 yarn dev
```

- **접속 URL**: [http://localhost:5173](http://localhost:5173/)
- **특이사항**: 백엔드 서버가 먼저 실행되어야 정상 동작 (현재는 목업 모드로 개발 중)

---

### 4. 유의사항

- 권장 브라우저: Chrome 90+, Firefox 88+, Safari 14+
- 문제 발생 시:

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

### 5. 주요 기능

- **인증 시스템**: 직원 회원가입/로그인 (이메일 기반)
- **어르신 관리**: 어르신 정보 등록, 수정, 조회
- **센서 모니터링**: 실시간 센서 데이터 표시
- **카메라 확인**: 상황 모니터링을 위한 카메라 기능
- **보호자 연락**: 보호자 연락처 관리 및 복사 기능

---

### 6. 기술 스택

- **Frontend**: React 18.2.0, TypeScript 5.0.2, Vite 4.4.5
- **스타일링**: Tailwind CSS 3.3.3
- **라우팅**: React Router DOM 6.15.0
- **아이콘**: Lucide React 0.263.1

---

### 7. API 연동

- **로컬 서버**: http://127.0.0.1:7000
- **프로덕션 서버**: https://j13a503.p.ssafy.io/api
- **현재 상태**: 목업 모드 활성화 (서버 도커 업데이트 대기 중)

---

### 8. 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물은 dist/ 디렉토리에 생성
```

---

**마지막 업데이트**: 2025년 1월