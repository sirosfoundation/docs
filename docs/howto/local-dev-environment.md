---
sidebar_position: 3
sidebar_label: Local Development Environment
---

# Setting Up a Local Development Environment

This guide walks you through setting up a complete SIROS ID development environment on your local machine. By the end, you'll have the full wallet stack running locally with hot-reload for frontend and backend development.

## Prerequisites

- **Git** — to clone the repositories
- **Docker** and **Docker Compose** (v2) — to run the services
- **GNU Make** — to drive the environment

For building from source you'll additionally need:

- **Node.js 20+** — for the wallet frontend
- **Go 1.22+** — for the wallet backend and go-trust

For `PDP=helm` and Fly.io deployment you'll additionally need:

- **[`helm`](https://helm.sh/docs/intro/install/)** (CLI only — no cluster needed) — used to render config from the `siros-id-stack` chart via `helm template`

:::tip No source needed for golden releases
If you just want to run the stack without building from source, use `GOLDEN=yes` — it pulls pre-built container images and only requires Docker. See [Golden Releases](#golden-releases) below.
:::

## Quick Bootstrap

The fastest way to get started is the bootstrap script, which clones all required repositories and checks out the correct branches:

```bash
curl -fsSL https://raw.githubusercontent.com/sirosfoundation/sirosid-dev/main/install.sh | bash
```

This clones the following repositories into the current directory:

| Repository | Branch | Description |
|------------|--------|--------------|
| `sirosid-dev` | `main` | Dev environment orchestration (Makefile + Docker Compose overlays) |
| `wallet-frontend` | `release/sirosid` | React PWA wallet UI |
| `go-wallet-backend` | `main` | Go wallet backend |
| `go-trust` | `main` | AuthZEN trust PDP |
| `wallet-common` | `release/sirosid` | Shared TypeScript types |
| `vc` | `main` | Credential issuer, verifier, API gateway, registry |
| `facetec-api` | `main` | FaceTec SDK ↔ vc-issuer bridge (only needed for `FACETEC=yes`) |
| `siros-id-stack` | `main` | Public production Helm chart — config-rendering source for `PDP=helm` and Fly.io deployment; fast-forwarded rather than reset if it's on `main`, left alone otherwise |

After cloning, start the stack:

```bash
cd sirosid-dev
make up
```

## Starting the Stack

All stack operations go through `make up` with options:

```bash
# Default: wallet frontend + backend + go-trust (allow-all)
make up

# Add production-like VC services (issuer, verifier, API gateway, registry)
make up VC=yes

# Use whitelist trust mode (only configured issuers/verifiers are trusted)
make up PDP=whitelist VC=yes

# Use pre-built golden release images (no local source build)
make up GOLDEN=yes
```

### Available Options

| Option | Values | Default | Description |
|--------|--------|---------|--------------|
| `PDP=` | `allow`, `whitelist`, `deny`, `mock`, `helm` | `allow` | Trust PDP mode — see [PDP Modes](#pdp-modes) below |
| `VC=` | `yes` / `1` | off | Enable VC services |
| `TRANSPORT=` | `wmp`, `http` | websocket | Transport protocol (`http` is deprecated) |
| `CONFORMANCE=` | `yes` / `1` | off | Enable OpenID Conformance Suite (implies `VC=yes PDP=allow`) |
| `R2PS=` | `yes` / `1` | off | Enable R2PS remote-signing service + SoftHSM2 — see [R2PS](#r2ps-remote-pake-protected-signing) |
| `DOMAIN=` | `<hostname>` | off | Replace `localhost` with a local-network hostname, for mobile/other-device testing |
| `TUNNELS=` | `yes` / `1` | off | Cloudflare quick tunnels for real-TLS public URLs — see [Cloudflare Tunnels](#cloudflare-tunnels-on-demand-tls-domains) |
| `GOLDEN=` | `yes` / `<release-name>` | off | Use pre-built images |
| `FACETEC=` | `yes` / `1` | off | Enable facetec-api bridge (implies `VC=yes`, requires `FACETEC_SERVER_URL` exported) |
| `REBUILD=` | `yes` / `1` | off | Force a no-cache image rebuild before startup |
| `ANDROID_APPS=` | `pkg=fingerprint,...` | — | Extra Android package/signing-key pairs to trust — see [Android SDK Testing](#android-sdk-testing) |

`DOMAIN=` and `TUNNELS=yes` are mutually exclusive. Run `make help` for the full, authoritative option reference (it also covers Fly.io flags and source-path overrides).

### Common Commands

```bash
make status        # Check service health
make status-vc     # Check VC service health (when VC=yes)
make logs          # Tail Docker logs
make down          # Stop everything
make help          # Full option reference
```

## Service Endpoints

Once running, the following services are available on localhost:

| Service | URL | Description |
|---------|-----|--------------|
| Wallet Frontend | http://localhost:3000 | Web wallet UI |
| Wallet Backend API | http://localhost:8080 | Backend REST API |
| Admin API | http://localhost:8081 | Tenant and registration management |
| Wallet Engine | http://localhost:8082 | Credential engine |
| VC Issuer | http://localhost:9000 | OpenID4VCI issuer (when `VC=yes`) |
| VC Verifier | http://localhost:9001 | OpenID4VP verifier (when `VC=yes`) |
| VC API Gateway | http://localhost:9003 | OAuth2 AS + credential metadata (when `VC=yes`) |
| VC Registry | http://localhost:9004 | Status lists and type metadata (when `VC=yes`) |
| facetec-api | http://localhost:8085 | FaceTec SDK bridge (when `FACETEC=yes`) |

See the [sirosid-dev README](https://github.com/sirosfoundation/sirosid-dev#service-ports) for the full port reference, including the `go-trust` instances and R2PS services.

## PDP Modes

The `PDP=` option selects how trust decisions are made:

| Mode | Description |
|------|--------------|
| `allow` (default) | go-trust allow-all — every entity is trusted |
| `whitelist` | go-trust whitelist — only entities in `fixtures/vc-go-trust-whitelist.yaml` are trusted |
| `deny` | go-trust deny-all — rejects everything (negative testing) |
| `mock` | Legacy mock-trust-pdp (no go-trust) |
| `helm` | go-trust whitelist + wallet-backend, both configured from files rendered off the [siros-id-stack](https://github.com/sirosfoundation/siros-id-stack) chart instead of hand-maintained env vars. Requires a sibling `../siros-id-stack` checkout. This is the transitional path towards aligning sirosid-dev's config with the production Helm chart. |

## Mobile Device Testing

### Custom Domain

`DOMAIN=` replaces all `localhost` references in service URLs with a custom hostname, enabling access from mobile devices or other machines on the local network:

```bash
make up DOMAIN=myhost.local VC=yes
```

The domain must resolve to the host machine's IP from the testing device (via `/etc/hosts`, mDNS, or local DNS).

### Cloudflare Tunnels (On-Demand TLS Domains)

For testing with real TLS certificates and publicly reachable URLs — e.g. mobile devices not on the same network, or when TLS is required for passkeys — use Cloudflare quick tunnels. No Cloudflare account is needed; temporary `*.trycloudflare.com` domains are assigned automatically.

```bash
# Start the stack with tunnel support
make up TUNNELS=yes VC=yes

# Open the frontend tunnel URL shown in the output on any device

# Check tunnel status / stop tunnels
make tunnel-status
make tunnel-stop
```

Requires `cloudflared` installed (`brew install cloudflared` on macOS, or download the Linux binary from the [cloudflared releases page](https://github.com/cloudflare/cloudflared/releases)). `make down` stops the stack but leaves the tunnel processes running so URLs can be reused — use `make tunnel-stop` to tear them down.

## Android SDK Testing

The Android SDK sample app (`siros-sdk-kotlin`) or native wrapper apps can be tested against the local dev environment using a physical device or emulator:

```bash
# Connect your Android device via USB (or start an emulator), then:
make android-setup APP_PACKAGE=org.siros.sdk.sample

# Recommended for passkeys — real TLS via Cloudflare tunnels:
make up TUNNELS=yes VC=yes
```

`make android-setup` extracts the debug keystore's APK key hash, generates `.well-known/assetlinks.json`, and enables `DEVELOPMENT_PASSKEY_REGISTRATION` on the connected device via ADB. `make up TUNNELS=yes` re-runs it automatically so the Android config stays current.

To trust additional app/signing-key pairs (debug builds and Play Store upload keys), copy `.android-apps.example` to `.android-apps` (gitignored, per-developer) or pass `ANDROID_APPS=pkg=fingerprint,...` on the command line — both are honored by `make up` and `make fly-up` alike.

See [ANDROID-TESTING.md](https://github.com/sirosfoundation/sirosid-dev/blob/main/ANDROID-TESTING.md) in the sirosid-dev repo for the full Android/Waydroid/USB device testing deep dive, including passkey troubleshooting.

## R2PS (Remote PAKE-Protected Signing)

An advanced, currently deprioritized WSCD option: a remote HSM-backed signing service (SoftHSM2 + PAKE-authenticated protocol), as an alternative to the default on-device keystore.

```bash
make up R2PS=yes VC=yes
make r2ps-setup          # verify health + list provisioned keys
```

See [R2PS.md](https://github.com/sirosfoundation/sirosid-dev/blob/main/R2PS.md) in the sirosid-dev repo for the key-provisioning protocol, admin API cookbook, and Android SDK plugin configuration.

## Golden Releases

Golden releases let you run the stack using pre-built, tested container images without cloning or building any source code:

```bash
make up GOLDEN=yes          # Use the default golden release
make up GOLDEN=beta_r2      # Use a specific named release
```

Golden images are pulled from `ghcr.io/sirosfoundation/*`. You may need to authenticate with `docker login ghcr.io` if the images require access.

:::note VC services build from source
When using `GOLDEN=yes VC=yes`, wallet and go-trust services use golden images but VC services are still built from local source due to config format differences between releases.
:::

## Fly.io Deployment

Beyond local docker-compose, `sirosid-dev` can also spin up a full, independently addressable wallet stack (frontend, wallet-proxy, backend, PDP, issuer, verifier, apigw, registry, mongo, mini-oidc) on Fly.io under the shared `sirosfoundation` org. Each named environment gets its own set of `sirosid-<env>-*` apps and `*.fly.dev` URLs, fully isolated from every other environment — useful for handing a URL to someone else, native Android/iOS app testing over real TLS, or OIDC flows that need a real browser redirect.

```bash
make fly-up ENV=alice              # deploy a new environment
make fly-status ENV=alice          # check all apps
make fly-down ENV=alice            # tear it down
```

Config is rendered from the `siros-id-stack` chart (the same mechanism as `PDP=helm`) and images are pulled straight from that chart's `values.yaml` — no local Docker build. Requires `flyctl` installed and authenticated, and a sibling `../siros-id-stack` checkout (`make setup` clones it).

Multiple developers can run their own named environments (`ENV=alice`, `ENV=bob`, ...) at the same time with no collision. To test your own branch build in one environment without touching any checked-in file, use `IMAGES=`:

```bash
make fly-up ENV=alice IMAGES="wallet-backend=ghcr.io/sirosfoundation/go-wallet-backend:pr-123"
```

See the [sirosid-dev README](https://github.com/sirosfoundation/sirosid-dev#flyio-deployment) for the full Fly.io reference, including `TRUSTED_ISSUERS=`/`TRUSTED_VERIFIERS=`/`TRUSTED_VERIFIER_ROOTS=` for interop testing and Android app identity setup.

## Updating All Repos

To force-update all repositories to their default upstream branches:

```bash
cd sirosid-dev
make update
```

This fetches and hard-resets each repo to its upstream branch (`main` or `release/sirosid` as appropriate). `siros-id-stack` is excluded — it's fast-forwarded separately by `make setup`/`install.sh` since it may deliberately be checked out to a branch under test.

## Directory Layout

After bootstrapping, your workspace looks like this:

```
your-workspace/
├── sirosid-dev/           # This repo — Makefile + Docker Compose overlays
├── wallet-frontend/       # React PWA (release/sirosid branch)
├── go-wallet-backend/     # Go wallet backend
├── go-trust/              # AuthZEN trust PDP
├── wallet-common/         # Shared TypeScript types (release/sirosid branch)
├── vc/                    # VC services (issuer, verifier, apigw, registry)
├── facetec-api/           # FaceTec SDK bridge (optional, for FACETEC=yes)
└── siros-id-stack/        # Public production Helm chart (optional, for PDP=helm / fly-up)
```

## Developer Tools Container

The VC repository includes a **developer-tools** container image with pre-built CLI utilities for bootstrapping and configuration generation:

- `gen-bootstrap` — generate initial configuration and credential metadata
- `gen-config-docs` — regenerate configuration documentation
- `jwt-issuer` — issue test JWTs for API authentication

Build the image from the vc repository:

```bash
cd vc
docker build -f dockerfiles/developer-tools -t vc/developer-tools .
```

## Next Steps

- [Running Conformance Tests](./running-conformance-tests) — validate your changes against the OpenID Conformance Suite
- [Custom SD-JWT Credential](./custom-sd-jwt-credential) — define and issue a new credential type
- [Credential Manager Architecture](../wallet/architecture) — understand the component topology
- [Open Source Repositories](../opensource/) — full list of SIROS Foundation projects
