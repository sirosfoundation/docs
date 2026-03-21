---
sidebar_position: 1
sidebar_label: Overview
---

# Trust Services

A digital credential ecosystem requires mechanisms for issuers, wallets, and verifiers to recognize and trust each other. This is called **technical trust management**. SIROS ID supports multiple trust frameworks to meet different regulatory and deployment requirements.

:::tip Go-Trust Abstraction Layer
For production deployments, we recommend using **[Go-Trust](./go-trust)** as a trust abstraction layer. Go-Trust provides a unified AuthZEN API that handles the complexity of ETSI TSL, ETSI LoTE, OpenID Federation, and DID resolution, so your services don't need to implement trust logic directly.
:::

## Why Trust Matters

When a verifier receives a credential, it needs to answer:

1. **Is the issuer legitimate?** – Was this credential issued by an authorized entity?
2. **Is the credential valid?** – Has it been revoked or expired?
3. **Is the wallet trusted?** – Is the presenting wallet a recognized credential manager?

Trust services provide the infrastructure to answer these questions automatically.

## Trust Architecture

```mermaid
flowchart TD
    subgraph Services
        Issuer[Issuer Service]
        Verifier[Verifier Service]
    end
    
    subgraph "Go-Trust (AuthZEN PDP)"
        API["/evaluation"]
        ETSI[ETSI Registry]
        LOTE[LoTE Registry]
        OIDF[OpenID Fed Registry]
        DID[DID:web Registry]
        DIDVH[DID:webvh Registry]
        IACA[mDOC IACA Registry]
    end
    
    subgraph "Trust Sources"
        TSL[(EU Trust Lists)]
        LJSON[(LoTE JSON)]
        Fed[(Federation Anchors)]
        Web[(DID Documents)]
        Log[(DID Logs)]
        CA[(IACA Certificates)]
    end
    
    Issuer -->|"Is wallet trusted?"| API
    Verifier -->|"Is issuer trusted?"| API
    
    API --> ETSI
    API --> LOTE
    API --> OIDF
    API --> DID
    API --> DIDVH
    API --> IACA
    
    ETSI --> TSL
    LOTE --> LJSON
    OIDF --> Fed
    DID --> Web
    DIDVH --> Log
    IACA --> CA
```

## Supported Trust Frameworks

### ETSI Trust Status Lists (TSL 119 612)

The EU standard for trust services. Used by eIDAS and the EU Digital Identity framework.

```mermaid
graph TD
    EU[EU Trust List] --> MS1[Member State TSL]
    EU --> MS2[Member State TSL]
    MS1 --> Issuer1[Credential Issuer]
    MS1 --> Issuer2[Credential Issuer]
    MS2 --> Issuer3[Credential Issuer]
```

**Use when:**
- Deploying in EU/EEA regulated contexts
- Interoperating with government issuers
- Requiring legal recognition under eIDAS

**Configuration:**
```yaml
trust:
  etsi_tsl:
    enabled: true
    trust_list_url: "https://ec.europa.eu/tools/lotl/eu-lotl.xml"
    cache_duration: 3600
    accepted_schemes:
      - "http://uri.etsi.org/TrstSvc/TrustedList/schemerules/EUcommon"
```

### ETSI Lists of Trusted Entities (LoTE — TS 119 602)

The JSON-based successor to ETSI TSLs. LoTE documents list trusted entities with their digital identities (X.509, JWK, or DID) and signed with JWS instead of XML Digital Signatures.

```mermaid
graph TD
    LoTE[LoTE Document] --> Entity1[Trusted Entity]
    LoTE --> Entity2[Trusted Entity]
    Entity1 --> X509[X.509 Certificate]
    Entity1 --> JWK[JWK Key]
    Entity2 --> DID[DID Identifier]
```

**Use when:**
- Deploying in modern credential ecosystems using JSON/JWS
- Needing to publish trust lists with JWK or DID identities (not just X.509)
- Converting existing ETSI TSLs to a JSON-native format
- Requiring simpler tooling (JSON vs XML+XMLDsig)

**Configuration:**
```yaml
trust:
  lote:
    enabled: true
    sources:
      - "https://example.com/lote.json"
    verify_jws: false
    refresh_interval: "1h"
```

:::info
LoTE documents can be created and published using `tsl-tool` from the [g119612](https://github.com/sirosfoundation/g119612) project. See the [LoTE Publishing Guide](./lote-publishing) for a complete walkthrough.
:::

### OpenID Federation

Dynamic trust management using OAuth 2.0 / OpenID Connect federation.

```mermaid
graph LR
    TA[Trust Anchor] --> INT[Intermediate]
    INT --> Issuer[Issuer]
    INT --> Verifier[Verifier]
    TA --> Wallet[Wallet Provider]
```

**Use when:**
- Building multi-organizational ecosystems
- Needing dynamic trust updates
- Integrating with OpenID-based infrastructure

**Configuration:**
```yaml
trust:
  openid_federation:
    enabled: true
    trust_anchors:
      - "https://federation.example.com"
    entity_configuration_path: "/.well-known/openid-federation"
```

### DID:web

Decentralized identifiers resolved via web infrastructure.

**Use when:**
- Simpler trust requirements
- Self-sovereign identity scenarios
- Rapid prototyping

**Configuration:**
```yaml
trust:
  did_web:
    enabled: true
    allowed_domains:
      - "*.example.com"
      - "issuer.trusted.org"
```

### DID:webvh (Verifiable History)

An extension of DID:web that adds cryptographic integrity through verifiable history. Each DID maintains a tamper-evident log of all changes, enabling:

- **Self-certifying identifiers (SCIDs)** – The identifier is derived from initial content
- **Version history** – Complete audit trail of DID document changes
- **Pre-rotation keys** – Secure key rotation with hash commitments
- **Witness support** – Third-party attestation of DID state

```mermaid
graph TD
    DID[did:webvh:example.com:abc123] --> Log[DID Log File]
    Log --> V1[Version 1<br/>Initial State]
    Log --> V2[Version 2<br/>Key Rotation]
    Log --> V3[Version 3<br/>Service Update]
    V1 -->|Proof| V2
    V2 -->|Proof| V3
```

**Use when:**
- You need verifiable history of DID changes
- Key rotation security is critical (pre-rotation)
- Compliance requires audit trails
- Upgrading from DID:web with stronger guarantees

**Configuration:**
```yaml
trust:
  did_webvh:
    enabled: true
    timeout: "30s"
    # Allow HTTP only for testing (HTTPS required in production)
    allow_http: false
```

**How it works:**

1. The DID resolves to a JSON Lines log file at the web location
2. Each entry contains the DID document state and a cryptographic proof
3. Go-Trust verifies the entire chain from the first entry (which establishes the SCID)
4. Key bindings are validated against the current DID document

**Specification:** [did:webvh v1.0](https://identity.foundation/didwebvh/v1.0/)

### X.509 Certificate Chains

Traditional PKI-based trust using certificate chains.

**Use when:**
- Integrating with existing PKI infrastructure
- Requiring offline verification
- Connecting to legacy systems

**Configuration:**
```yaml
trust:
  x509:
    enabled: true
    root_certificates:
      - "/certs/root-ca.pem"
    allow_self_signed: false
```

### URL Whitelist

A file-based trust model where you maintain a list of trusted entity URLs. The whitelist registry also fetches and caches each entity's JWKS to perform cryptographic key validation.

```mermaid
graph TD
    Config[Whitelist Config] --> Issuers[Approved Issuer URLs]
    Config --> Verifiers[Approved Verifier URLs]
    Request[Trust Request] --> Check{URL in list?}
    Check -->|Yes| KeyCheck{Key matches JWKS?}
    Check -->|No| Deny[✗ Not Trusted]
    KeyCheck -->|Yes| Allow[✓ Trusted]
    KeyCheck -->|No| Deny
```

**Use when:**
- You have a known, stable set of trusted partners
- You want simple, file-based trust management
- Standard JWKS metadata discovery works for your entities

**Configuration:**
```yaml
trust:
  whitelist:
    enabled: true
    config_file: "/config/trusted-entities.yaml"
    watch_file: true  # Auto-reload on changes
```

**Whitelist file format:**
```yaml
lists:
  issuers:
    - "https://issuer1.example.com"
    - "https://issuer2.example.org"
  verifiers:
    - "https://verifier.example.com"
actions:
  credential-issuer: "issuers"
  credential-verifier: "verifiers"
```

:::tip
The whitelist registry performs full key validation by fetching each entity's JWKS and computing key fingerprints. See [Go-Trust Whitelist Registry](./go-trust#whitelist-registry) for details on JWKS discovery and configuration options.
:::

## Trust Configuration

### For Issuers

Configure trust anchors that recognize your issuer:

1. **Obtain credentials** from a trust list operator
2. **Configure your signing certificate** chain
3. **Publish discovery metadata** at well-known endpoints

```yaml
issuer:
  trust:
    # Certificate chain for credential signing
    signing_chain_path: "/pki/issuer-chain.pem"
    
    # Your trust list registrations
    trust_list_entries:
      - scheme: "etsi"
        status_list_url: "https://tsl.example.eu/tsl.xml"
```

### For Verifiers

Configure which issuers to trust:

```yaml
verifier_proxy:
  trust:
    # AuthZEN PDP URL — when set, operates in "default deny" mode
    pdp_url: "http://go-trust:6001"
    
    # Optional: restrict accepted signature algorithms
    allowed_signature_algorithms:
      - "ES256"
      - "ES384"
      - "EdDSA"
```

When `pdp_url` is configured, the verifier delegates all trust decisions to Go-Trust. When omitted, the verifier operates in "allow all" mode. Trust policies (which registries, ETSI service types, etc.) are configured in Go-Trust, not in the verifier itself.

### For Wallet Providers

Register your wallet with trust frameworks:

1. **Generate attestation key pair**
2. **Obtain wallet attestation** from an approved body
3. **Configure attestation in wallet backend**

```yaml
wallet:
  attestation:
    enabled: true
    key_path: "/keys/wallet-attestation.pem"
    attestation_endpoint: "https://attestation.siros.org"
```

## Trust Evaluation Flow

When verifying a credential:

```mermaid
sequenceDiagram
    participant V as Verifier
    participant TS as Trust Service
    participant TSL as Trust List
    
    V->>TS: Verify issuer trust
    TS->>TSL: Fetch current trust list
    TSL->>TS: Trust list data
    TS->>TS: Validate issuer certificate
    TS->>TS: Check service status (active/revoked)
    TS->>V: Trust decision
```

## Multi-Framework Support

SIROS ID can use multiple trust frameworks simultaneously with priority ordering:

```yaml
trust:
  frameworks:
    - type: "etsi_tsl"
      priority: 1
      # ... config
    - type: "openid_federation"
      priority: 2
      # ... config
    - type: "x509"
      priority: 3
      # ... config
  
  # How to handle multiple matches
  policy: "first_match"  # or "all_must_match", "any_match"
```

## Testing Trust

### Development Mode

For development, you can temporarily disable strict trust:

```yaml
trust:
  development_mode: true  # ⚠️ Never use in production
  allow_self_signed: true
```

## Troubleshooting

### "Issuer not trusted"

1. Check issuer certificate chain is complete
2. Verify trust list URL is accessible
3. Confirm issuer is active in trust list (not revoked)
4. Check certificate validity dates

### "Trust list fetch failed"

1. Verify network connectivity to trust list
2. Check for certificate errors (CA trust)
3. Increase timeout settings
4. Enable trust list caching

### "Certificate chain invalid"

1. Ensure intermediate certificates are included
2. Verify certificate order (leaf → root)
3. Check for expired certificates
4. Validate against trust anchor

## Best Practices

1. **Enable caching**: Trust lists don't change frequently
2. **Monitor expiry**: Set alerts for certificate expiration
3. **Use multiple frameworks**: Provide redundancy
4. **Audit trust decisions**: Log all trust evaluations
5. **Regular updates**: Keep trust list URLs current
6. **Use Go-Trust**: Abstract trust complexity behind AuthZEN API

## Next Steps

- [Go-Trust AuthZEN Service](./go-trust.md) – Deploy trust abstraction layer
- [Quick Start Guide](../quickstart)
- [Issuer Configuration](../issuers/issuer)
- [Verifier Configuration](../verifiers/verifier)
