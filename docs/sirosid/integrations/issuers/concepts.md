---
sidebar_position: 0
sidebar_label: Concepts & Architecture
---

# Issuer Concepts & Architecture

This document provides a conceptual introduction to the SIROS ID Issuer, explaining key concepts, components, and deployment models. For hands-on configuration, see [Issuing Credentials](./issuer).

## What is a Credential Issuer?

A **credential issuer** is a service that creates digitally signed credentials and delivers them to user wallets. The issuer acts as a bridge between your existing identity infrastructure and the emerging world of verifiable credentials.

```mermaid
flowchart LR
    subgraph "Your Organization"
        IdP[Identity Provider]
        AS[Authoritative Sources<br/>HR, Student Info, etc.]
    end

    subgraph "Credential Issuer"
        Auth[Authentication<br/>Layer]
        Constructor[Credential<br/>Constructor]
        Signer[Signing<br/>Service]
    end

    Wallet[User Wallet]

    IdP -->|User Identity| Auth
    AS -.->|Attributes| Constructor
    Auth --> Constructor
    Constructor --> Signer
    Signer -->|Signed Credential| Wallet
```

The issuer:
- **Authenticates** users via existing identity providers (SAML, OIDC)
- **Collects** claims from your authoritative sources
- **Constructs** credentials following standardized schemas
- **Signs** credentials using cryptographic keys
- **Delivers** credentials to user wallets via OID4VCI protocol

## Core Concepts

### Verifiable Credentials

A **verifiable credential** is a tamper-evident digital document that makes claims about a subject (typically a person). Like a physical credential (passport, ID card, diploma), it contains:

| Component | Description | Example |
|-----------|-------------|---------|
| **Issuer** | Who issued the credential | `https://issuer.example.org` |
| **Subject** | Who the credential is about | The holder's identifier |
| **Claims** | Statements about the subject | Name, birth date, etc. |
| **Proof** | Cryptographic signature | Digital signature + public key |
| **Validity** | When the credential is valid | Issue date, expiration |

```mermaid
graph TB
    subgraph Credential
        H[Header<br/>Format, Algorithm]
        C[Claims<br/>Subject data]
        S[Signature<br/>Cryptographic proof]
    end

    H --> C --> S

    subgraph "Trust Chain"
        PK[Issuer Public Key]
        TSL[Trust List / Federation]
    end

    S -.->|Verify with| PK
    PK -.->|Trusted via| TSL
```

### Credential Formats

The SIROS ID Issuer supports multiple credential formats to meet different use cases:

| Format | Standard | Best For | Selective Disclosure |
|--------|----------|----------|---------------------|
| **SD-JWT VC** | [IETF SD-JWT VC](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/) | EU Digital Identity, general use | ✅ Yes |
| **mDL/mDoc** | [ISO 18013-5](https://www.iso.org/standard/69084.html) | Mobile driving licenses | ✅ Yes |
| **JWT VC** | [W3C VC Data Model](https://www.w3.org/TR/vc-data-model/) | Legacy systems | ❌ No |

:::tip Recommended Format
**SD-JWT VC** is the recommended format for new deployments. It provides selective disclosure (users can share only necessary claims) and is the format specified by the EU Digital Identity Wallet Architecture Reference Framework (ARF).
:::

### Credential Types

A **credential type** defines the schema and semantics of a credential. Each type specifies:

- **VCT (Verifiable Credential Type)**: A unique identifier (URN or URL)
- **Claims**: What information the credential contains
- **Display**: How to present the credential in wallets
- **Trust framework**: Which authorities can issue it

```mermaid
graph LR
    subgraph "Credential Type Definition (VCTM)"
        VCT[VCT Identifier<br/>"urn:eudi:pid:1"]
        Claims[Claim Schema<br/>given_name, family_name, ...]
        Display[Display Rules<br/>Labels, logos, templates]
    end

    VCT --> Claims
    VCT --> Display

    subgraph "Issued Credential"
        Instance[Credential Instance<br/>with actual values]
    end

    Claims -->|instantiate| Instance
```

#### VCTM (Verifiable Credential Type Metadata)

Each credential type is defined by a **VCTM file** that specifies:

```json
{
  "vct": "urn:eudi:pid:1",
  "name": "Person Identification Data",
  "description": "EU Person Identification Data credential",
  "display": [
    {
      "lang": "en-US",
      "name": "PID",
      "rendering": {
        "svg_templates": [...]
      }
    }
  ],
  "claims": [
    {
      "path": ["given_name"],
      "mandatory": true,
      "sd": "always",
      "display": [{"lang": "en-US", "label": "First name"}]
    }
  ]
}
```

#### Built-in Credential Types

SIROS ID includes pre-configured types based on EU standards:

| Type | VCT | Description |
|------|-----|-------------|
| **PID** | `urn:eudi:pid:1` | Person Identification Data (EU ARF) |
| **EHIC** | `urn:eudi:ehic:1` | European Health Insurance Card |
| **PDA1** | `urn:eudi:pda1:1` | Portable Document A1 |
| **Diploma** | `urn:eudi:diploma:1` | Educational credentials |
| **ELM** | `urn:eudi:elm:1` | European Learning Model |
| **Microcredential** | (configurable) | Short learning achievements |

### Credential Constructor

The **credential constructor** is the component that transforms user identity data into credential claims. It:

1. Receives authenticated user attributes (from SAML/OIDC)
2. Maps external attributes to credential claims
3. Applies transformations and defaults
4. Validates against the VCTM schema
5. Produces the claim set for signing

```yaml
# Example: Map SAML attributes to PID claims
credential_constructor:
  pid:
    vct: "urn:eudi:pid:1"
    vctm_file_path: "/metadata/vctm_pid.json"
    attributes:
      given_name:
        source: ["$.claims.given_name", "$.saml.urn:oid:2.5.4.42"]
      family_name:
        source: ["$.claims.family_name", "$.saml.urn:oid:2.5.4.4"]
      birthdate:
        source: ["$.claims.birthdate"]
        transform: "date_iso8601"
```

## Issuer Components

The SIROS ID Issuer is built as a modular system with distinct components:

```mermaid
flowchart TB
    subgraph "SIROS ID Issuer"
        subgraph "API Gateway (apigw)"
            HTTP[HTTP Server<br/>OID4VCI Endpoints]
            SAML[SAML SP]
            OIDC[OIDC RP]
            Session[Session Manager]
        end

        subgraph "Issuer Core"
            API[Issuer API]
            Construct[Credential Constructor]
            Sign[Signing Service]
            Audit[Audit Log]
        end

        subgraph "Registry"
            Status[Status Lists<br/>Revocation]
            Store[Credential Store]
        end
    end

    External[External IdP<br/>SAML/OIDC]
    Wallet[User Wallet]
    HSM[HSM / Key Store]

    External -->|Auth| SAML
    External -->|Auth| OIDC
    SAML --> Session
    OIDC --> Session
    Session --> HTTP
    HTTP -->|OID4VCI| Wallet

    HTTP --> API
    API --> Construct
    Construct --> Sign
    Sign --> HSM

    API --> Status
    API --> Audit
```

### Component Descriptions

| Component | Purpose | Protocol/Standard |
|-----------|---------|-------------------|
| **HTTP Server** | Exposes OID4VCI endpoints | OpenID4VCI |
| **SAML SP** | Service Provider for SAML federations | SAML 2.0 |
| **OIDC RP** | Relying Party for OIDC providers | OpenID Connect |
| **Session Manager** | OAuth2 session and state management | OAuth 2.0 |
| **Issuer API** | Core credential operations | gRPC + REST |
| **Credential Constructor** | Builds credentials from claims | Internal |
| **Signing Service** | Cryptographic signing (SW or HSM) | JWS, COSE |
| **Status Lists** | Revocation status tracking | Token Status List |
| **Audit Log** | Compliance and monitoring | Internal |

### Service Architecture

The issuer can run as a single process or as separate microservices:

```mermaid
flowchart LR
    subgraph "Single Process Mode"
        Combined[apigw + issuer + registry]
    end

    subgraph "Microservices Mode"
        APIGW[API Gateway]
        Issuer[Issuer Service]
        Registry[Registry Service]

        APIGW -->|gRPC| Issuer
        Issuer -->|gRPC| Registry
    end
```

## Deployment Models

Choose a deployment model based on your requirements:

### Model 1: SIROS ID Hosted (SaaS)

Use the SIROS ID cloud platform with minimal configuration.

```mermaid
flowchart LR
    subgraph "Your Infrastructure"
        IdP[Your Identity Provider]
    end

    subgraph "SIROS ID Cloud"
        Issuer[Managed Issuer<br/>app.siros.org/tenant/issuer]
        Trust[Trust Services]
    end

    Wallet[User Wallets]

    IdP -->|SAML/OIDC| Issuer
    Issuer -->|OID4VCI| Wallet
    Issuer -.-> Trust
```

| Aspect | Details |
|--------|---------|
| **Setup** | Minutes – configure via SIROS ID portal |
| **Maintenance** | Fully managed by SIROS |
| **Data location** | SIROS ID cloud infrastructure |
| **Customization** | Credential types, branding |
| **Best for** | Quick deployment, SaaS model |

### Model 2: Self-Hosted (On-Premise)

Deploy the full issuer stack in your own infrastructure.

```mermaid
flowchart TB
    subgraph "Your Infrastructure"
        subgraph "Identity Layer"
            IdP[Identity Provider]
        end

        subgraph "Issuer Stack"
            LB[Load Balancer / Ingress]
            APIGW[API Gateway]
            Issuer[Issuer Service]
            Registry[Registry Service]
            Mongo[(MongoDB)]
        end

        subgraph "Security"
            HSM[HSM / Key Vault]
            PKI[PKI Infrastructure]
        end
    end

    External[External Wallets]

    IdP --> APIGW
    LB --> APIGW
    APIGW --> Issuer
    Issuer --> Registry
    Registry --> Mongo
    Issuer --> HSM
    External -->|OID4VCI| LB
```

| Aspect | Details |
|--------|---------|
| **Setup** | Hours to days – deploy containers/VMs |
| **Maintenance** | Your operations team |
| **Data location** | Your infrastructure |
| **Customization** | Full control over all components |
| **Best for** | Data sovereignty, compliance, custom integrations |

### Model 3: Hybrid

Combine hosted and self-hosted components.

```mermaid
flowchart LR
    subgraph "Your Infrastructure"
        IdP[Identity Provider]
        Issuer[Self-Hosted Issuer]
        HSM[HSM with Keys]
    end

    subgraph "SIROS ID Cloud"
        Trust[Trust Services]
        Status[Status Lists]
    end

    Wallet[User Wallets]

    IdP --> Issuer
    Issuer --> HSM
    Issuer -.->|AuthZEN| Trust
    Issuer -.->|Revocation| Status
    Issuer -->|OID4VCI| Wallet
```

| Aspect | Details |
|--------|---------|
| **Setup** | Variable |
| **Maintenance** | Shared responsibility |
| **Data location** | Credentials on-premise, trust in cloud |
| **Customization** | Selective control |
| **Best for** | Regulated environments with external trust requirements |

### Model 4: Standalone Issuer

Minimal deployment for testing or air-gapped environments.

```mermaid
flowchart LR
    subgraph "Single Server"
        All[Issuer + Registry<br/>Embedded MongoDB]
    end

    TestWallet[Test Wallet]
    TestWallet <-->|OID4VCI| All
```

| Aspect | Details |
|--------|---------|
| **Setup** | Minutes – single Docker container |
| **Maintenance** | Minimal |
| **Data location** | Local |
| **Customization** | Development/testing |
| **Best for** | Development, demos, isolated testing |

## Deployment Decision Matrix

| Requirement | Hosted | Self-Hosted | Hybrid | Standalone |
|-------------|:------:|:-----------:|:------:|:----------:|
| Quick setup | ✅ | ❌ | ⚠️ | ✅ |
| Data sovereignty | ❌ | ✅ | ⚠️ | ✅ |
| HSM key storage | ⚠️ | ✅ | ✅ | ❌ |
| Custom trust | ⚠️ | ✅ | ✅ | ❌ |
| High availability | ✅ | ⚠️ | ⚠️ | ❌ |
| Zero maintenance | ✅ | ❌ | ⚠️ | ✅ |
| GDPR compliance | ⚠️ | ✅ | ✅ | ✅ |

Legend: ✅ Excellent | ⚠️ Possible with effort | ❌ Not recommended

## Security Considerations

### Key Management

The issuer's signing keys are the most critical security asset:

```mermaid
flowchart TB
    subgraph "Key Options"
        SW[Software Keys<br/>File-based, encrypted]
        HSM[HSM Keys<br/>PKCS#11 interface]
    end

    subgraph "Security Level"
        Dev[Development]
        Prod[Production]
        High[High Assurance]
    end

    SW --> Dev
    HSM --> Prod
    HSM --> High
```

| Environment | Recommended Key Storage |
|-------------|------------------------|
| Development | Software keys (encrypted file) |
| Production | HSM via PKCS#11 |
| High Assurance | Certified HSM (eIDAS QSCD) |

### Trust Chain

Credentials are only valuable if verifiers can trust them:

```mermaid
flowchart LR
    Cred[Issued Credential]
    PK[Issuer Public Key]
    Cert[X.509 Certificate]
    TSL[ETSI Trust List]

    Cred -->|signed by| PK
    PK -->|bound to| Cert
    Cert -->|registered in| TSL
```

See [Trust Services](../trust/) for configuring trust frameworks.

## Next Steps

Now that you understand the concepts:

1. **[Issuing Credentials](./issuer)** – Configure and deploy your issuer
2. **[SAML IdP Integration](./saml-idp)** – Connect SAML federations
3. **[OIDC Provider Integration](./oidc-op)** – Connect OIDC providers
4. **[Trust Services](../trust/)** – Configure trust frameworks
