---
sidebar_position: 6
sidebar_label: Deployment
---

# Issuer Deployment

This page describes the Docker images and configuration files required to deploy a SIROS ID credential issuer. For conceptual background, see [Concepts & Architecture](./concepts). For detailed configuration examples, see [Configuration](./issuer).

## Docker Images

The issuer deployment uses the following container images:

| Image | Purpose | Required |
|-------|---------|:--------:|
| `ghcr.io/sirosfoundation/vc/issuer` | Credential issuer service (includes SAML & OIDC support) | ✅ |
| `mongo:7` | Database for sessions and state | ✅ |
| `ghcr.io/sirosfoundation/go-trust` | Trust evaluation (AuthZEN) | Optional |

For complete image documentation, see [Docker Images](/sirosid/operations/docker-images).

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
└── saml/                    # Only if using SAML auth_method
    ├── sp-cert.pem          # SAML SP certificate
    ├── sp-key.pem           # SAML SP private key
    └── idp-metadata/        # Trusted IdP metadata files
```

## Configuration Files

### config.yaml

The main configuration file that controls all issuer behavior.

Issuance is split across two services: **apigw** terminates OpenID4VCI and
authenticates the user, **issuer** signs the credential.

| Section | Purpose |
|---------|---------|
| `issuer.api_server` / `issuer.grpc_server` | Issuer service listeners |
| `issuer.issuer_url` | Issuer identifier URL |
| `issuer.key_config` | Credential signing key (file or PKCS#11) |
| `apigw.api_server` | APIGW HTTP server settings (port, TLS) |
| `apigw.public_url` | Public URL of the issuance front end |
| `apigw.auth_providers` | User authentication backend (`oidc`, `saml`, `preauth`) |
| `apigw.data_sources` | Binds credential scopes to auth providers and data sources |
| `apigw.delivery.openid4vci` | OpenID4VCI clients and token endpoint |
| `apigw.trust` | Trust evaluation endpoint (go-trust) |
| `common.credential_metadata` | Credential type definitions (VCTM path + format) |
| `common.mongo` | MongoDB connection settings |

```yaml
# Minimal config.yaml structure
common:
  mongo:
    uri: mongodb://mongo:27017
  credential_metadata:
    pid:
      vctm_file_path: "/metadata/vctm_pid_arf_1_8.json"
      format: "dc+sd-jwt"

issuer:
  issuer_url: "https://issuer.example.org"
  api_server:
    addr: :8080
  grpc_server:
    addr: :8090
  key_config:
    private_key_path: "/pki/issuer_key.pem"
    chain_path: "/pki/issuer_chain.pem"

apigw:
  api_server:
    addr: :8080
  public_url: "https://issuer.example.org"
  issuer_client:
    addr: issuer:8090
  auth_providers:
    oidc:
      enable: true
      # ... see the OIDC Provider integration guide
  data_sources:
    assertion:
      scopes:
        pid:
          auth_provider: oidc
```

:::note No `credential_constructor`
The old `credential_constructor` section was removed from vc. Credential types
are now declared in `common.credential_metadata`, and how a scope is
authenticated and sourced is declared in `apigw.data_sources`. Attribute-to-claim
mapping lives under `apigw.auth_providers.<provider>.attribute_mapping`.
:::

The full key list is in the
[VC Configuration Reference](/sirosid/reference/vc-configuration).

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
    image: ghcr.io/sirosfoundation/vc/issuer:latest
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

For SAML IdP authentication, mount the SAML SP certificate and key:

```yaml
services:
  issuer:
    image: ghcr.io/sirosfoundation/vc/issuer:latest
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
      - "6001:6001"
    volumes:
      - ./trust-config.yaml:/config.yaml:ro
    command: ["--config", "/config.yaml"]
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VC_CONFIG_YAML` | Path to configuration file | `config.yaml` |
| `SSL_CERT_FILE` | CA bundle Go's `crypto/x509` should trust, for inter-service HTTPS with private CAs | — |

These are the only two environment variables the vc services read. The config
file is not environment-interpolated, so there is no `MONGO_URI` or
`OIDC_CLIENT_SECRET` variable — use `common.mongo.uri` and the OIDC provider's
own config keys.

:::warning Secrets Management
Never commit secrets to version control. Put them in the file named by
`common.secret_file_path` and mount that with Docker secrets or a secrets
manager. The file's permissions are checked at startup unless
`common.skip_secrets_perm_check` is set.
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
