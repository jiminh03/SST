# 🏠 Senior Safe Things (SST)

> 스마트 홈 IoT와 실시간 통신으로 어르신의 일상을 안전하게 연결하는 통합 플랫폼


## 🏟️ 프로젝트 소개
**SST**는 독거 어르신의 안전한 생활을 돕기 위해 **IoT 센서**, **AI 기반 이상 징후 감지**, **실시간 영상 통신**을 통합한 스마트 홈 솔루션입니다.  
단순히 데이터를 수집하는 것을 넘어, **실시간 모니터링**, **위험 상황 알림**, **보호기관 담당자와 보호자의 연결**까지 아우르는 **종합 케어 플랫폼**을 목표로 합니다.  
웹 프론트엔드, 백엔드, AI 추론 서버, 시뮬레이션 모듈로 구성됩니다.

## 👥 팀 구성

### AI (1명)
- **김재희**
    - 룰 기반 + ML 앙상블 추론 파이프라인
    - 위험 래치 정책으로 중복 알림 억제
    - BE 콜백으로 위험도 업데이트

### Backend (1명)
- **정민우**
    - 인증과 권한 관리
    - 어르신 및 센서 리소스 API
    - WebSocket 게이트웨이와 알림 분배
  
### Frontend (1명)
- **황지민**
    - 실시간 대시보드, WebRTC 뷰어, 알림 UX
    - 어르신 관리와 상태별 필터링
    - JWT 기반 인증 플로우


### Simulation (3명)
- **강무엽, 백민재, 이승원**
    - 센서 이벤트 재현과 시나리오 재생
    - 통합 E2E 흐름 검증
    - 준비 중

## 🛠 기술 스택
**AI**  
[![FastAPI](https://img.shields.io/badge/FastAPI-0.112+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)


**Backend**  
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Nginx](https://img.shields.io/badge/Nginx-1.x-009639?logo=nginx&logoColor=white)](https://nginx.org/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

**Frontend**  
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**협업**  
[![GitLab](https://img.shields.io/badge/GitLab-Repo-FC6D26?logo=gitlab&logoColor=white)](https://lab.ssafy.com/s13-mobility-smarthome-sub1/S13P21A503)
[![Figma](https://img.shields.io/badge/Figma-Design-F24E1E?logo=figma&logoColor=white)](#)
[![Notion](https://img.shields.io/badge/Notion-Docs-000000?logo=notion&logoColor=white)](#)



## 💡 서비스 기획 배경

### 목표
혼자 사는 어르신의 **일상 데이터를 비침습적으로 학습**하고, **이상 패턴을 조기 감지**해 가족과 보호자가 신속히 대응할 수 있도록 돕습니다.

### Pain Point
- 이상 징후를 늦게 발견
- 센서 데이터가 분산되어 현황 파악이 어려움
- 실시간 확인과 커뮤니케이션 채널 부재

### 차별점
- **실시간 센서 모니터링 + 즉시 알림**
- **WebRTC** 기반 초저지연 현장 확인
- **룰 + ML 앙상블 + 래치 정책**으로 **정확도와 안정성** 동시 확보



## ⭐ 주요 기능

### 실시간 모니터링
- WebSocket으로 센서 상태와 이벤트를 즉시 반영
- 문, 움직임, 조명, TV 등 센서 대시보드
- 상태 변화 시 인앱 알림

### 어르신 관리
- 목록 조회와 상세 정보
- 상태별 필터링 (전체, 위험, 주의, 안전)
- 센서별 최신 상태와 이벤트 히스토리

### 실시간 영상 통신
- WebRTC 기반 현장 스트리밍
- 자동 재연결과 품질 관리
- 보호자 확인 플로우 연동

### 인증과 보안
- JWT 로그인과 자동 갱신
- 보호된 라우트 관리
- HTTPS 통신 필수



## 🏗️ 시스템 구조

<p align="center">
  <img src="img/total.png" alt="전체 아키텍처" width="820">
</p>

<p align="center">
  <img src="img/FE-BE_arch.png" alt="FE-BE 구조" width="700">
</p>

<p align="center">
  <img src="img/AI-BE_arch.png" alt="AI-BE 구조" width="700">
</p>

<p align="center">
  <img src="img/HUB-BE_arch.png" alt="HUB-BE 구조" width="700">
</p>



## 🔌 인터페이스 요약

### REST API
- GET  /api/seniors  
- GET  /api/seniors/{id}  
- GET  /api/seniors/{id}/profile-image  
- GET  /api/seniors/{id}/sensors  
- POST /api/auth/login  
- POST /api/auth/register  

### WebSocket 이벤트
- client:request_all_senior_status  
- client:request_all_sensor_status  
- server:notify_senior_status_change  
- server:notify_sensor_status_change  
- server:emergency_situation  

### AI 엔드포인트
- POST /ai/tick : 10초 스냅샷 단건 추론  
- POST /ai/infer : 배치 검증 및 백필  
- PUT  /seniors/{id}/risk-level : 추론 결과 반영  
- POST /ai/risk-clear : 래치 해제  



## 🎨 디자인
**Figma**: [SST 목업](https://www.figma.com/design/Q96zQS7MvwOBUK3yOVAOo4/SST-%EB%AA%A9%EC%97%85?node-id=0-1&p=f&t=nH5OQ2s9bWxoFT7I-0)
* 모바일 우선 반응형
* Tailwind CSS 유틸리티 기반 스타일링


## 📚 문서 목록
| 문서명 | 설명 | 링크 |
|--------|------|------|
| 포팅 매뉴얼 | 포지션 별 포팅 메뉴얼 | [📖 보기](포팅메뉴얼) |
| Notion | 싸파트 503호 노션 | [📖 보기](https://www.notion.so/503-2543cc1e521e8077b0d7fc54fcee756a?source=copy_link)|
---
