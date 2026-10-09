---
sidebar_position: 6
sidebar_label: Deployment
---

# Verifier Deployment

This page describes the Docker images and configuration files required to deploy a SIROS ID credential verifier. For conceptual background, see [Concepts & Architecture](./concepts). For detailed configuration examples, see [Configuration](./verifier).

## Docker Images

The verifier deployment uses the following container images:

| Image | Purpose | Required |
|-------|---------|:--------:|
| `ghcr.io/sirosfoundation/vc/verifier` | Credential verifier service (includes SAML & all format support) | ✅ |
| `mongo:7` | Database for sessions and state | ✅ |
| `ghcr.io/sirosfoundation/go-trust` | Trust evaluation (AuthZEN PDP) | ✅ for production |

For complete image documentation, see [Docker Images](/sirosid/operations/docker-images).

:::danger A PDP is required for production
A trust Policy Decision Point (AuthZEN, for example go-trust) is required for
production use. Without `verifier.trust.pdp_url` the verifier runs in "allow
all" mode: every issuer is trusted, and only self-contained `did:key` and
`did:jwk` identifiers are resolved (locally); other DID methods cannot be
resolved. That mode may work for some things but is not supported: use it only
for development and testing, with no guarantees.
:::

## Directory Structure

A typical verifier deployment has the following structure:

```
verifier/
├── docker-compose.yaml          # Container orchestration
├── config.yaml                  # Main verifier configuration
├── secrets.yaml                 # Secrets (subject_salt), mode 0600
├── trust-config.yaml            # go-trust configuration (the PDP)
├── pki/
│   ├── verifier_key.pem         # Verifier signing key (JAR + OIDC tokens)
│   └── verifier_chain.pem       # Certificate chain for x509_san_dns
├── metadata/                    # VCTM files named in common.credential_metadata
│   ├── vctm_pid.json
│   └── vctm_ehic.json
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
| `verifier.api_server` | HTTP server settings (port, TLS) |
| `verifier.public_url` | Public URL of the verifier |
| `verifier.key_config` | Signing key used for JARs, the OIDC OP and `/jwks` |
| `verifier.inbound.openid4vp` | OpenID4VP settings (token endpoint, supported credentials, wallet-facing clients) |
| `verifier.outbound.oidc_provider` | OIDC provider settings (issuer, code and token durations, subject type) |
| `verifier.trust` | Trust evaluation endpoint (go-trust PDP) |
| `verifier.digital_credentials` | W3C Digital Credentials API settings |
| `common.credential_metadata` | Credential types the verifier can request (required) |
| `common.mongo` | MongoDB connection settings (or `common.sql` for a SQL primary store) |
| `common.secret_file_path` | Secrets file (`subject_salt`, static client secrets) |

:::note `verifier_proxy` no longer exists
The standalone verifier-proxy service was merged into the verifier
([vc ADR 06](https://github.com/SUNET/vc/blob/main/docs/adr/06-merge-verifier-components.md)).
Everything now lives under the single `verifier:` top-level key, with the
inbound (wallet-facing OpenID4VP) and outbound (RP-facing OIDC OP) halves split
into `inbound:` and `outbound:`.
:::

```yaml
# Minimal config.yaml; this passes the verifier's startup validation
common:
  mongo:
    uri: mongodb://mongo:27017
  secret_file_path: "/etc/vc/secrets.yaml"
  credential_metadata:
    pid:
      vctm_file_path: "/metadata/vctm_pid.json"
      format: "dc+sd-jwt"

verifier:
  api_server:
    addr: :8080
  public_url: "https://verifier.example.org"

  key_config:
    private_key_path: "/pki/verifier_key.pem"
    chain_path: "/pki/verifier_chain.pem"

  inbound:
    openid4vp:
      token_endpoint: "https://verifier.example.org/token"
      presentation_requests_dir: "/presentation_requests"
      supported_credentials:
        - vct: "urn:eudi:pid:1"
          scopes: ["pid"]
      # Required. Its scopes must match those in supported_credentials
      clients:
        "default":
          type: "public"
          redirect_uri: "https://verifier.example.org/"
          scopes: ["pid"]

  outbound:
    oidc_provider:
      issuer: "https://verifier.example.org"
      subject_type: "pairwise"
      # Overwritten by the value in the secrets file
      subject_salt: "set-in-secrets-file"

  # Required for production. Omitting pdp_url means allow-all trust and
  # local-only key resolution: development and testing only, not supported.
  trust:
    pdp_url: "http://go-trust:6001"
```

The verifier refuses to start if `common.credential_metadata` is empty, if
`token_endpoint` or `clients` is missing, or if the scopes in
`supported_credentials` and `clients` do not match each other. The VCTM files
can be copied from the `metadata/` directory of the
[vc repository](https://github.com/SUNET/vc). See
[Verifier Configuration](./verifier#verifier-configuration) for the complete
example including `secrets.yaml`.

The full key list is in the
[VC Configuration Reference](/sirosid/reference/vc-configuration).

### Presentation Request Files (presentation_requests/*.yaml)

Define what credentials and claims are requested for different verification scenarios.

Each file holds a `templates:` list. A template binds a set of OIDC scopes to
a DCQL query and says how the resulting claims map into the ID token.

| Field | Purpose |
|-------|---------|
| `templates[].id` | Template identifier (required, unique) |
| `templates[].name` | Human-readable name (required) |
| `templates[].oidc_scopes` | Scopes that select this template (required, at least one) |
| `templates[].dcql.credentials` | DCQL credential queries |
| `templates[].dcql.credentials[].format` | Credential format (`dc+sd-jwt`, `mso_mdoc`) |
| `templates[].dcql.credentials[].meta.vct_values` | Accepted credential type identifiers |
| `templates[].dcql.credentials[].claims` | Requested claims, as path arrays |
| `templates[].claim_mappings` | Credential claim → OIDC claim (required; `"*": "*"` passes everything through) |

```yaml
# presentation_requests/pid_basic.yaml
templates:
  - id: "pid_basic"
    name: "PID - Basic Profile"
    description: "Request basic personal identification data"
    version: "1.0"
    oidc_scopes:
      - "pid"
      - "profile"
    dcql:
      credentials:
        - id: identity
          format: dc+sd-jwt
          meta:
            vct_values:
              - urn:eudi:pid:1
          claims:
            - path: ["given_name"]
            - path: ["family_name"]
            - path: ["birthdate"]
    claim_mappings:
      given_name: "given_name"
      family_name: "family_name"
      birthdate: "birthdate"
```

All templates in the directory are active. A template's `enabled` field cannot
disable it (`enabled: false` is overridden to `true` on load); remove the file
instead.

Point the verifier at the directory with
`verifier.inbound.openid4vp.presentation_requests_dir`.

### trust-config.yaml (for go-trust)

Configuration for the trust evaluation service.

| Section | Purpose |
|---------|---------|
| `server` | Listen host/port |
| `registries.etsi` | ETSI Trust Status List sources |
| `registries.oidfed` | OpenID Federation trust anchors |
| `policies` | Per-role trust constraints |

```yaml
# trust-config.yaml
server:
  host: "0.0.0.0"
  port: "6001"

registries:
  etsi:
    enabled: true
    # http(s) sources need allow_network_access; a pre-extracted
    # cert_bundle is preferred in production.
    allow_network_access: true
    tsl_urls:
      - "https://ec.europa.eu/tools/lotl/eu-lotl.xml"

  oidfed:
    enabled: true
    trust_anchors:
      - entity_id: "https://trust.example.org"
```

See the [Go-Trust Configuration Reference](/sirosid/trust/go-trust-configuration)
for every key.

### PKI Files

| File | Purpose | Format |
|------|---------|--------|
| `verifier_key.pem` | Signs JARs, OIDC ID tokens and access tokens; published at `/jwks` | PEM (EC or RSA) |
| `verifier_chain.pem` | Certificate chain sent as `x5c` when `client_id_scheme` is `x509_san_dns` | PEM |

Both are configured under `verifier.key_config`
(`private_key_path` / `chain_path`). A PKCS#11 HSM can be used instead, via
`verifier.key_config.pkcs11`.

With the default `client_id_scheme: x509_san_dns` the certificate chain must
contain a certificate whose DNS subject alternative name covers the host of
`verifier.public_url`; otherwise wallets reject the request objects.

#### Generate Signing Keys

```bash
# EC P-256 key (recommended)
openssl ecparam -name prime256v1 -genkey -noout -out pki/verifier_key.pem

# RSA 2048 key (alternative)
openssl genrsa -out pki/verifier_key.pem 2048

# Development only: self-signed certificate with a DNS SAN for the public host.
# In production use a certificate chain issued by a CA your wallets trust.
openssl req -x509 -new -key pki/verifier_key.pem -sha256 -days 365 \
  -subj "/CN=verifier.example.org" \
  -addext "subjectAltName=DNS:verifier.example.org" \
  -out pki/verifier_chain.pem
```

## docker-compose.yaml

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc/verifier:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./secrets.yaml:/etc/vc/secrets.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
      - ./presentation_requests:/presentation_requests:ro
    environment:
      - VC_CONFIG_YAML=/config.yaml
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

This stack has no PDP and is suitable for development and testing only: remove
`verifier.trust.pdp_url` from the configuration above or add the go-trust
service below.

### With Trust Evaluation (Required for Production)

Add the go-trust service, the AuthZEN PDP that `verifier.trust.pdp_url` points
at:

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc/verifier:latest
    # ... verifier configuration
    depends_on:
      - mongo
      - go-trust

  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    restart: always
    ports:
      - "6001:6001"
    volumes:
      - ./trust-config.yaml:/config.yaml:ro
    command: ["--config", "/config.yaml"]

  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### With VC 2.0 / SAML Support

SAML and all credential format support is included in the standard image.

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VC_CONFIG_YAML` | Path to configuration file | `config.yaml` |
| `SSL_CERT_FILE` | CA bundle Go's `crypto/x509` should trust, for inter-service HTTPS with private CAs | — |

These are the only two environment variables the vc services read; everything
else is configured in the YAML file. In particular there is no `MONGO_URI` or
`SUBJECT_SALT` variable — use `common.mongo.uri` and
`verifier.outbound.oidc_provider.subject_salt`.

:::warning Secrets Management
`subject_salt` generates pairwise subject identifiers. Keep it secret and
consistent across deployments to maintain user identifier stability. Put it in
the secrets file referenced by `common.secret_file_path` rather than in the
main config, and mount it with a secrets manager in production. The secrets
file must not be readable by group or others (mode `0600` or `0400`); the
verifier refuses to start otherwise, unless `common.skip_secrets_perm_check` is
`true`. This also applies to Kubernetes Secret volumes, whose default mode
is `0644`.
:::

## Deployment Checklist

Before deploying, ensure you have:

- [ ] Generated the verifier signing key and chain (`verifier.key_config`)
- [ ] Copied the VCTM files and configured `common.credential_metadata`
- [ ] Defined presentation requests for your use cases
- [ ] Set up MongoDB, or a SQL database via `common.sql` (or have connection details for an existing instance)
- [ ] Configured external URL and TLS termination
- [ ] Generated a secure `subject_salt` for pairwise identifiers
- [ ] Configured trust evaluation via go-trust (`verifier.trust.pdp_url`); required for production
- [ ] Registered clients or configured dynamic client registration

## Next Steps

- [Configuration Guide](./verifier) – Detailed configuration options
- [Keycloak Integration](./keycloak_verifier) – Add as Keycloak identity provider
- [Direct OIDC Integration](./oidc-rp) – Integrate as OIDC relying party
- [Trust Services](../trust/) – Configure trust framework evaluation
