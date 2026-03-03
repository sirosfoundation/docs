---
sidebar_position: 3
sidebar_label: Trust Infrastructure
---

# Managing Trust Infrastructure

This guide covers how to set up and manage trust infrastructure for a wallet deployment. Trust infrastructure is the foundation that enables issuers, verifiers, and wallets to establish and verify trust relationships.

:::tip Prerequisites
Before setting up trust infrastructure, ensure you understand:
- [Trust Services Overview](./index.md) – Core concepts and supported frameworks
- [Go-Trust](./go-trust.md) – The trust abstraction layer that consumes trust sources
:::

## Choosing a Trust Framework

Two primary trust frameworks are commonly used in credential ecosystems:

| Framework | Best For | Complexity | Standards |
|-----------|----------|------------|-----------|
| **ETSI TSL (X.509)** | EU/eIDAS compliance, government deployments | Medium | ETSI TS 119 612 |
| **OpenID Federation** | Dynamic ecosystems, OAuth/OIDC integration | Higher | OpenID Federation 1.0 |

You can also use both frameworks simultaneously with Go-Trust acting as the unifying abstraction layer.

---

## X.509 / ETSI Trust Status Lists

ETSI Trust Status Lists (TSLs) provide a standardized way to publish and consume trust information based on X.509 certificates. This approach is mandated by eIDAS and the EU Digital Identity framework.

### Architecture Overview

```mermaid
flowchart TD
    subgraph "Trust Infrastructure"
        CA[Certificate Authority]
        TSL[Trust Status List]
        CDN[CDN / Distribution]
    end
    
    subgraph "Ecosystem Participants"
        Issuer[Credential Issuer]
        Verifier[Verifier/RP]
        Wallet[Wallet]
    end
    
    subgraph "Trust Evaluation"
        GoTrust[Go-Trust]
    end
    
    CA -->|Issues Certificates| Issuer
    CA -->|Issues Certificates| Verifier
    CA -->|Signs TSL| TSL
    TSL -->|Published via| CDN
    
    GoTrust -->|Fetches| CDN
    GoTrust -->|Validates| Issuer
    GoTrust -->|Validates| Verifier
    Wallet -->|Queries| GoTrust
```

### Components Required

1. **Certificate Authority (CA)** – Issues certificates to ecosystem participants
2. **Trust Status List (TSL)** – XML document listing trusted services and their certificates
3. **TSL Signing Key** – Private key used to sign the TSL (typically an HSM)
4. **Distribution Point** – Web server or CDN to publish the TSL

### Setting Up a Certificate Authority

For production, use an established CA or set up a proper PKI. For development/testing:

```bash
# Generate CA private key
openssl ecparam -genkey -name prime256v1 -out ca-key.pem

# Generate CA certificate
openssl req -new -x509 -key ca-key.pem -out ca-cert.pem -days 365 \
    -subj "/CN=My Trust Anchor CA/O=Example Org/C=SE"

# Issue a certificate for an issuer
openssl ecparam -genkey -name prime256v1 -out issuer-key.pem
openssl req -new -key issuer-key.pem -out issuer.csr \
    -subj "/CN=issuer.example.com/O=Example Issuer/C=SE"
openssl x509 -req -in issuer.csr -CA ca-cert.pem -CAkey ca-key.pem \
    -CAcreateserial -out issuer-cert.pem -days 365
```

### Generating Trust Status Lists with tsl-tool

The [g119612](https://github.com/sirosfoundation/g119612) project provides `tsl-tool`, a command-line tool for generating and processing ETSI TS 119 612 Trust Status Lists.

#### Installation

```bash
# Clone and build
git clone https://github.com/sirosfoundation/g119612.git
cd g119612
make build

# The binary is at ./tsl-tool
```

#### Creating a TSL Pipeline

Create a YAML pipeline configuration to generate your TSL:

```yaml
# generate-tsl.yaml
- generate:
    # TSL metadata
    - scheme-name: "Example Trust Scheme"
    - scheme-operator: "Example Organization"
    - scheme-territory: "SE"
    - tsl-type: "http://uri.etsi.org/TrstSvc/TrustedList/TSLType/EUgeneric"
    
    # TSL signing
    - signing-key: "/path/to/tsl-signing-key.pem"
    - signing-cert: "/path/to/tsl-signing-cert.pem"
    
    # Trust service providers
    - providers:
        - name: "Example Issuer"
          trade-name: "Example Issuer Inc."
          services:
            - type: "http://uri.etsi.org/TrstSvc/Svctype/EDS/Q"
              name: "Qualified Electronic Delivery Service"
              status: "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/granted"
              certificate: "/path/to/issuer-cert.pem"
              start-date: "2024-01-01T00:00:00Z"

- publish:
    - /var/www/html/tsl
    - my-trust-list.xml
```

#### Running the Pipeline

```bash
# Generate and publish the TSL
./tsl-tool --log-level info generate-tsl.yaml

# With debug output
./tsl-tool --log-level debug generate-tsl.yaml
```

#### Processing Existing TSLs

You can also use `tsl-tool` to fetch, transform, and republish existing TSLs:

```yaml
# process-eu-tsl.yaml

# Configure HTTP client
- set-fetch-options:
    - user-agent: TSL-Tool/1.0
    - timeout: 60s

# Load the EU List of Trusted Lists
- load:
    - https://ec.europa.eu/tools/lotl/eu-lotl.xml

# Follow references to member state TSLs
- select:
    - reference-depth: 2

# Generate HTML documentation
- transform:
    - embedded: tsl-to-html.xslt
    - /var/www/html/trust-lists
    - html

# Create an index page
- generate_index:
    - /var/www/html/trust-lists
    - "EU Trust Lists"
```

### Publishing Your TSL

1. **Host on a reliable endpoint** – Use HTTPS with a valid certificate
2. **Enable caching** – TSLs change infrequently; set appropriate cache headers
3. **Consider a CDN** – For high-availability deployments
4. **Set up monitoring** – Alert on expiring TSLs or certificates

```nginx
# Example nginx configuration
location /trust-list.xml {
    root /var/www/html/tsl;
    add_header Cache-Control "public, max-age=3600";
    add_header Content-Type "application/xml";
}
```

### Configuring Go-Trust to Use Your TSL

```yaml
# go-trust config.yaml
registries:
  - type: etsi_tsl
    config:
      trust_list_url: "https://tsl.example.org/trust-list.xml"
      cache_ttl: 1h
      verify_signatures: true
      accepted_service_types:
        - "http://uri.etsi.org/TrstSvc/Svctype/EDS/Q"
```

---

## OpenID Federation

OpenID Federation provides dynamic, decentralized trust management where entities publish their own metadata and trust relationships are established through trust chains.

### Architecture Overview

```mermaid
flowchart TD
    subgraph "Federation Infrastructure"
        TA[Trust Anchor]
        INT[Intermediate Entity]
    end
    
    subgraph "Ecosystem Participants"
        Issuer[Credential Issuer]
        Verifier[Verifier/RP]
        Wallet[Wallet Provider]
    end
    
    subgraph "Trust Evaluation"
        GoTrust[Go-Trust]
    end
    
    TA -->|Subordinate Statement| INT
    INT -->|Subordinate Statement| Issuer
    INT -->|Subordinate Statement| Verifier
    TA -->|Subordinate Statement| Wallet
    
    GoTrust -->|Resolves Trust Chain| TA
    GoTrust -->|Validates| Issuer
    GoTrust -->|Validates| Verifier
```

### Key Concepts

| Term | Description |
|------|-------------|
| **Trust Anchor** | Root of trust; publishes entity configuration and subordinate statements |
| **Intermediate** | Optional organizational unit; can issue subordinate statements |
| **Leaf Entity** | End entity (issuer, verifier, wallet) with metadata |
| **Entity Configuration** | Self-signed JWT describing an entity's metadata |
| **Subordinate Statement** | JWT from superior entity attesting to a subordinate |
| **Trust Chain** | Chain of statements from leaf to trust anchor |
| **Trust Mark** | Attestation that an entity meets certain criteria |

### Components Required

1. **Trust Anchor Service** – Hosts federation endpoints and issues subordinate statements
2. **Entity Registration System** – Manages onboarding of participants
3. **Key Management** – Secure storage for signing keys
4. **Federation Endpoints** – Well-known endpoints for metadata discovery

### Running a Federation with Inmor

[Inmor](https://github.com/SUNET/inmor) is an open-source OpenID Federation implementation that can be used to run trust anchor and intermediate entity services.

#### Installation

```bash
# Clone the repository
git clone https://github.com/SUNET/inmor.git
cd inmor

# Follow the installation instructions in the README
# Typically involves:
# - Setting up a Python environment
# - Configuring the database
# - Setting up signing keys
```

#### Basic Configuration

Inmor requires configuration for:

1. **Entity ID** – The URL identifier for your trust anchor
2. **Signing Keys** – Keys for signing entity configurations and subordinate statements
3. **Storage** – Database for managing subordinates and trust marks
4. **Federation Policy** – Rules for what metadata policies to apply

#### Federation Endpoints

A properly configured OpenID Federation entity exposes these endpoints:

| Endpoint | Description |
|----------|-------------|
| `/.well-known/openid-federation` | Entity Configuration (self-signed JWT) |
| `/federation/fetch` | Fetch subordinate statement by entity ID |
| `/federation/list` | List all subordinate entities |
| `/federation/resolve` | Resolve complete trust chain |
| `/federation/trust_mark_status` | Check trust mark validity |

### Alternative: go-oidf-ta

For Go-based deployments, [go-oidf-ta](https://github.com/sirosfoundation/go-oidf-ta) provides a multi-tenant OpenID Federation trust anchor implementation:

```yaml
# go-oidf-ta config.yaml
server:
  port: 8080
  host: "0.0.0.0"

storage:
  type: "sqlite"  # or mongodb for production
  dsn: "file:oidf-ta.db"

trust_anchors:
  default:
    entity_id: "https://trust-anchor.example.org"
    organization_name: "Example Trust Anchor"
    signing_key_path: "/keys/ta-signing-key.pem"
```

### Registering Entities

To add an entity (issuer, verifier, wallet) to your federation:

1. **Entity provides their Entity Configuration** – A self-signed JWT with their metadata
2. **Verify entity identity** – Out-of-band verification of ownership
3. **Issue Subordinate Statement** – Sign a statement attesting to the entity
4. **Entity publishes their configuration** – At their `/.well-known/openid-federation`

### Configuring Go-Trust for OpenID Federation

```yaml
# go-trust config.yaml
registries:
  - type: openid_federation
    config:
      trust_anchors:
        - entity_id: "https://trust-anchor.example.org"
          # Optional: pin the trust anchor's public key
          jwks_uri: "https://trust-anchor.example.org/jwks.json"
      cache_ttl: 5m
      max_chain_length: 5
      description: "Example Federation"
```

---

## Combining Trust Frameworks

For production deployments, you often need to support multiple trust frameworks simultaneously:

```yaml
# go-trust config.yaml with multiple frameworks
registries:
  # ETSI TSL for EU compliance
  - type: etsi_tsl
    config:
      trust_list_url: "https://ec.europa.eu/tools/lotl/eu-lotl.xml"
      description: "EU Trust Lists"
    
  # OpenID Federation for dynamic trust
  - type: openid_federation
    config:
      trust_anchors:
        - entity_id: "https://federation.example.org"
      description: "Example Federation"
    
  # Whitelist for known partners
  - type: whitelist
    config:
      file: "/config/trusted-entities.json"
      description: "Pre-approved entities"

# Query routing
query_routing:
  resolution_strategy: first_match
  routes:
    - match:
        resource_type: "x5c"
      registries: ["etsi_tsl"]
    - match:
        resource_type: "jwk"
      registries: ["openid_federation", "whitelist"]
```

---

## Operational Considerations

### Certificate/Key Lifecycle

| Asset | Typical Validity | Renewal Strategy |
|-------|------------------|------------------|
| CA Root Certificate | 10-20 years | Plan succession well in advance |
| Intermediate CA | 5-10 years | Rotate before expiry |
| TSL Signing Key | 2-5 years | HSM-protected, ceremony for rotation |
| Entity Certificates | 1-2 years | Automated renewal (ACME) |
| Federation Signing Keys | 1-2 years | Key rollover with overlap period |

### Monitoring and Alerting

- **Certificate expiry** – Alert 30, 14, 7 days before expiry
- **TSL validity** – Monitor `nextUpdate` field
- **Federation endpoint availability** – Health checks on well-known endpoints
- **Trust chain resolution failures** – Log and alert on resolution errors

### High Availability

```mermaid
flowchart LR
    subgraph "Primary"
        TSL1[TSL Server]
        Fed1[Federation Server]
    end
    
    subgraph "Secondary"
        TSL2[TSL Server]
        Fed2[Federation Server]
    end
    
    LB[Load Balancer / CDN]
    
    LB --> TSL1
    LB --> TSL2
    LB --> Fed1
    LB --> Fed2
    
    Client[Go-Trust] --> LB
```

### Disaster Recovery

1. **Backup signing keys** – Secure, offline backup with ceremony for recovery
2. **TSL snapshots** – Keep historical versions
3. **Federation database backups** – Regular backups of subordinate registrations
4. **Documented recovery procedures** – Test periodically

---

## Next Steps

- [Go-Trust Configuration Reference](./go-trust.md) – Detailed configuration options
- [Trust Services Overview](./index.md) – Conceptual overview
- [g119612 Documentation](https://github.com/sirosfoundation/g119612) – TSL tool reference
- [Inmor Documentation](https://github.com/SUNET/inmor) – OpenID Federation server
