---
sidebar_position: 3
---

# Configuration

Each component is configured independently. This page documents the key settings for deploying on your own origin.

## Wallet Frontend

The frontend is configured entirely through **environment variables** passed to the Docker container. These are injected into the served HTML at container startup — no rebuild required.

### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `WALLET_BACKEND_URL` | `https://wallet.example.com/api` | URL of the wallet backend REST API |
| `WEBAUTHN_RPID` | `wallet.example.com` | WebAuthn Relying Party ID — must match your domain |
| `STATIC_PUBLIC_URL` | `https://wallet.example.com` | Public URL of this wallet instance |
| `STATIC_NAME` | `My Org Wallet` | Display name shown in the wallet UI |

### Transport Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WALLET_ENGINE_URL` | Same as `WALLET_BACKEND_URL` | WebSocket engine URL (set if running engine on a separate host) |
| `WS_URL` | Auto-derived from `WALLET_ENGINE_URL` | Explicit WebSocket URL override |
| `ALLOWED_TRANSPORTS` | `http_proxy,websocket,direct` | Comma-separated list of enabled OID4VCI/VP transports |
| `TRANSPORT_PREFERENCE` | — | Transport priority order |

### Protocol Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENID4VCI_REDIRECT_URI` | — | OID4VCI redirect URI for authorization code flows |
| `OPENID4VCI_PROOF_TYPE_PRECEDENCE` | `attestation,jwt` | Proof type preference order |
| `OPENID4VP_SAN_DNS_CHECK` | — | Enable SAN DNS verification for OID4VP verifier certificates |
| `OPENID4VP_SAN_DNS_CHECK_SSL_CERTS` | — | Enable SSL certificate SAN validation |
| `DID_KEY_VERSION` | `jwk_jcs-pub` | DID key format |

### Trust and Registry

| Variable | Default | Description |
|----------|---------|-------------|
| `DELEGATE_TRUST_TO_BACKEND` | — | Delegate trust evaluation to the backend's AuthZEN proxy instead of direct evaluation |
| `VCT_REGISTRY_URL` | — | URL of the VCTM registry for credential type metadata |

### Privacy (OHTTP)

| Variable | Description |
|----------|-------------|
| `OHTTP_KEY_CONFIG` | Oblivious HTTP key configuration endpoint |
| `OHTTP_RELAY` | OHTTP relay endpoint for privacy-preserving metadata fetches |

### UI and Branding

| Variable | Default | Description |
|----------|---------|-------------|
| `I18N_WALLET_NAME_OVERRIDE` | — | Override wallet name in all translations |
| `MULTI_LANGUAGE_DISPLAY` | — | Enable language selector |
| `LOGIN_WITH_PASSWORD` | — | Show legacy username/password login (not recommended) |
| `SHOW_PWA_INSTALL_PROMPT` | — | Prompt users to install as PWA on login page |
| `POLICY_LINKS` | — | Terms of service and policy links (`LABEL::URL,LABEL::URL`) |
| `DISPLAY_CONSOLE` | — | Enable browser console output |
| `LOG_LEVEL` | — | Frontend log level |

### Mobile App Association

| Variable | Description |
|----------|-------------|
| `WELLKNOWN_APPLE_APPIDS` | Apple app association for iOS deep linking |
| `WELLKNOWN_ANDROID_PACKAGE_NAMES_AND_FINGERPRINTS` | Android asset links for app deep linking |

### Nginx Security Headers

| Variable | Default | Description |
|----------|---------|-------------|
| `NGINX_SEC_HEADER_FILE` | — | Custom security headers file |
| `NGINX_CSP_ENFORCE_RESOURCE_HTTPS` | — | Enforce HTTPS in Content-Security-Policy |
| `NGINX_ENABLE_HSTS` | — | Enable HTTP Strict Transport Security |

---

## Wallet Backend

The backend is configured via a **YAML config file** and/or **environment variables** with the prefix `WALLET_`. Environment variables override config file values.

### Server

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_SERVER_HOST` | `server.host` | `0.0.0.0` | Bind address |
| `WALLET_SERVER_PORT` | `server.port` | `8080` | HTTP API port |
| `WALLET_SERVER_BASE_URL` | `server.base_url` | — | Public base URL of the backend |
| `WALLET_SERVER_RP_ID` | `server.rp_id` | `localhost` | WebAuthn Relying Party ID — **must match frontend's `WEBAUTHN_RPID`** |
| `WALLET_SERVER_RP_ORIGIN` | `server.rp_origin` | `http://localhost:8080` | WebAuthn RP origin — **must match the user-facing origin** |
| `WALLET_SERVER_ENGINE_PORT` | `server.engine_port` | `8082` | WebSocket engine port |
| `WALLET_SERVER_ADMIN_PORT` | `server.admin_port` | `8081` | Admin API port |
| `WALLET_SERVER_ADMIN_TOKEN` | `server.admin_token` | Auto-generated | Bearer token for admin API access |

### Storage

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_STORAGE_TYPE` | `storage.type` | `memory` | Storage backend: `memory`, `mongodb` |
| `WALLET_STORAGE_MONGODB_URI` | `storage.mongodb.uri` | `mongodb://localhost:27017` | MongoDB connection string |
| `WALLET_STORAGE_MONGODB_DATABASE` | `storage.mongodb.database` | `wallet` | MongoDB database name |

For production, always use `mongodb`. The `memory` backend is for development only.

:::tip MongoDB Password from File
For Kubernetes deployments, use `storage.mongodb.password_path` to load the password from a mounted secret file rather than embedding it in the connection string.
:::

### Authentication

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_JWT_SECRET` | `jwt.secret` | — | JWT signing secret — **must be set in production** |
| `WALLET_JWT_SECRET_PATH` | `jwt.secret_path` | — | Load JWT secret from file |

### Trust

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_TRUST_PDP_URL` | `trust.pdp_url` | — | URL of the go-trust AuthZEN PDP (e.g., `http://go-trust:6001`) |
| `WALLET_TRUST_REGISTRY_URL` | `trust.registry_url` | — | URL of the VCTM registry |

### Session Store

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_SESSION_STORE_TYPE` | `session_store.type` | `memory` | `memory` or `redis` |
| `WALLET_SESSION_STORE_REDIS_ADDRESS` | `session_store.redis.address` | `localhost:6379` | Redis address (required if type is `redis`) |

Use `redis` when running multiple backend replicas to share WebSocket session state.

### HTTP Client Security

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_HTTP_CLIENT_ALLOW_PRIVATE_IPS` | `http_client.allow_private_ips` | `false` | Allow HTTP requests to private/loopback IPs (SSRF protection) |
| `WALLET_HTTP_CLIENT_ALLOW_HTTP` | `http_client.allow_http` | `false` | Allow plain HTTP for metadata resolution |

:::caution Security Defaults
Both SSRF protection and HTTPS enforcement are enabled by default. Only disable these in controlled development environments.
:::

### Features

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_FEATURES_PROXY_ENABLED` | `features.proxy_enabled` | `true` | Enable the `/proxy` endpoint for OID4VCI/VP protocol proxying |
| `WALLET_FEATURES_CREDENTIAL_STORAGE_ENABLED` | `features.credential_storage_enabled` | `false` | Enable server-side credential storage |

### Multi-Role Deployment

When running roles in separate containers, configure cross-service discovery:

```yaml
external_urls:
  backend_url: "https://wallet-api.example.com"
  engine_url: "wss://wallet-ws.example.com"
  registry_url: "https://wallet-registry.example.com"
  admin_url: "https://wallet-admin.internal.example.com"
```

### Logging

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_LOGGING_LEVEL` | `logging.level` | `info` | Log level: `debug`, `info`, `warn`, `error` |

---

## Go-Trust

Go-trust is configured via CLI flags, environment variables (prefix `GT_`), or a YAML config file. Full documentation is at [Go-Trust Configuration](/sirosid/trust/go-trust).

### Essential Settings

| Env Var | Default | Description |
|---------|---------|-------------|
| `GT_HOST` | `0.0.0.0` | Listen address |
| `GT_PORT` | `6001` | Listen port |
| `GT_EXTERNAL_URL` | — | Public URL for the AuthZEN discovery endpoint |
| `GT_LOG_LEVEL` | `info` | Log level |
| `GT_LOG_FORMAT` | `text` | Log format (`text` or `json`) |

### Trust Registries

Go-trust supports multiple trust registry types simultaneously. Configure them via CLI flags or config file:

| Registry Type | Purpose | Input |
|---------------|---------|-------|
| ETSI TSL | EU Trusted Lists (X.509 certificate validation) | PEM certificate bundle file |
| ETSI LoTE | Lists of Trusted Entities (JSON-based) | URLs or local files |
| OpenID Federation | Trust chain resolution | Federation anchor URLs |
| DID:web | Decentralized Identifier resolution | Automatic (network) |
| DID:webvh | DID with verifiable history | Automatic (network) |
| Whitelist | Simple URL-based trust | YAML/JSON file |

Example with an ETSI certificate bundle:

```bash
gt --etsi-cert-bundle=/etc/go-trust/trusted-certs.pem
```

For detailed registry configuration, see the [go-trust example config](https://github.com/sirosfoundation/go-trust/blob/main/example/config.yaml).
