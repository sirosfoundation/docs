---
sidebar_position: 2
title: Registry CLI
---

# Registry CLI

[registry-cli](https://github.com/sirosfoundation/registry-cli) is a command-line tool for building and serving **TS11-compliant Catalogue of Attestations** sites. It discovers credential type metadata (VCTMs) from GitHub repositories and produces a static HTML site with a JSON API, OpenAPI specification, and optional JWS signing.

The public [registry.siros.org](https://registry.siros.org) is built and deployed using registry-cli. See the [Registry Services overview](./) for how the registry fits into the wallet ecosystem.

## Quick Start with Docker

The fastest way to run your own registry is using the published Docker image.

### 1. Create a sources file

Create a directory for your registry and add a `sources.yaml` file that tells registry-cli where to find credential metadata:

```bash
mkdir -p my-registry/sources
cat > my-registry/sources/sources.yaml <<'EOF'
sources:
  # Auto-discover repos tagged "vctm" on GitHub
  - "github:topic/vctm"

  # Or list specific repositories
  - url: "git:https://github.com/sirosfoundation/demo-credentials.git"
    branch: vctm
EOF
```

### 2. Run with Docker Compose

Create a `docker-compose.yml`:

```yaml
services:
  registry:
    image: ghcr.io/sirosfoundation/registry-cli:latest
    ports:
      - "8080:8080"
    volumes:
      - ./sources:/data/sources:ro
      - ./output:/data/output
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN:-}
```

Then start the registry:

```bash
export GITHUB_TOKEN=ghp_...   # needed for GitHub API access
docker compose up
```

The registry is now available at `http://localhost:8080`.

### 3. Run with Docker directly

```bash
docker run -p 8080:8080 \
  -v ./sources:/data/sources:ro \
  -v ./output:/data/output \
  -e GITHUB_TOKEN \
  ghcr.io/sirosfoundation/registry-cli:latest
```

## Static Site Generation

To generate a static site (for hosting on GitHub Pages, Netlify, etc.) instead of running a live server:

```bash
docker run --rm \
  -v ./sources:/data/sources:ro \
  -v ./output:/data/output \
  -e GITHUB_TOKEN \
  ghcr.io/sirosfoundation/registry-cli:latest \
  build \
    --sources /data/sources/sources.yaml \
    --output /data/output \
    --base-url https://your-registry.example.com
```

The generated site will be in `./output/` and can be deployed to any static hosting provider.

## Sources Configuration

The `sources.yaml` file defines where registry-cli discovers credential metadata.

### Source types

| Format | Example | Description |
|--------|---------|-------------|
| GitHub topic | `github:topic/vctm` | Auto-discover all repos with the given topic |
| GitHub topic (scoped) | `github:topic/vctm?org=myorg` | Discover within a specific GitHub organization |
| Git repository | `git:https://github.com/org/repo.git` | Explicit git repository |
| Local directory | `file:///path/to/dir` | Local filesystem path |

### Structured entries

For more control, use structured source entries:

```yaml
sources:
  - url: "git:https://github.com/org/repo.git"
    branch: main           # override branch (default: repo default branch)
    organization: "My Org" # override organization display name
```

### Subfolder path targeting {#path-targeting}

*Added in v0.12.0*

If a repository contains credentials in a subdirectory (rather than at the root), use the `path` field to restrict discovery to that subtree:

```yaml
sources:
  - url: "git:https://github.com/org/monorepo.git"
    path: "credentials/production"   # only scan this subfolder
```

This is useful for monorepos where credential definitions live alongside other project files. Only credential files within the specified path (and its subdirectories) are processed; everything else in the repository is ignored.

Path traversal (e.g. `../`) is rejected for security.

### Default settings

```yaml
defaults:
  branch: main   # default branch for all sources
sources:
  - "git:https://github.com/org/repo.git"
```

## Markdown Credential Authoring

registry-cli converts Markdown files with `vct:` YAML front matter into credential metadata in multiple output formats. See the [Custom SD-JWT Credential guide](../../howto/custom-sd-jwt-credential) for a full end-to-end walkthrough.

### Per-credential format override {#per-credential-formats}

*Added in v0.12.0*

By default, registry-cli generates all registered output formats (SD-JWT VCTM, mDOC MDDL, and W3C VCDM 2.0) for every markdown credential. To generate only specific formats, add a `formats` field to the front matter:

```markdown
---
vct: https://example.com/credentials/my-credential
formats: sd-jwt, w3c
---
```

Supported format names and aliases:

| Name | Aliases | Output file |
|------|---------|-------------|
| `vctm` | `sd-jwt`, `sdjwt` | `.vctm.json` |
| `mddl` | `mdoc`, `mso_mdoc` | `.mdoc.json` |
| `w3c` | `jwt_vc_json` | `.vc.json` |

When `formats` is omitted or empty, all registered formats are generated.

### Nested object and array claims {#nested-claims}

*Added in v0.12.0*

Claims that contain sub-fields (objects) or repeated items (arrays) can be expressed using Markdown sub-lists:

```markdown
## Claims

- `name` (string): Full name [mandatory] [sd=always]
- `address` (object): Postal address [mandatory]
    - `street` (string): Street address [mandatory]
    - `city` (string): City [mandatory]
    - `postal_code` (string): Postal code
    - `country` (string): Country code
- `previous_addresses` (array): Previous addresses
    - `street` (string): Street address
    - `city` (string): City
```

The container type determines how children are represented in each output format:

| Container type | VCTM (SD-JWT) | mDOC (MDDL) | W3C (JSON Schema) |
|---------------|--------------|-------------|-------------------|
| `object` | Nested claim paths (e.g. `["address", "street"]`) | Dot-notation keys (e.g. `address.street`) | Nested `properties` in JSON Schema |
| `array` | Array paths with `null` index (e.g. `["previous_addresses", null, "city"]`) | Dot-notation keys (e.g. `previous_addresses.city`) | `items` schema with `properties` |

## CLI Reference

### `registry-cli build`

Build a static registry site from credential sources.

| Flag | Default | Description |
|------|---------|-------------|
| `--sources` | `sources.yaml` | Path to sources manifest |
| `--output` | `dist` | Output directory |
| `--base-url` | `https://registry.siros.org` | Base URL for generated links |
| `--templates` | — | Path to custom template overrides |
| `--static` | — | Path to custom static assets |

### `registry-cli serve`

Build and serve the registry with a live API. Inherits all `build` flags plus:

| Flag | Default | Description |
|------|---------|-------------|
| `--addr` | `127.0.0.1` | Bind address |
| `--port` | `8080` | Listen port |
| `--pkcs11-uri` | — | PKCS#11 URI for JWS signing |
| `--key-label` | — | PKCS#11 key label |
| `--issuer` | — | JWT issuer claim |
| `--jku` | — | JWS Key URL header |

### `registry-cli sign`

Sign API responses with JWS (RFC 7515). Supports ephemeral keys, SoftHSM, and hardware HSMs.

| Flag | Default | Description |
|------|---------|-------------|
| `--input` | *(required)* | Input directory with JSON files |
| `--pattern` | `*.json` | Glob pattern for files to sign |
| `--pkcs11-uri` | — | PKCS#11 URI (ephemeral key if omitted) |
| `--key-label` | `registry-signing` | HSM key label |
| `--issuer` | `registry-cli` | JWT issuer |
| `--jwks-output` | — | Path for JWKS public key file |

## Custom Templates

Override the default HTML templates by providing a `--templates` directory. Templates use Go's `html/template` syntax. See the [registry.siros.org templates](https://github.com/sirosfoundation/registry.siros.org/tree/main/templates-go) for examples.

## API Output

The generated registry includes a TS11-compliant JSON API:

| Endpoint | Description |
|----------|-------------|
| `/api/v1/schemas.json` | All credential schemas |
| `/api/v1/schemas/<id>.json` | Individual credential schema |
| `/api/v1/attributes.json` | Catalogue of attributes |
| `/api/v1/openapi.yaml` | OpenAPI 3.1 specification |
| `/.well-known/vctm-registry.json` | VCTM registry discovery |
| `/api/v1/.well-known/jwks.json` | Public signing keys (when signing is enabled) |

When JWS signing is enabled, all JSON responses are also available as `.jwt` files (JWS compact serialization).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token for repository discovery and cloning |

## Installation from Source

```bash
go install github.com/sirosfoundation/registry-cli/cmd/registry-cli@latest
```

Or build locally:

```bash
git clone https://github.com/sirosfoundation/registry-cli.git
cd registry-cli
make build
```
