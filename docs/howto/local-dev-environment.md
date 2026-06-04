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
|------------|--------|-------------|
| `sirosid-dev` | `main` | Dev environment orchestration (Makefile + Docker Compose overlays) |
| `wallet-frontend` | `release/sirosid` | React PWA wallet UI |
| `go-wallet-backend` | `main` | Go wallet backend |
| `go-trust` | `main` | AuthZEN trust PDP |
| `wallet-common` | `release/sirosid` | Shared TypeScript types |
| `vc` | `main` | Credential issuer, verifier, API gateway, registry |

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
|--------|--------|---------|-------------|
| `PDP=` | `allow`, `whitelist`, `deny`, `mock` | `allow` | Trust PDP mode |
| `VC=` | `yes` / `1` | off | Enable VC services |
| `TRANSPORT=` | `wmp`, `http` | websocket | Transport protocol |
| `CONFORMANCE=` | `yes` / `1` | off | Enable OpenID Conformance Suite |
| `GOLDEN=` | `yes` / `<release-name>` | off | Use pre-built images |

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
|---------|-----|-------------|
| Wallet Frontend | http://localhost:3000 | Web wallet UI |
| Wallet Backend API | http://localhost:8080 | Backend REST API |
| Admin API | http://localhost:8081 | Tenant and registration management |
| Wallet Engine | http://localhost:8082 | Credential engine |
| VC Issuer | http://localhost:9000 | OpenID4VCI issuer (when `VC=yes`) |
| VC Verifier | http://localhost:9001 | OpenID4VP verifier (when `VC=yes`) |
| VC API Gateway | http://localhost:9003 | OAuth2 AS + credential metadata (when `VC=yes`) |

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

## Updating All Repos

To force-update all repositories to their default upstream branches:

```bash
cd sirosid-dev
make update
```

This fetches and hard-resets each repo to its upstream branch (`main` or `release/sirosid` as appropriate).

## Directory Layout

After bootstrapping, your workspace looks like this:

```
your-workspace/
├── sirosid-dev/           # This repo — Makefile + Docker Compose overlays
├── wallet-frontend/       # React PWA (release/sirosid branch)
├── go-wallet-backend/     # Go wallet backend
├── go-trust/              # AuthZEN trust PDP
├── wallet-common/         # Shared TypeScript types (release/sirosid branch)
└── vc/                    # VC services (issuer, verifier, apigw, registry)
```

## Next Steps

- [Running Conformance Tests](./running-conformance-tests) — validate your changes against the OpenID Conformance Suite
- [Custom SD-JWT Credential](./custom-sd-jwt-credential) — define and issue a new credential type
- [Credential Manager Architecture](../wallet/architecture) — understand the component topology
- [Open Source Repositories](../opensource/) — full list of SIROS Foundation projects
