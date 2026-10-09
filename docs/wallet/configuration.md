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
| `WS_URL` | `/api/v2/wallet` on the origin of `WALLET_ENGINE_URL` (`ws(s)://`) | Explicit WebSocket URL override |
| `ALLOWED_TRANSPORTS` | `websocket` | Comma-separated list of enabled OID4VCI/VP transports. Accepted values: `websocket`, `direct` (anything else is ignored) |
| `TRANSPORT_PREFERENCE` | `websocket,direct` | Transport priority order (first allowed transport wins) |

:::note WebSocket path
The frontend always connects to the absolute path `/api/v2/wallet` on the engine origin. Any path component in `WALLET_ENGINE_URL` or `WALLET_BACKEND_URL` is discarded when deriving `WS_URL`, so a reverse proxy must route `/api/v2/wallet` to the engine port (8082). See [Docker Compose](./docker-compose.md#reverse-proxy).
:::

### Protocol Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENID4VCI_REDIRECT_URI` | — | OID4VCI redirect URI for authorization code flows |
| `OPENID4VCI_PROOF_TYPE_PRECEDENCE` | `jwt` | Proof type preference order (for example `attestation,jwt`) |
| `OPENID4VP_SAN_DNS_CHECK` | — | Enable SAN DNS verification for OID4VP verifier certificates |
| `OPENID4VP_SAN_DNS_CHECK_SSL_CERTS` | — | Enable SSL certificate SAN validation |
| `DID_KEY_VERSION` | `jwk_jcs-pub` | DID key format |

### Trust and Registry

| Variable | Default | Description |
|----------|---------|-------------|
| `DELEGATE_TRUST_TO_BACKEND` | `true` | Delegate trust evaluation to the backend's AuthZEN proxy. Setting `false` (local certificate pinning) is only honoured in development builds; production builds force `true` |
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
| `SHOW_PWA_INSTALL_PROMPT` | — | Prompt users to install as PWA on login page |
| `POLICY_LINKS` | — | Terms of service and policy links (`LABEL::URL,LABEL::URL`) |
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
| `WALLET_SERVER_RP_ORIGIN` | `server.rp_origin` | `http://localhost:8080` | WebAuthn RP origin — **must match the user-facing origin**. For several origins use `server.rp_origins` (list); `rp_origin` is the legacy single-value form |
| `WALLET_SERVER_ENGINE_PORT` | `server.engine_port` | `8082` | WebSocket engine port |
| `WALLET_SERVER_ADMIN_PORT` | `server.admin_port` | `8081` | Admin API port |
| `WALLET_SERVER_ADMIN_TOKEN` | `server.admin_token` | — | Bearer token for admin API access |
| `WALLET_SERVER_ADMIN_TOKEN_PATH` | `server.admin_token_path` | — | Load the admin token from a file |
| `WALLET_SERVER_TRUSTED_PROXIES` | `server.trusted_proxies` | trusts every peer | Comma-separated IPs/CIDRs of reverse proxies whose `X-Forwarded-For` is trusted, or `none`. Per-IP rate limits depend on it; the backend logs a warning when it is unset |
| `WALLET_SERVER_ENGINE_WS_PING_INTERVAL` | `server.engine_ws_ping_interval` | `3s` | WebSocket ping interval for the engine |
| `WALLET_SERVER_ENGINE_WS_PONG_TIMEOUT` | `server.engine_ws_pong_timeout` | `5s` | How long to wait for a pong before dropping the connection |

:::caution Admin token
When no admin token is configured, a random token is generated and only a prefix is logged at debug level, so the admin API is effectively unusable. If `ENVIRONMENT`, `GO_ENV` or `APP_ENV` is set to `production`, the admin server refuses to start without `server.admin_token` or `server.admin_token_path`. Always set one explicitly.
:::

CORS is configured under `server.cors.*`; the default `allowed_origins` is `*` (development default), so restrict it in production.

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
| `WALLET_JWT_SECRET` | `jwt.secret` | — | JWT signing secret — **required, at least 32 bytes**; the backend refuses to start otherwise |
| `WALLET_JWT_SECRET_PATH` | `jwt.secret_path` | — | Load JWT secret from file |

### Trust

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_TRUST_PDP_URL` | `trust.pdp_url` | — | URL of the go-trust AuthZEN PDP (e.g., `http://go-trust:6001`). **Required for production.** Per-flow overrides: `trust.issuer.pdp_url`, `trust.verifier.pdp_url` (`none` disables trust for that flow) |
| `WALLET_TRUST_REGISTRY_URL` | `trust.registry_url` | — | URL of the VCTM registry |

:::caution A PDP is required for production
A Policy Decision Point (an AuthZEN service such as [go-trust](/sirosid/trust/go-trust)) is required for production use. Running without `trust.pdp_url` is **not supported** and is for testing and development only, with no guarantees. Some things may happen to work: the backend falls back to a permissive, client-mediated mode in which issuers and verifiers are accepted without server-side verification (it logs a warning, or an error when `ENVIRONMENT=production`), but server-side key resolution through the PDP, including `did:` methods, is not available. If a PDP is configured but fails or is unreachable, evaluation fails closed.
:::

The `/v1/resolve` endpoint accepts an optional `credential_types` field in the request body and forwards it in `action.parameters` of the AuthZEN evaluation request. This enables credential-type-aware trust policies in Go-Trust.

### AuthZEN Proxy

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_AUTHZEN_PROXY_ENABLED` | `authzen_proxy.enabled` | `true` | Expose the AuthZEN proxy on the backend API |

The AuthZEN proxy allows the frontend to delegate trust evaluation to the backend, which forwards requests to Go-Trust with additional context (credential types, resource metadata). The proxy forwards the caller-supplied `credential_types` in `action.parameters`, enabling fine-grained trust decisions per credential format. It is enabled by default because engine flows depend on it.

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
server:
  external_urls:
    backend_url: "https://wallet-api.example.com"
    engine_url: "wss://wallet-ws.example.com"
    registry_url: "https://wallet-registry.example.com"
    admin_url: "https://wallet-admin.internal.example.com"
```

The equivalent environment variables are `WALLET_SERVER_EXTERNAL_URLS_BACKEND_URL`, `WALLET_SERVER_EXTERNAL_URLS_ENGINE_URL`, `WALLET_SERVER_EXTERNAL_URLS_REGISTRY_URL` and `WALLET_SERVER_EXTERNAL_URLS_ADMIN_URL`. The roles of a process are selected with `--mode` (`backend` by default; comma-separated list of `backend`, `registry`, `engine`, `admin`, `auth`, `wallet-provider`, or `all`) and the config file with `--config` (default `configs/config.yaml`).

### Logging

| Env Var | Config Key | Default | Description |
|---------|------------|---------|-------------|
| `WALLET_LOGGING_LEVEL` | `logging.level` | `info` | Log level: `debug`, `info`, `warn`, `error` |

:::tip Complete Configuration Reference
The wallet backend includes a [generated configuration reference](/wallet/wallet-backend-configuration) covering all YAML keys, environment variables, and their descriptions, generated directly from the Go config structs.
:::

---

## VC (Credential Manager)

The apigw, issuer, registry, and verifier services share a single YAML config file (`VC_CONFIG_YAML`), plus a small set of bootstrap environment variables.

:::tip Complete Configuration Reference
See the [generated configuration reference](/sirosid/reference/vc-configuration) for all YAML keys, defaults, and validation constraints across `common`, `apigw`, `issuer`, `verifier`, and `registry`, generated directly from the Go config structs.
:::

---

## Go-Trust

Go-trust is configured via CLI flags, environment variables (prefix `GT_`), or a YAML config file. Full documentation is at [Go-Trust Configuration](/sirosid/trust/go-trust).

### Essential Settings

| Env Var | Default | Description |
|---------|---------|-------------|
| `GT_HOST` | `127.0.0.1` | Listen address (set `0.0.0.0` in containers) |
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
