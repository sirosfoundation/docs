---
sidebar_position: 4
---

# Docker Compose Deployment

This page provides a reference `docker-compose.yaml` for deploying a complete credential manager instance on your own domain.

## Prerequisites

- A domain (e.g., `wallet.example.com`) with DNS pointing to your server
- TLS termination via a reverse proxy (Caddy, Traefik, or Nginx with Let's Encrypt)
- Docker Engine 24+ and Docker Compose v2

## Directory Structure

```
wallet-deployment/
├── docker-compose.yaml
├── config.yaml                 # Wallet backend configuration
├── trusted-certs.pem           # Trust anchor certificates (for go-trust)
└── mongo-init/                 # Optional MongoDB initialization scripts
```

## docker-compose.yaml

```yaml
services:
  frontend:
    image: ghcr.io/sirosfoundation/wallet-frontend:latest
    restart: always
    ports:
      - "3000:80"
    environment:
      # -- Required --
      - WALLET_BACKEND_URL=https://wallet.example.com/api
      - WEBAUTHN_RPID=wallet.example.com
      - STATIC_PUBLIC_URL=https://wallet.example.com
      - STATIC_NAME=My Org Wallet
      # -- Transport --
      - WALLET_ENGINE_URL=https://wallet.example.com/ws
      - ALLOWED_TRANSPORTS=http_proxy,websocket,direct
      # -- Trust --
      - DELEGATE_TRUST_TO_BACKEND=true
      # -- Security --
      - NGINX_ENABLE_HSTS=true
      - NGINX_CSP_ENFORCE_RESOURCE_HTTPS=true
    depends_on:
      - backend

  backend:
    image: ghcr.io/sirosfoundation/go-wallet-backend:latest
    restart: always
    command: ["--mode=all"]
    ports:
      - "8080:8080"   # REST API
      - "8082:8082"   # WebSocket engine
      # Admin API (8081) intentionally NOT exposed to the internet
    environment:
      - WALLET_SERVER_BASE_URL=https://wallet.example.com/api
      - WALLET_SERVER_RP_ID=wallet.example.com
      - WALLET_SERVER_RP_ORIGIN=https://wallet.example.com
      - WALLET_STORAGE_TYPE=mongodb
      - WALLET_STORAGE_MONGODB_URI=mongodb://mongo:27017
      - WALLET_STORAGE_MONGODB_DATABASE=wallet
      - WALLET_JWT_SECRET=CHANGE_ME_TO_A_RANDOM_SECRET
      - WALLET_TRUST_PDP_URL=http://go-trust:6001
      - WALLET_LOGGING_LEVEL=info
    volumes:
      - ./config.yaml:/config.yaml:ro
    depends_on:
      mongo:
        condition: service_healthy
      go-trust:
        condition: service_healthy

  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    restart: always
    command:
      - "--etsi-cert-bundle=/etc/go-trust/trusted-certs.pem"
    ports:
      - "6001:6001"
    environment:
      - GT_HOST=0.0.0.0
      - GT_PORT=6001
      - GT_LOG_LEVEL=info
      - GT_LOG_FORMAT=json
    volumes:
      - ./trusted-certs.pem:/etc/go-trust/trusted-certs.pem:ro
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:6001/healthz"]
      interval: 10s
      timeout: 5s
      retries: 3

  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongo-data:
```

:::warning Change the JWT Secret
The `WALLET_JWT_SECRET` value above is a placeholder. Generate a strong random secret before deploying:
```bash
openssl rand -base64 32
```
:::

## Reverse Proxy

The compose file exposes the frontend on port 3000 and the backend on ports 8080/8082. You need a reverse proxy in front to:

1. Terminate TLS
2. Route requests to the correct service
3. Handle WebSocket upgrades for the engine

### Example: Caddy

```
wallet.example.com {
    # Frontend (default)
    reverse_proxy frontend:80

    # Backend REST API
    handle_path /api/* {
        reverse_proxy backend:8080
    }

    # WebSocket engine
    handle_path /ws/* {
        reverse_proxy backend:8082
    }
}
```

### Example: Nginx

```nginx
server {
    listen 443 ssl;
    server_name wallet.example.com;

    ssl_certificate     /etc/ssl/certs/wallet.example.com.pem;
    ssl_certificate_key /etc/ssl/private/wallet.example.com.key;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://backend:8080/;
    }

    # WebSocket engine
    location /ws/ {
        proxy_pass http://backend:8082/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Startup

```bash
docker compose up -d
```

Verify all services are healthy:

```bash
docker compose ps
curl -s https://wallet.example.com/api/status | jq .
curl -s http://localhost:6001/healthz
```

## Scaling

For a single-server deployment, `--mode=all` runs all backend roles in one process. For production scaling:

1. **Separate the roles** — run `backend`, `engine`, and `admin` as separate containers with `--mode=backend`, `--mode=engine`, etc.
2. **Add Redis** — set `WALLET_SESSION_STORE_TYPE=redis` for shared WebSocket session state across engine replicas
3. **Configure `external_urls`** — so each role knows how to reach the others
4. **Use managed MongoDB** — with authentication, TLS, and replication

## What's Next

- Configure [trust registries](/sirosid/trust/go-trust) for your deployment's trust requirements
- Set up [issuers](/sirosid/issuers/concepts) and [verifiers](/sirosid/verifiers/concepts) that your wallet will interact with
- Review the [Configuration Reference](./configuration) for all available settings
