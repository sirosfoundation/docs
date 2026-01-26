---
sidebar_position: 2
sidebar_label: Deployment
---

# Verifier Deployment

This page describes the Docker images and configuration files required to deploy a SIROS ID credential verifier. For conceptual background, see [Concepts & Architecture](./concepts). For detailed configuration examples, see [Configuration](./verifier).

## Docker Images

The verifier deployment uses the following container images:

| Image | Purpose | Required |
|-------|---------|:--------:|
| `ghcr.io/sirosfoundation/vc-verifier` | Credential verifier service | ✅ |
| `ghcr.io/sirosfoundation/vc-verifier-full` | Verifier with SAML & VC 2.0 support | ✅ (if using SAML/VC 2.0) |
| `mongo:7` | Database for sessions and state | ✅ |
| `ghcr.io/sirosfoundation/go-trust` | Trust evaluation (AuthZEN) | Recommended |

:::tip Which verifier image?
Use `vc-verifier-full` if you need to verify **W3C VC 2.0** format credentials or integrate with **SAML service providers**. Otherwise, the standard `vc-verifier` image is sufficient for SD-JWT VC and OIDC integrations.
:::

For complete image documentation, see [Docker Images](../../docker-images).

## Directory Structure

A typical verifier deployment has the following structure:

```
verifier/
├── docker-compose.yaml          # Container orchestration
├── config.yaml                  # Main verifier configuration
├── trust-config.yaml            # go-trust configuration (optional)
├── pki/
│   └── oidc_signing_key.pem     # OIDC token signing key
└── presentation_requests/       # Presentation request definitions
    ├── pid_basic.yaml           # Basic PID verification
    ├── pid_age.yaml             # Age verification only
    └── ehic.yaml                # EHIC verification
```

## Configuration Files

### config.yaml

The main configuration file that controls all verifier behavior.

| Section | Purpose |
|---------|---------|
| `verifier_proxy.api_server` | HTTP server settings (port, TLS) |
| `verifier_proxy.external_url` | Public URL of the verifier |
| `verifier_proxy.oidc` | OIDC provider settings (token signing, session duration) |
| `verifier_proxy.openid4vp` | OpenID4VP settings (timeouts, supported credentials) |
| `verifier_proxy.trust` | Trust evaluation endpoint (go-trust) |
| `verifier_proxy.digital_credentials` | W3C Digital Credentials API settings |
| `common.mongo` | MongoDB connection settings |

```yaml
# Minimal config.yaml structure
verifier_proxy:
  api_server:
    addr: :8080
  external_url: "https://verifier.example.org"
  
  oidc:
    issuer: "https://verifier.example.org"
    signing_key_path: "/pki/oidc_signing_key.pem"
    signing_alg: "RS256"
    subject_type: "pairwise"
  
  openid4vp:
    presentation_timeout: 300
    supported_credentials:
      - vct: "urn:eudi:pid:arf-1.8:1"
        scopes: ["openid", "profile"]

  trust:
    authzen_endpoint: "http://go-trust:8081"
    enabled: true

common:
  mongo:
    uri: mongodb://mongo:27017
```

### Presentation Request Files (presentation_requests/*.yaml)

Define what credentials and claims are requested for different verification scenarios.

| Field | Purpose |
|-------|---------|
| `credentials` | List of credential requirements |
| `credentials[].format` | Credential format (`vc+sd-jwt`, `mso_mdoc`) |
| `credentials[].meta.vct_values` | Accepted credential type identifiers |
| `credentials[].claims` | Required claims with paths |

```yaml
# presentation_requests/pid_basic.yaml
credentials:
  - id: identity
    format: vc+sd-jwt
    meta:
      vct_values:
        - urn:eudi:pid:arf-1.8:1
    claims:
      - path: ["given_name"]
      - path: ["family_name"]
      - path: ["birth_date"]
```

### trust-config.yaml (for go-trust)

Configuration for the trust evaluation service.

| Section | Purpose |
|---------|---------|
| `tsl` | ETSI Trust Status List sources |
| `federation` | OpenID Federation trust anchors |
| `x509` | X.509 certificate chain validation |

```yaml
# trust-config.yaml
server:
  addr: :8081

tsl:
  sources:
    - url: "https://ec.europa.eu/tools/lotl/eu-lotl.xml"
      refresh_interval: 24h

federation:
  trust_anchors:
    - "https://trust.example.org"
```

### PKI Files

| File | Purpose | Format |
|------|---------|--------|
| `oidc_signing_key.pem` | Signs OIDC ID tokens and access tokens | PEM (RSA or EC) |

#### Generate Signing Keys

```bash
# RSA 2048 key (common for OIDC)
openssl genrsa -out pki/oidc_signing_key.pem 2048

# EC P-256 key (alternative)
openssl ecparam -name prime256v1 -genkey -noout -out pki/oidc_signing_key.pem
```

## docker-compose.yaml

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc-verifier:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./presentation_requests:/presentation_requests:ro
    environment:
      - VC_CONFIG_YAML=config.yaml
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### With Trust Evaluation (Recommended)

Add the go-trust service for credential issuer validation:

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc-verifier:latest
    # ... verifier configuration
    depends_on:
      - mongo
      - go-trust

  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    restart: always
    ports:
      - "8081:8081"
    volumes:
      - ./trust-config.yaml:/config.yaml:ro
    command: ["serve", "--config", "/config.yaml"]

  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### With VC 2.0 / SAML Support

For W3C VC 2.0 format or SAML integration, use the full image:

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc-verifier-full:latest
    # ... rest of configuration
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VC_CONFIG_YAML` | Path to configuration file | `config.yaml` |
| `SUBJECT_SALT` | Salt for pairwise subject identifiers | — |
| `MONGO_URI` | MongoDB connection string | — |

:::warning Secrets Management
The `SUBJECT_SALT` is used to generate pairwise subject identifiers. Keep it secret and consistent across deployments to maintain user identifier stability. Use Docker secrets or a secrets manager for production.
:::

## Deployment Checklist

Before deploying, ensure you have:

- [ ] Generated OIDC signing keys (`pki/oidc_signing_key.pem`)
- [ ] Defined presentation requests for your use cases
- [ ] Set up MongoDB (or have connection details for existing instance)
- [ ] Configured external URL and TLS termination
- [ ] Generated a secure `SUBJECT_SALT` for pairwise identifiers
- [ ] (Recommended) Configured trust evaluation via go-trust
- [ ] Registered clients or configured dynamic client registration

## Next Steps

- [Configuration Guide](./verifier) – Detailed configuration options
- [Keycloak Integration](./keycloak_verifier) – Add as Keycloak identity provider
- [Direct OIDC Integration](./oidc-rp) – Integrate as OIDC relying party
- [Trust Services](../trust/) – Configure trust framework evaluation
