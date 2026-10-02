---
sidebar_position: 5
title: VCTM Registry Role
---

# VCTM Registry Role

The wallet backend's VCTM registry fetches and caches credential type metadata (VCTM) from [registry.siros.org](https://registry.siros.org) or any compatible source, and serves it to wallets. It is a **role** of the single `go-wallet-backend` binary, alongside `backend`, `engine`, `admin` and `auth`.

:::info Applies from the release that includes go-wallet-backend#431
This page describes the registry as re-integrated into the roles-based binary by [go-wallet-backend#431](https://github.com/sirosfoundation/go-wallet-backend/pull/431) (issue [#430](https://github.com/sirosfoundation/go-wallet-backend/issues/430)). Earlier releases shipped the registry as a separate `cmd/registry` binary with its own `registry.yaml`; see [Migrating from the standalone registry](#migrating-from-the-standalone-registry).
:::

:::note Not the other registries
This page is about the registry role inside go-wallet-backend (the _consuming_ side). It is not the [registry-cli](../sirosid/registry/registry-cli) publisher, the registry.siros.org catalogue, or the VC suite's Token Status List registry. See [Credential Type Registry](../sirosid/reference/vctm-registry) for the distinction.
:::

## Running the registry role

Select the role with `--mode=registry`. Roles can be combined, for example `--mode=backend,registry`.

| Deployment | Command |
|------------|---------|
| Registry only | `./server --mode=registry --config configs/config.registry.yaml` |
| Registry only, main image | `docker run -p 8097:8097 -v $PWD/registry.yaml:/etc/wallet/config.yaml sirosfoundation/go-wallet-backend --mode=registry --config /etc/wallet/config.yaml` |
| Combined with other roles | `--mode=backend,registry,engine,auth` (served from the shared HTTP port under `/registry`) |

A registry-only process listens on `server.registry_host` / `server.registry_port` (default `0.0.0.0:8097`; override with `WALLET_SERVER_REGISTRY_PORT`). It does not require the backend-only settings (storage, `jwt.secret` when not needed, `server.rp_id`, ...). When the registry is combined with other roles, the shared `server.host` / `server.port` are used.

The `server` (including TLS, CORS and `served_by_header`), `logging` and `http_client` settings are the backend's own; the registry has no separate copies. See the [Wallet Backend configuration](./configuration#wallet-backend) and the [generated configuration reference](/wallet/wallet-backend-configuration).

## Configuration

Registry settings live in a `registry:` section of the backend config file. Environment variables use the prefix `WALLET_REGISTRY_`, for example `WALLET_REGISTRY_SOURCE_URL` and `WALLET_REGISTRY_REQUIRE_AUTH`.

| Key | Purpose |
|-----|---------|
| `registry.source` | Upstream registry (`url`, `mode`, `local_overrides`, `poll_interval`, `timeout`) |
| `registry.sources` | Ordered list of remote registry URLs; later sources overwrite earlier ones. When non-empty, `source.url` is not used for remote fetching |
| `registry.cache` | On-disk cache (`path`, `max_age`) |
| `registry.dynamic_cache` | Dynamic fetching of VCTMs by URL (`enabled`, `default_ttl`, `max_ttl`, `min_ttl`, `timeout`, `allowed_hosts`) |
| `registry.image_embed` | Embedding of images into served metadata (`enabled`, `max_image_size`, `timeout`, `concurrent_fetches`) |
| `registry.filter` | `include_patterns` / `exclude_patterns` regular expressions matched against VCT identifiers |
| `registry.rate_limit` | `enabled`, `authenticated_rpm`, `unauthenticated_rpm`, `burst_multiplier` |
| `registry.require_auth` | Require a valid access token on all registry requests (default `false`) |

The [generated reference](/wallet/wallet-backend-configuration#registry) lists every key with its environment variable and description.

A minimal registry-only configuration, based on `configs/config.registry.yaml` in the go-wallet-backend repository:

```yaml
server:
  registry_port: 8097

registry:
  source:
    url: "https://registry.siros.org/api/v1/schemas.json"
    poll_interval: 5m
    timeout: 30s
  cache:
    path: "/app/data/vctm-cache.json"
    max_age: 24h
  require_auth: false
```

## Authentication

The registry uses the same token validator as the other backend roles. With `registry.require_auth: false` (the default), unauthenticated requests are allowed (with the lower unauthenticated rate limit) and valid tokens are still recognised. With `registry.require_auth: true`, every request needs a valid access token.

- **New-style tokens** (ES256, ES384, EdDSA) are verified against the JWKS at `<as.external_url>/auth/.well-known/jwks.json`. The JWKS URL is always derived from `as.external_url`; it cannot be overridden. These tokens must carry the `wallet-registry` audience.
- **Legacy HMAC tokens** are accepted only while `as.legacy.enabled` is `true`. They are checked against `jwt.secret` (at least 32 bytes) and are never rejected because of the audience.
- The expected issuer differs by token type: new-style tokens must have been issued by `as.issuer` (falling back to `jwt.issuer` when `as.issuer` is empty), while legacy HMAC tokens must have been issued by `jwt.issuer`. Setting a custom `as.issuer` therefore does not change the issuer accepted for legacy tokens.

### Registry-only deployments with `require_auth: true`

A registry-only process does not run the authorization server (keep `as.enabled` false); it only validates the tokens the AS issues. It must set:

| Setting | Why |
|---------|-----|
| `as.external_url` | Source of the JWKS |
| `as.issuer` (or `jwt.issuer`) | Expected `iss` of new-style tokens; legacy HMAC tokens use `jwt.issuer` (see above) |
| `jwt.secret` or `jwt.secret_path` (at least 32 bytes) | Only while `as.legacy.enabled` is `true`; set `as.legacy.enabled: false` to drop it |

Startup fails with a message naming any missing field.

```yaml
server:
  registry_port: 8097
registry:
  source:
    url: "https://registry.siros.org/api/v1/schemas.json"
  cache:
    path: "/data/vctm-cache.json"
  require_auth: true
as:
  external_url: https://wallet.example.org
jwt:
  secret_path: /run/secrets/jwt
  issuer: wallet-backend
```

## The go-wallet-registry image

The `sirosfoundation/go-wallet-registry` image is now only a transition helper. It contains the main server binary with `--mode=registry` fixed in the entrypoint and `--config /app/configs/config.registry.yaml` as the default argument. The image name and port (8097) are unchanged.

Overriding the container arguments keeps the registry role, but a mounted config file must now be in the **backend layout** with a `registry:` section, not the old `registry.yaml` layout. For new deployments prefer the main `go-wallet-backend` image with `--mode=registry`.

## Migrating from the standalone registry

The `cmd/registry` binary, `configs/registry.yaml`, `configs/registry.production.yaml` and the `build-registry` Make target no longer exist.

### Deprecation plan

| Release | Behaviour |
|---------|-----------|
| The release including go-wallet-backend#431 | `--registry-config` (default `configs/registry.yaml`), that file and the `REGISTRY_*` variables still work as deprecated aliases. They are mapped onto `registry:` and a `DEPRECATED` warning names the new location. If the new `registry:` section (or `WALLET_REGISTRY_*`) is also set, the two are merged per key: keys set explicitly in the new section win, the remaining keys are filled from the deprecated file and variables, and a second warning lists the keys where the two disagree. Deprecated values therefore still affect runtime until the aliases are removed. |
| The next release | The aliases and the `--registry-config` flag are removed. |

If you pass an old-layout file with `--config` by mistake, top-level registry keys (`source`, `cache`, `filter`, ...) are not applied and a warning tells you to move them under `registry:`.

### Mapping

| Old (`registry.yaml` / `REGISTRY_*`) | New (backend config / `WALLET_*`) |
|---|---|
| `source.*`, `sources` | `registry.source.*`, `registry.sources` (`WALLET_REGISTRY_SOURCE_*`) |
| `cache.path`, `cache.max_age` | `registry.cache.*` |
| `dynamic_cache.*` | `registry.dynamic_cache.*` |
| `image_embed.*` | `registry.image_embed.*` |
| `filter.*` | `registry.filter.*` |
| `rate_limit.*` | `registry.rate_limit.*` |
| `jwt.require_auth` | `registry.require_auth` (`WALLET_REGISTRY_REQUIRE_AUTH`) |
| `jwt.secret`, `jwt.secret_path` | top-level `jwt.secret` / `jwt.secret_path` (legacy HMAC only) |
| `jwt.issuer` | top-level `jwt.issuer`, which is the issuer of legacy HMAC tokens (new-style tokens use `as.issuer`, falling back to `jwt.issuer`) |
| `server.host`, `server.port` | `server.registry_host`, `server.registry_port` when the registry runs alone; the shared `server.host` / `server.port` when combined |
| `server.cors`, `server.tls`, `server.served_by_header` | same keys in the backend's `server` section |
| `logging.*` | `logging.*` |
| `http_client.*` | `http_client.*` |
| `trust.*` (in the example file but never read) | dropped |

Environment variables: `REGISTRY_<KEY>` becomes `WALLET_REGISTRY_<KEY>` for the registry keys (`REGISTRY_SOURCE_URL` becomes `WALLET_REGISTRY_SOURCE_URL`). Shared settings use their usual `WALLET_` names: `REGISTRY_SERVER_PORT` becomes `WALLET_SERVER_REGISTRY_PORT`, and `REGISTRY_LOGGING_LEVEL` becomes `WALLET_LOGGING_LEVEL`.

### Behaviour changes to check

- The registry no longer has its own HMAC-only JWT check. Old registry secrets shorter than 32 bytes are no longer accepted.
- Enabling `registry.require_auth` through the new section requires `as.external_url`. A deployment that migrates through the deprecated alias with the old HMAC-only `jwt.require_auth: true` and no `as.external_url` still starts, with a warning, and keeps accepting HMAC tokens; set `as.external_url` to accept AS-issued tokens.

### Deployment changes

- **Combined deployments** (for example `--mode backend,registry,engine,auth -registry-config /main-config/registry.yaml`) still start, with a warning. Move the file's content into the backend config's `registry:` section, then drop `-registry-config` and any `REGISTRY_*` variables.
- **Registry-only on the `go-wallet-registry` image:** container args `-config <old registry.yaml>` must point at a backend-layout file, or be dropped in favour of `WALLET_*` environment variables. The port stays 8097.
- **Registry-only on the main image:** `--mode=registry --config <backend-layout file>`.

The authoritative migration guide is `docs/REGISTRY_MIGRATION.md` in the [go-wallet-backend repository](https://github.com/sirosfoundation/go-wallet-backend).
