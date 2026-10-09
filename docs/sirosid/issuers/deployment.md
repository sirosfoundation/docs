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
| `ghcr.io/sirosfoundation/vc/apigw` | Public OpenID4VCI/OAuth endpoints and user authentication (OIDC, SAML) | ✅ |
| `ghcr.io/sirosfoundation/vc/issuer` | Credential signing service (gRPC) | ✅ |
| `ghcr.io/sirosfoundation/vc/registry` | Token Status Lists | ✅ |
| `mongo:7` | Database for sessions and state | ✅ |
| `ghcr.io/sirosfoundation/go-trust` | Trust evaluation (AuthZEN PDP); required for production | ✅ (production) |

For complete image documentation, see [Docker Images](/sirosid/operations/docker-images).

## Directory Structure

A typical issuer deployment has the following structure:

```
issuer/
├── docker-compose.yaml      # Container orchestration
├── config.yaml              # Main issuer configuration
├── pki/
│   ├── signing_ec_private.pem  # Credential signing key
│   └── signing_ec_chain.pem    # Signing certificate chain (X.509)
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

Issuance is split across three services: **apigw** terminates OpenID4VCI and
authenticates the user, **issuer** signs the credential, and **registry**
serves Token Status Lists. They all read the same `config.yaml`.

| Section | Purpose |
|---------|---------|
| `issuer.api_server` / `issuer.grpc_server` | Issuer service listeners |
| `issuer.issuer_url` | Issuer identifier URL |
| `issuer.key_config` | Credential signing key (file or PKCS#11) |
| `issuer.jwt_attribute` | Required issuer-side JWT settings (`issuer`, `verifiable_credential_type`) |
| `apigw.key_config` | APIGW signing key (metadata and tokens) |
| `apigw.issuer_client` / `apigw.registry_client` | gRPC addresses of the issuer and registry |
| `apigw.api_server` | APIGW HTTP server settings (port, TLS) |
| `apigw.public_url` | Public URL of the issuance front end |
| `apigw.auth_providers` | User authentication backend (`oidc`, `saml`, `preauth`) |
| `apigw.data_sources` | Binds credential scopes to auth providers and data sources |
| `apigw.delivery.openid4vci` | OpenID4VCI clients and token endpoint |
| `apigw.delivery.credential_offers` | Offer `issuer_url` (must equal `apigw.public_url`) and wallet list |
| `apigw.trust` | Trust evaluation endpoint (go-trust PDP) |
| `registry.token_status_lists` | Status list signing key |
| `common.credential_metadata` | Credential type definitions (VCTM path + format) |
| `common.mongo` | MongoDB connection settings |

```yaml
# Minimal config.yaml (passes startup validation for issuer, apigw and registry)
common:
  production: true
  mongo:
    uri: mongodb://mongo:27017
  credential_metadata:
    pid:
      vctm_file_path: "/metadata/vctm_pid.json"
      format: "dc+sd-jwt"

issuer:
  issuer_url: "https://issuer.example.org"
  api_server:
    addr: :8080
  grpc_server:
    addr: :8090
  registry_client:
    addr: registry:8090
  key_config:
    private_key_path: "/pki/signing_ec_private.pem"
    chain_path: "/pki/signing_ec_chain.pem"
  jwt_attribute:
    issuer: "https://issuer.example.org"
    verifiable_credential_type: "urn:eudi:pid:1"

apigw:
  api_server:
    addr: :8080
  public_url: "https://issuer.example.org"
  key_config:
    private_key_path: "/pki/signing_ec_private.pem"
    chain_path: "/pki/signing_ec_chain.pem"
  issuer_client:
    addr: issuer:8090
  registry_client:
    addr: registry:8090
  auth_providers:
    oidc:
      enable: true
      issuer_url: "https://your-idp.example.com"
      redirect_uri: "https://issuer.example.org/oidcrp/callback"
      registration:
        preconfigured:
          enable: true
          client_id: "issuer-client"
          client_secret: "the-client-secret"
      scopes:
        - openid
        - profile
  data_sources:
    assertion:
      scopes:
        pid:
          auth_provider: oidc
  delivery:
    openid4vci:
      token_endpoint: "https://issuer.example.org/token"
      clients:
        "1003":
          type: "public"
          redirect_uri: "https://wallet.example.com"
          scopes:
            - "pid"
    credential_offers:
      issuer_url: "https://issuer.example.org"
      wallets:
        my_wallet:
          label: "My Wallet"
          redirect_uri: "https://wallet.example.com/credential-offer"
  trust:
    pdp_url: "http://go-trust:6001"

registry:
  api_server:
    addr: :8080
  public_url: "https://registry.example.org"
  grpc_server:
    addr: :8090
  token_status_lists:
    key_config:
      private_key_path: "/pki/signing_ec_private.pem"
      chain_path: "/pki/signing_ec_chain.pem"
```

The `jwt_attribute` block is required by the issuer service, and `apigw.delivery.credential_offers.issuer_url` must be byte-identical to `apigw.public_url`. Configure the OIDC secret inline (or via the file named by `common.secret_file_path`); the config file is not environment-interpolated.

:::warning A PDP is required for production
A PDP (AuthZEN, such as go-trust) configured through `apigw.trust.pdp_url` is required for production use. Without it, key resolution is limited to the self-contained local DID methods (`did:key`, `did:jwk`) and trust evaluation is "allow all". Omit it only for development and testing.
:::

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
  "vct": "urn:eudi:pid:1",
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

Example VCTM files are available in the [vc repository](https://github.com/SUNET/vc/tree/main/metadata).

### PKI Files

| File | Purpose | Format |
|------|---------|--------|
| `signing_ec_private.pem` | Credential signing private key | PEM (EC P-256 or RSA) |
| `signing_ec_chain.pem` | Signing certificate chain | PEM X.509 |
| `sp-cert.pem` | SAML SP certificate | PEM X.509 |
| `sp-key.pem` | SAML SP private key | PEM |

#### Generate Signing Keys

```bash
# EC P-256 key (recommended for SD-JWT VC)
openssl ecparam -name prime256v1 -genkey -noout -out pki/signing_ec_private.pem

# RSA 2048 key (alternative)
openssl genrsa -out pki/signing_ec_private.pem 2048
```

## docker-compose.yaml

```yaml
services:
  apigw:
    image: ghcr.io/sirosfoundation/vc/apigw:latest
    restart: always
    ports:
      - "8080:8080"   # public OpenID4VCI / OAuth endpoints
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
    environment:
      - VC_CONFIG_YAML=config.yaml
    depends_on:
      - issuer
      - registry
      - mongo

  issuer:
    image: ghcr.io/sirosfoundation/vc/issuer:latest
    restart: always
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
    environment:
      - VC_CONFIG_YAML=config.yaml
    depends_on:
      - registry
      - mongo

  registry:
    image: ghcr.io/sirosfoundation/vc/registry:latest
    restart: always
    ports:
      - "8081:8080"   # Token Status List HTTP endpoint
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
    environment:
      - VC_CONFIG_YAML=config.yaml
    depends_on:
      - mongo

  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    restart: always
    volumes:
      - ./trust-config.yaml:/config.yaml:ro
    # go-trust binds 127.0.0.1 by default; listen on all interfaces so
    # apigw can reach it on the compose network.
    command: ["--host", "0.0.0.0", "--config", "/config.yaml"]

  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

The same `config.yaml` is mounted into all three vc services; each reads only its own section (`apigw`, `issuer`, `registry`) plus `common`. The apigw is the only service that needs to be reachable by wallets; the issuer and registry gRPC ports (`8090`) only need to be reachable from the other vc services. See [Go-Trust configuration](/sirosid/trust/go-trust-configuration) for `trust-config.yaml`.

### With SAML Support

For SAML IdP authentication, also mount the SAML SP certificate and key into the **apigw** service (the SAML SP runs in apigw):

```yaml
services:
  apigw:
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
      - ./saml:/saml:ro  # SAML SP keys and IdP metadata
    # ... rest of configuration
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

- [ ] Generated signing keys (`pki/signing_ec_private.pem`)
- [ ] Created VCTM files for each credential type (`metadata/*.json`)
- [ ] Configured your IdP to allow the issuer as a client
- [ ] Set up MongoDB (or have connection details for existing instance)
- [ ] Configured external URL and TLS termination
- [ ] Configured trust evaluation via a go-trust PDP (required for production)

## Next Steps

- [Configuration Guide](./issuer) – Detailed configuration options
- [OIDC Provider Integration](./oidc-op) – Connect OIDC identity providers
- [SAML IdP Integration](./saml-idp) – Connect SAML federations
- [Keycloak Integration](./keycloak_issuer) – Use Keycloak as authentication backend
