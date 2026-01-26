---
sidebar_position: 0
sidebar_label: Concepts & Architecture
---

# Verifier Concepts & Architecture

This document provides a conceptual introduction to the SIROS ID Verifier, explaining key concepts, components, and deployment models. For hands-on configuration, see [Verifying Credentials](./verifier).

## What is a Credential Verifier?

A **credential verifier** is a service that validates digital credentials presented by users and extracts verified claims for your applications. The verifier acts as a bridge between user wallets and your existing identity infrastructure, enabling privacy-preserving authentication based on verifiable credentials.

```mermaid
flowchart LR
    subgraph "User"
        Wallet[Digital Wallet<br/>with Credentials]
    end

    subgraph "Credential Verifier"
        Request[Presentation<br/>Request]
        Validate[Validation<br/>Engine]
        Claims[Claim<br/>Extraction]
    end

    subgraph "Your Organization"
        App[Your Application]
        IAM[IAM Platform]
    end

    Wallet -->|Present Credential| Request
    Request --> Validate
    Validate -->|Check Trust| Trust[(Trust<br/>Framework)]
    Validate --> Claims
    Claims -->|OIDC Token| IAM
    IAM --> App
```

The verifier:
- **Requests** specific credentials and claims from user wallets
- **Validates** cryptographic signatures and issuer trust
- **Checks** revocation status and credential expiration
- **Extracts** claims and maps them to standard OIDC tokens
- **Integrates** with existing IAM systems (Keycloak, Okta, etc.)

## Core Concepts

### Credential Presentation

A **credential presentation** is the process where a user shares verified claims from their wallet with a relying party. Unlike traditional authentication where users prove who they are, credential presentation proves specific attributes about the user.

```mermaid
sequenceDiagram
    participant User
    participant Wallet
    participant Verifier
    participant App as Your App

    App->>Verifier: What credentials do you need?
    Verifier->>Wallet: Request: PID with name, birthdate
    Wallet->>User: Allow sharing?
    User->>Wallet: Approve (select claims)
    Wallet->>Verifier: Presentation with SD-JWT
    Verifier->>Verifier: Validate & extract claims
    Verifier->>App: ID Token with verified claims
```

### Selective Disclosure

**Selective disclosure** allows users to share only the specific claims needed for a transaction, not the entire credential. This is a fundamental privacy feature of modern credential systems.

| Scenario | Traditional Auth | Selective Disclosure |
|----------|------------------|---------------------|
| Age verification | Show full ID | Share only "over_18: true" |
| Name verification | Share full profile | Share only "given_name" |
| Nationality check | Share passport | Share only "nationality" |

```mermaid
graph TB
    subgraph "Full Credential"
        C1[given_name: Alice]
        C2[family_name: Smith]
        C3[birth_date: 1990-01-15]
        C4[nationality: SE]
        C5[personal_number: xxx]
        C6[address: xxx]
    end

    subgraph "Selective Presentation"
        S1[given_name: Alice]
        S3[birth_date: 1990-01-15]
    end

    C1 -->|User selects| S1
    C3 -->|User selects| S3
```

### Presentation Requests

A **presentation request** specifies what credentials and claims the verifier needs. It can be defined using:

1. **OIDC Scopes** – Simple mapping (`openid profile pid`)
2. **DCQL Queries** – Fine-grained control over credential types and claims

```yaml
# DCQL Query Example
credentials:
  - id: identity_credential
    format: vc+sd-jwt
    meta:
      vct_values:
        - urn:eudi:pid:arf-1.8:1
    claims:
      - path: ["given_name"]
      - path: ["family_name"]
      - path: ["birth_date"]
```

### Trust Verification

The verifier doesn't blindly accept credentials—it validates them against a **trust framework** to ensure they come from authorized issuers.

```mermaid
flowchart LR
    subgraph "Credential"
        Sig[Signature]
        Issuer[Issuer ID]
    end

    subgraph "Verification Steps"
        V1[1. Verify Signature]
        V2[2. Resolve Issuer Key]
        V3[3. Check Trust List]
        V4[4. Check Revocation]
    end

    subgraph "Trust Framework"
        TSL[ETSI Trust List]
        Fed[OpenID Federation]
    end

    Sig --> V1
    Issuer --> V2
    V2 --> V3
    V3 --> TSL
    V3 --> Fed
    V1 --> V4
```

| Trust Source | Standard | Use Case |
|--------------|----------|----------|
| **ETSI TSL** | ETSI TS 119 612 | EU trust services |
| **OpenID Federation** | OpenID Federation 1.0 | OIDC ecosystems |
| **X.509 Chains** | RFC 5280 | Enterprise PKI |
| **DID Resolution** | W3C DID | Decentralized identity |

## Verifier Components

The SIROS ID Verifier is built as a modular system:

```mermaid
flowchart TB
    subgraph "SIROS ID Verifier"
        subgraph "OIDC Provider"
            OIDC[OIDC Endpoints]
            Session[Session Manager]
            Token[Token Service]
        end

        subgraph "OpenID4VP Engine"
            Request[Request Builder]
            QR[QR Generator]
            DC[DC API Handler]
            Response[Response Handler]
        end

        subgraph "Validation"
            SigVal[Signature Validator]
            Trust[Trust Evaluator]
            Status[Status Checker]
        end
    end

    Wallet[User Wallet]
    IAM[IAM Platform]
    GoTrust[go-trust Service]

    IAM -->|OIDC| OIDC
    OIDC --> Session
    Session --> Request
    Request -->|OpenID4VP| Wallet
    Wallet --> Response
    Response --> SigVal
    SigVal --> Trust
    Trust -->|AuthZEN| GoTrust
    SigVal --> Status
    Token --> IAM
```

### Component Descriptions

| Component | Purpose | Protocol/Standard |
|-----------|---------|-------------------|
| **OIDC Endpoints** | Standard OIDC provider interface | OpenID Connect 1.0 |
| **Session Manager** | OAuth2 session and state management | OAuth 2.0 |
| **Token Service** | Issue ID tokens with verified claims | JWT, JWS |
| **Request Builder** | Create OpenID4VP presentation requests | OpenID4VP |
| **QR Generator** | Generate QR codes for cross-device flow | - |
| **DC API Handler** | W3C Digital Credentials API support | DC API |
| **Response Handler** | Process wallet responses | OpenID4VP |
| **Signature Validator** | Verify credential signatures | SD-JWT, mDL |
| **Trust Evaluator** | Check issuer authorization | AuthZEN |
| **Status Checker** | Verify revocation status | Token Status List |

## Protocol Interfaces

The verifier exposes two primary interfaces:

### 1. OpenID Connect Provider

Standard OIDC interface that integrates with any IAM system:

```mermaid
sequenceDiagram
    participant IAM as IAM Platform
    participant Verifier
    participant Wallet

    IAM->>Verifier: GET /authorize
    Verifier->>Wallet: OpenID4VP Request
    Wallet->>Verifier: Presentation Response
    Verifier->>IAM: Authorization Code
    IAM->>Verifier: POST /token
    Verifier->>IAM: ID Token + Access Token
```

**Benefits:**
- Drop-in replacement for traditional IdPs
- No code changes to existing applications
- Works with any OIDC-compliant IAM

### 2. OpenID4VP Direct

For applications that need direct control over the verification flow:

```mermaid
sequenceDiagram
    participant App
    participant Verifier
    participant Wallet

    App->>Verifier: POST /verification/start
    Verifier->>App: session_id, qr_code, deep_link
    App->>App: Display QR or invoke DC API
    Wallet->>Verifier: POST /verification/direct_post
    App->>Verifier: GET /verification/status/{id}
    Verifier->>App: Verified claims
```

**Benefits:**
- Full control over UX
- Custom presentation logic
- Real-time status updates

## Cross-Device vs Same-Device Flow

<div className="row">
<div className="col col--6">

### Cross-Device Flow

User authenticates on a desktop browser using their mobile wallet:

```mermaid
flowchart TB
    subgraph "Desktop"
        Browser[Browser]
        QR[QR Code]
    end

    subgraph "Mobile"
        Wallet[Wallet]
    end

    Verifier[Verifier]

    Browser -->|1. Start auth| Verifier
    Verifier -->|2. QR data| Browser
    Browser --> QR
    Wallet -->|3. Scan| QR
    Wallet -->|4. Present| Verifier
    Verifier -->|5. Complete| Browser
```

</div>
<div className="col col--6">

### Same-Device Flow

User authenticates on mobile using a wallet on the same device:

```mermaid
flowchart TB
    subgraph "Mobile Device"
        Browser[Mobile Browser]
        Wallet[Wallet]
    end

    Verifier[Verifier]

    Browser -->|1. Start auth| Verifier
    Verifier -->|2. Deep link| Browser
    Browser -->|3. App switch| Wallet
    Wallet -->|4. Present| Verifier
    Verifier -->|5. Redirect| Browser
```

</div>
</div>

### W3C Digital Credentials API

Native browser integration (Chrome 116+):

```mermaid
flowchart LR
    subgraph "Browser"
        App[Web App]
        DC[DC API]
        Picker[Credential Picker]
    end

    Wallet[Wallet]
    Verifier[Verifier]

    App -->|1. navigator.credentials.get| DC
    DC -->|2. Show picker| Picker
    Picker -->|3. Select wallet| Wallet
    Wallet -->|4. Present| Verifier
    Verifier -->|5. Response| App
```

## Deployment Models

Choose a deployment model based on your requirements:

### Model 1: SIROS ID Hosted (SaaS)

Use the SIROS ID cloud platform with minimal configuration.

```mermaid
flowchart LR
    subgraph "Your Infrastructure"
        App[Your Application]
        IAM[IAM Platform]
    end

    subgraph "SIROS ID Cloud"
        Verifier[Managed Verifier<br/>verifier.id.siros.org]
        Trust[Trust Services]
    end

    Wallet[User Wallets]

    IAM -->|OIDC| Verifier
    Verifier <-->|OpenID4VP| Wallet
    Verifier -.-> Trust
```

| Aspect | Details |
|--------|---------|
| **Setup** | Minutes – register via SIROS ID portal |
| **Maintenance** | Fully managed by SIROS |
| **Data location** | SIROS ID cloud infrastructure |
| **Customization** | Presentation requests, claim mapping |
| **Best for** | Quick integration, SaaS model |

### Model 2: Self-Hosted (On-Premise)

Deploy the full verifier stack in your own infrastructure.

```mermaid
flowchart TB
    subgraph "Your Infrastructure"
        subgraph "Verifier Stack"
            LB[Load Balancer / Ingress]
            Verifier[Verifier Service]
            GoTrust[go-trust Service]
            Mongo[(MongoDB)]
        end

        subgraph "Identity Layer"
            IAM[IAM Platform]
            Apps[Applications]
        end
    end

    Wallet[User Wallets]

    Wallet -->|OpenID4VP| LB
    LB --> Verifier
    Verifier --> GoTrust
    Verifier --> Mongo
    IAM -->|OIDC| Verifier
    Apps --> IAM
```

| Aspect | Details |
|--------|---------|
| **Setup** | Hours – deploy containers/VMs |
| **Maintenance** | Your operations team |
| **Data location** | Your infrastructure |
| **Customization** | Full control over all components |
| **Best for** | Data sovereignty, compliance, custom trust |

### Model 3: Hybrid

Combine self-hosted verifier with hosted trust services.

```mermaid
flowchart LR
    subgraph "Your Infrastructure"
        Verifier[Self-Hosted Verifier]
        IAM[IAM Platform]
    end

    subgraph "SIROS ID Cloud"
        Trust[Trust Services]
    end

    Wallet[User Wallets]

    IAM --> Verifier
    Verifier <--> Wallet
    Verifier -.->|AuthZEN| Trust
```

| Aspect | Details |
|--------|---------|
| **Setup** | Variable |
| **Maintenance** | Shared responsibility |
| **Data location** | Presentations on-premise, trust in cloud |
| **Customization** | Selective control |
| **Best for** | Regulated environments needing external trust |

## Deployment Decision Matrix

| Requirement | Hosted | Self-Hosted | Hybrid |
|-------------|:------:|:-----------:|:------:|
| Quick setup | ✅ | ❌ | ⚠️ |
| Data sovereignty | ✅ | ✅ | ✅ |
| Custom trust policies | ✅ | ✅ | ✅ |
| High availability | ✅ | ⚠️ | ⚠️ |
| Zero maintenance | ✅ | ❌ | ⚠️ |
| GDPR compliance | ✅ | ✅ | ✅ |

:::info EU/EES Hosting
All SIROS ID hosted services are operated from EU/EES infrastructure, ensuring data sovereignty and GDPR compliance for European customers.
:::

Legend: ✅ Excellent | ⚠️ Possible with effort | ❌ Not recommended

## Security Considerations

### Privacy by Design

The verifier implements privacy-preserving practices:

| Feature | Description |
|---------|-------------|
| **Pairwise Identifiers** | Users get different `sub` per relying party |
| **Selective Disclosure** | Only requested claims are revealed |
| **No Credential Storage** | Presentations are validated and discarded |
| **Minimal Data** | Request only what you need |

### Trust Evaluation

Every credential is validated against configured trust frameworks:

```mermaid
flowchart TB
    Cred[Presented Credential]

    subgraph "Validation Pipeline"
        Sig[Signature Valid?]
        Trust[Issuer Trusted?]
        Status[Not Revoked?]
        Expire[Not Expired?]
        Type[Type Matches?]
    end

    Accept[Accept Claims]
    Reject[Reject]

    Cred --> Sig
    Sig -->|Yes| Trust
    Sig -->|No| Reject
    Trust -->|Yes| Status
    Trust -->|No| Reject
    Status -->|Yes| Expire
    Status -->|Revoked| Reject
    Expire -->|Valid| Type
    Expire -->|Expired| Reject
    Type -->|Match| Accept
    Type -->|No Match| Reject
```

### Session Security

| Protection | Implementation |
|------------|----------------|
| **PKCE** | Required for public clients |
| **State** | Prevents CSRF attacks |
| **Nonce** | Prevents replay attacks |
| **Short-lived codes** | 5-minute authorization codes |
| **Token binding** | Tokens bound to client |

## Next Steps

Now that you understand the concepts:

1. **[Verifying Credentials](./verifier)** – Configure and deploy your verifier
2. **[Keycloak Integration](./keycloak_verifier)** – Add to Keycloak as an IdP
3. **[Direct OIDC Integration](./oidc-rp)** – Integrate as an OIDC RP
4. **[Trust Services](../trust/)** – Configure trust frameworks
