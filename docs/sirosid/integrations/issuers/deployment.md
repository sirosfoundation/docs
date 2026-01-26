---
sidebar_position: 2
sidebar_label: Deployment
---

# Issuer Deployment

This page describes the Docker images and configuration files required to deploy a SIROS ID credential issuer. For conceptual background, see [Concepts & Architecture](./concepts). For detailed configuration examples, see [Configuration](./issuer).

## Docker Images

The issuer deployment uses the following container images:

| Image | Purpose | Required |
|-------|---------|:--------:|
| `ghcr.io/sirosfoundation/vc-issuer` | Credential issuer service | ✅ |
| `ghcr.io/sirosfoundation/vc-issuer-full` | Issuer with SAML & VC 2.0 support | ✅ (if using SAML) |
| `mongo:7` | Database for sessions and state | ✅ |
| `ghcr.io/sirosfoundation/go-trust` | Trust evaluation (AuthZEN) | Optional |

:::tip Which issuer image?
Use `vc-issuer-full` if you need to authenticate users via **SAML IdPs** (e.g., eduGAIN, InCommon, government federations) or issue **W3C VC 2.0** format credentials. Otherwise, the standard `vc-issuer` image is sufficient.
:::

For complete image documentation, see [Docker Images](../../docker-images).

## Directory Structure

A typical issuer deployment has the following structure:

```
issuer/
├── docker-compose.yaml      # Container orchestration
├── config.yaml              # Main issuer configuration
├── pki/
│   ├── issuer_key.pem       # Credential signing key
│   └── issuer_cert.pem      # Signing certificate (if using X.509)
├── metadata/
│   ├── vctm_pid.json        # PID credential type metadata
│   ├── vctm_ehic.json       # EHIC credential type metadata
│   └── ...                  # Additional VCTM files
└── saml/                    # Only for vc-issuer-full
    ├── sp-cert.pem          # SAML SP certificate
    ├── sp-key.pem           # SAML SP private key
    └── idp-metadata/        # Trusted IdP metadata files
```

## Configuration Files

### config.yaml

The main configuration file that controls all issuer behavior.

| Section | Purpose |
|---------|---------|
| `issuer.api_server` | HTTP server settings (port, TLS) |
| `issuer.external_url` | Public URL of the issuer |
| `issuer.signing` | Credential signing key configuration |
| `issuer.authentication` | User authentication backend (OIDC or SAML) |
| `issuer.trust` | Trust evaluation endpoint (go-trust) |
| `credential_constructor` | Credential type definitions and claim mappings |
| `common.mongo` | MongoDB connection settings |

```yaml
# Minimal config.yaml structure
issuer:
  api_server:
    addr: :8080
  external_url: "https://issuer.example.org"
  signing:
    key_path: "/pki/issuer_key.pem"
    algorithm: "ES256"
  authentication:
    type: oidc  # or "saml" with vc-issuer-full
    # ... authentication settings

credential_constructor:
  # ... credential type definitions

common:
  mongo:
    uri: mongodb://mongo:27017
```

### VCTM Files (metadata/*.json)

Verifiable Credential Type Metadata files define each credential type's schema, claims, and display properties.

| Field | Purpose |
|-------|---------|
| `vct` | Unique credential type identifier (URN) |
| `name` | Human-readable name |
| `description` | Credential description |
| `display` | Localized display settings (labels, logos, templates) |
| `claims` | Claim definitions with paths, requirements, and display names |

```json
{
  "vct": "urn:eudi:pid:arf-1.8:1",
  "name": "Person Identification Data",
  "display": [
    {
      "lang": "en-US",
      "name": "PID",
      "rendering": { ... }
    }
  ],
  "claims": [
    {
      "path": ["given_name"],
      "mandatory": true,
      "display": [{"lang": "en-US", "label": "First Name"}]
    }
  ]
}
```

Example VCTM files are available in the [vc repository](https://github.com/sirosfoundation/vc/tree/main/metadata).

### PKI Files

| File | Purpose | Format |
|------|---------|--------|
| `issuer_key.pem` | Credential signing private key | PEM (EC P-256 or RSA) |
| `issuer_cert.pem` | Signing certificate (optional) | PEM X.509 |
| `sp-cert.pem` | SAML SP certificate | PEM X.509 |
| `sp-key.pem` | SAML SP private key | PEM |

#### Generate Signing Keys

```bash
# EC P-256 key (recommended for SD-JWT VC)
openssl ecparam -name prime256v1 -genkey -noout -out pki/issuer_key.pem

# RSA 2048 key (alternative)
openssl genrsa -out pki/issuer_key.pem 2048
```

## docker-compose.yaml

```yaml
services:
  issuer:
    image: ghcr.io/sirosfoundation/vc-issuer:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
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

### With SAML Support

For SAML IdP authentication, use the full image and mount SAML configuration:

```yaml
services:
  issuer:
    image: ghcr.io/sirosfoundation/vc-issuer-full:latest
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
      - ./saml:/saml:ro  # SAML SP keys and IdP metadata
    # ... rest of configuration
```

### With Trust Evaluation

For issuer trust validation, add the go-trust service:

```yaml
services:
  issuer:
    # ... issuer configuration
    
  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    restart: always
    ports:
      - "8081:8081"
    volumes:
      - ./trust-config.yaml:/config.yaml:ro
    command: ["serve", "--config", "/config.yaml"]
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VC_CONFIG_YAML` | Path to configuration file | `config.yaml` |
| `OIDC_CLIENT_SECRET` | OIDC client secret (use secrets) | — |
| `MONGO_URI` | MongoDB connection string | — |

:::warning Secrets Management
Never commit secrets to version control. Use environment variables, Docker secrets, or a secrets manager for sensitive values like `OIDC_CLIENT_SECRET`.
:::

## Deployment Checklist

Before deploying, ensure you have:

- [ ] Generated signing keys (`pki/issuer_key.pem`)
- [ ] Created VCTM files for each credential type (`metadata/*.json`)
- [ ] Configured your IdP to allow the issuer as a client
- [ ] Set up MongoDB (or have connection details for existing instance)
- [ ] Configured external URL and TLS termination
- [ ] (Optional) Configured trust evaluation via go-trust

## Next Steps

- [Configuration Guide](./issuer) – Detailed configuration options
- [OIDC Provider Integration](./oidc-op) – Connect OIDC identity providers
- [SAML IdP Integration](./saml-idp) – Connect SAML federations
- [Keycloak Integration](./keycloak_issuer) – Use Keycloak as authentication backend
