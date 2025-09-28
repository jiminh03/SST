# 백엔드 포팅 메뉴얼

1. **실행 환경** 
    
    ```
    │  .env                      # docker compose 실행에 필요한 환경변수
    │  docker-compose.yml        # 도커 컨테이너 실행 및 관리를 위한 docker compose 파일
    │
    ├─docker                 
    │  ├─secure
    │  │      .env               # 백엔드 실행에 필요한 환경변수
    │  │
    │  ├─signaling
    │  │  └─certs
    │  └─turn                    # webrtc turn서버 실행에 필요한 파일
    │      ├─certs
    │      │      fullchain.pem
    │      │      privkey.pem
    │      │
    │      └─turnserver.conf
    └─proxy                      # nginx 설정 관련
            nginx.conf    
    ```
    
2. **docker compose 세팅**
    
    ```
    volumes:
      swagger-docs:
      postgres_data:
      redis_data:
      coturn_data:
    
    networks:
      sst-network:
        driver: bridge
    
    services:
      proxy:
        image: nginx:latest
        container_name: nginx_proxy
        ports:
          - "80:80"
          - "443:443"
        volumes:
          - ${BASE_DIR}/proxy/nginx.conf:/etc/nginx/conf.d/default.conf
          - /etc/letsencrypt:/etc/letsencrypt:ro
        networks:
          - sst-network
        restart: unless-stopped
    
      sst-web:
        image: j13a503.p.ssafy.io:5000/sst_web:latest
        container_name: sst_web
        env_file:
          - ${BASE_DIR}/docker/secure/.env
        networks:
          - sst-network
        restart: unless-stopped
    
      postgres:
        image: timescale/timescaledb:latest-pg15
        container_name: project_db
        restart: unless-stopped
        environment:
          - POSTGRES_USER=${DB_ROOT_USER}
          - POSTGRES_PASSWORD=${DB_ROOT_PW}
          - POSTGRES_DB=${DB_NAME}
        ports:
          - "${POSTGRES_PORT}:${POSTGRES_PORT}"
        volumes:
          - postgres_data:/var/lib/postgresql/data
        networks:
          - sst-network
    
      redis:
        image: redis:7-alpine
        container_name: project_redis
        restart: unless-stopped
        ports:
          - "${REDIS_PORT}:${REDIS_PORT}"
        command: >
          redis-server 
          --appendonly yes 
          --requirepass ${REDIS_PASSWORD}
        volumes:
          - redis_data:/data
        networks:
          - sst-network
    
      turn-server:
        image: coturn/coturn
        container_name: rtc_turn
        restart: unless-stopped
        networks:
          - sst-network
        volumes:
          - ${BASE_DIR}/docker/turn/turnserver.conf:/etc/coturn/turnserver.conf:ro
          - ${BASE_DIR}/docker/turn/certs:/etc/turn/certs:ro
          - coturn_data:/var/lib/turn
        ports:
          - '3478:3478/udp'
          - '3478:3478/tcp'
          - '5349:5349/udp'
          - '5349:5349/tcp'
          - '49152-49200:49152-49200/udp'
        command:
          - "turnserver"
          - "--realm=j13a503.p.ssafy.io"
          - "--fingerprint"
          - "--listening-ip=0.0.0.0"
          - "--external-ip=43.201.149.57"
          - "--listening-port=3478"
          - "--tls-listening-port=5349"
          - "--min-port=49152"
          - "--max-port=65535"
          - "--log-file=stdout"
          - "--verbose"
          - "--user=${TURN_ID}:${TURN_PW}"
          - "--lt-cred-mech"
          - "--cert=/etc/turn/certs/fullchain.pem"
          - "--pkey=/etc/turn/certs/privkey.pem"
          
    ```
    
3. **백엔드 컨테이너 빌드**
    
    dockerfile.web을 통해 빌드
    
    ⇒ 빌드 시 프론트 폴더도 필요
    
4. **api 명세서**
    
    BackEnd의 sst_api.yml 참고