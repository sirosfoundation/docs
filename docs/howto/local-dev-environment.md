---
sidebar_position: 3
sidebar_label: Local Development Environment
---

# Setting Up a Local Development Environment

This guide walks you through setting up a complete SIROS ID development environment on your local machine. By the end, you'll have the full wallet stack running locally, built from source in the sibling repos — rebuild with `make up REBUILD=yes` after changing frontend or backend code.

## Prerequisites

- **Git** — to clone the repositories
- **Docker** and **Docker Compose** (v2) — to run the services; the wallet frontend, wallet backend, go-trust and VC services are all built inside containers from the sibling checkouts, so no Node.js or Go toolchain is needed on the host
- **GNU Make** — to drive the environment
- **Python 3.11+** with the `venv` module (on Debian/Ubuntu: `sudo apt install python3-venv`) — the Makefile helper scripts and the [boot manager](#boot-manager) use it; the config-rendering scripts behind `VC=yes` and `PDP=helm` also need PyYAML (`apt install python3-yaml` or `pip install pyyaml`)
- **[`helm`](https://helm.sh/docs/intro/install/)** (CLI only — no cluster needed) — required for `VC=yes`, `CONFORMANCE=yes`, `FACETEC=yes` and `PDP=helm`, which render their config from the in-repo `chart/` with `helm template`

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

After cloning, either start the stack directly:

```bash
cd sirosid-dev
make up
```

or install and open the [boot manager](#boot-manager) with `make setup`. `make plan <options>` prints what `make up` would do (compose files, storage, pre-flight checks) without starting anything.

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
| `AS_RULES=` | `allow-all`, `baseline` | `allow-all` | Built-in Authorization Server SPOCP ruleset — see [AS Rules](#as-rules) below |
| `VC=` | `yes` / `1` | off | Enable VC services |
| `TRANSPORT=` | `wmp`, `http` | websocket | Transport protocol (`http` is deprecated) |
| `CONFORMANCE=` | `yes` / `1` | off | Enable OpenID Conformance Suite (implies `VC=yes PDP=allow`) |
| `R2PS=` | `yes` / `1` | off | Enable R2PS remote-signing service + SoftHSM2 — see [R2PS](#r2ps-remote-two-factor-protected-services) |
| `REGISTRY=` | `vendored`, `external` | `vendored` | Where credential type metadata comes from: the documents in `fixtures/vc-metadata`, or the registries in `CREDENTIAL_REGISTRIES=` (default `https://registry.siros.org`) |
| `DOMAIN=` | `<hostname>` | off | Replace `localhost` with a local-network hostname, for mobile/other-device testing |
| `TUNNELS=` | `yes` / `1` | off | Cloudflare quick tunnels for real-TLS public URLs — see [Cloudflare Tunnels](#cloudflare-tunnels-on-demand-tls-domains) |
| `GOLDEN=` | `yes` / `<release-name>` | off | Use pre-built images |
| `DC_API=` | `yes` / `1` | off | Enable the W3C Digital Credentials API integration (needs wallet-companion) |
| `FACETEC=` | `yes` / `1` | off | Enable facetec-api bridge (implies `VC=yes`, requires `FACETEC_SERVER_URL` exported) |
| `REBUILD=` | `yes` / `1` | off | Force a no-cache image rebuild before startup |
| `ANDROID_APPS=` | `pkg=fingerprint,...` | — | Extra Android package/signing-key pairs to trust — see [Android SDK Testing](#android-sdk-testing) |

`DOMAIN=` and `TUNNELS=yes` are mutually exclusive. The sibling checkouts are expected next to `sirosid-dev`; override a location with `FRONTEND_PATH=`, `BACKEND_PATH=`, `VC_PATH=`, `GO_TRUST_PATH=` or `FACETEC_PATH=` (for example `make up FRONTEND_PATH=~/other/wallet-frontend`).

### Common Commands

```bash
make plan          # Show what make up would do, without starting anything
make status        # Check service health
make status-vc     # Check VC service health (when VC=yes)
make storage-status  # Show every store: mode, size, whether it persists
make storage-clear   # Wipe local data and re-register issuer/verifier
make logs          # Tail Docker logs
make down          # Stop the stack (Mongo data is kept)
make clean         # Remove containers, volumes and build cache
```

`make plan`, `make down` and `make logs` take the same options as `make up` — pass the ones you started with (for example `make down VC=yes`) so they act on the same set of containers.

## Boot Manager

The option matrix behind `make up` is large. The boot manager is a terminal UI over it: it lists the environments, shows what booting one would do, edits the options as a form with the help text next to each field, and runs the same `make` commands you could type yourself. Each command is displayed before it runs, so nothing it does is out of reach of the shell.

```bash
make setup    # clone the sibling repos, install the boot manager into .venv, launch it
make boot     # launch it again later
```

`make setup` creates a Python virtual environment in `.venv/` and installs the boot manager (`sirosid-dev`, built on [Textual](https://textual.textualize.io/)) into it. `make setup NO_LAUNCH=yes` installs it without launching. `make boot` only starts `.venv/bin/sirosid-dev`, and tells you to run `make setup` first if it isn't there.

The main screen has one row per environment: the unnamed local stack (`local`) and one for each `environments/<name>.yaml`. The right-hand panel shows the plan for the selected row — the equivalent `make up` command, the compose files, which stores persist, and the pre-flight checks (Docker, the sibling checkouts, `helm`, `cloudflared` for `TUNNELS=yes`). Press `h` to switch the panel to live health of the running stack.

| Key | Action |
|-----|--------|
| `u` / `d` | `make up` / `make down` for the selected environment |
| `o` | Options form for the selected environment (see below) |
| `s` | Storage: databases, sizes and a **Clear all data** button (same as `make storage-clear`) |
| `l` | Tail the Docker logs |
| `c` | Components: live state of each container; Enter or `r` restarts the highlighted one, `l` tails its log |
| `v` | Versions: the image each container runs (built here or pulled) and the git state of the source repos |
| `x` | Doctor: checks for the common gotchas (Docker daemon, `helm`, missing sibling checkouts, rendered secrets, VC PKI) with a suggested fix for each failure |
| `e` | Edit `environments/<name>.yaml` in `$VISUAL`/`$EDITOR` |
| `r` | Refresh |
| `A` | Set the auto-refresh interval (default 3 seconds, `0` turns it off) |
| `?` | Help |
| `q` / `Esc` | Quit |

In the options form every `make up` option is a field (PDP, AS rules, VC, transport, conformance, R2PS, FaceTec, domain, tunnels, golden release, DC API) and the plan below the form updates as you change them. **Boot with these** starts the stack with the current values for this run only. **Save** writes them to the `local:` block of `environments/<name>.yaml`, asking for a name when you started from the unnamed local row; afterwards `make up ENV=<name>` applies them as defaults, and flags on the command line still win. `make plan ENV=<name>` shows the result without starting anything.

## Service Endpoints

Once running, the following services are available on localhost:

| Service | URL | Description |
|---------|-----|--------------|
| Wallet Frontend | http://localhost:3000 | Dev dashboard (service health, storage, build info) at `/`; the wallet itself is at http://localhost:3000/id/default/ |
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
| `helm` | go-trust whitelist + wallet-backend, both configured from files rendered off sirosid-dev's own `chart/` (forked from [siros-id-stack](https://github.com/sirosfoundation/siros-id-stack)) with `helm template`, instead of hand-maintained env vars. `make render-helm-config` renders them on their own. |

:::caution Development only
The `allow`, `deny` and `mock` modes exist for local development and testing. A real PDP (such as go-trust configured with trust lists) is required for production use of the wallet and vc components.
:::

## AS Rules

Separate from the `PDP=` trust policy above, the `AS_RULES=` option selects
the SPOCP policy evaluated by wallet-backend's *built-in* Authorization
Server — the passkey login + token endpoint used for session auth by both
the web frontend and the native (Kotlin/Swift) SDKs, not issuer/verifier
trust decisions.

| Mode | Description |
|------|--------------|
| `allow-all` (default) | Unconditional allow (`fixtures/as-rules/allow-all.rules`). `make up`'s job is to give every other feature a working AS out of the box, not to exercise the AS ruleset itself. |
| `baseline` | go-wallet-backend's own real baseline policy (`rules/default.rules` + `rules/delegation.rules`) — the same rules baked into every wallet-backend image and used whenever `WALLET_AS_RULES_DIR` is left unset. Use this only when directly testing AS rule behavior, e.g. checking a new client request shape against the real policy. |

```bash
# Test against the real AS policy instead of the default allow-all
make up AS_RULES=baseline
```

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

To trust additional app/signing-key pairs (debug builds and Play Store upload keys), copy `.android-apps.example` to `.android-apps` (gitignored, per-developer) or pass `ANDROID_APPS=pkg=fingerprint,...` on the command line.

See [ANDROID-TESTING.md](https://github.com/sirosfoundation/sirosid-dev/blob/main/ANDROID-TESTING.md) in the sirosid-dev repo for the full Android/Waydroid/USB device testing deep dive, including passkey troubleshooting.

## R2PS (Remote Two-Factor Protected Services)

An advanced, currently deprioritized WSCD option: a remote HSM-backed signing service (SoftHSM2 + the R2PS protocol), as an alternative to the default on-device keystore.

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

Release definitions (pinned image tags per component) are fetched on demand from `golden-releases.yaml` in the [siros-conformance](https://github.com/sirosfoundation/siros-conformance) repository; they are tested baselines, not the tip of `main`. Golden images are pulled from `ghcr.io/sirosfoundation/*`. You may need to authenticate with `docker login ghcr.io` if the images require access.

:::note VC services build from source
When using `GOLDEN=yes VC=yes`, wallet and go-trust services use golden images but VC services are still built from the local `../vc` checkout, because their rendered config is written for current source. `VC=yes` therefore needs the `vc` repository and `helm` even with `GOLDEN=yes`.
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
├── vc/                    # VC services (issuer, verifier, apigw, registry)
└── facetec-api/           # FaceTec SDK bridge (optional, for FACETEC=yes)
```

## Next Steps

- [Verifier Docker Quick Start](./verifier-docker-quickstart) — run a standalone verifier from the published image
- [Running Conformance Tests](./running-conformance-tests) — validate your changes against the OpenID Conformance Suite
- [Custom SD-JWT Credential](./custom-sd-jwt-credential) — define and issue a new credential type
- [Credential Manager Architecture](../wallet/architecture) — understand the component topology
- [Open Source Repositories](../opensource/) — full list of SIROS Foundation projects
