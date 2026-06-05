---
sidebar_position: 3
---

# Architecture

This page provides a comprehensive view of the SIROS ID platform architecture, showing all major components and how they interact.

## Platform Architecture Overview

<a href="/img/architecture-overview.svg" target="_blank">
  <img src="/img/architecture-overview.svg" alt="SIROS ID Platform Architecture" style={{width: '100%', maxWidth: '1200px'}} />
</a>

*Click the diagram to open full-size in a new tab.*

## Component Summary

### User Domain

The user interacts with SIROS ID through a **browser or mobile app**. Authentication is entirely passkey-based (FIDO2/WebAuthn) — there are no passwords. The passkey also functions as a **Wallet Secure Cryptographic Device (WSCD)**, providing hardware-backed key storage and client-side credential encryption.

### Credential Manager (Wallet)

The digital wallet consists of:

| Component | Technology | Role |
|-----------|-----------|------|
| **wallet-frontend** | React PWA, Nginx | User interface for managing credentials |
| **go-wallet-backend** | Go, Gin | API server, session management, encrypted storage |
| **MongoDB** | — | Persistent storage (all data encrypted at rest) |
| **Redis** | — | Optional caching layer |
| **Admin API** | Port 8081 | Tenant management (internal network only) |

The wallet is designed with a **zero-knowledge architecture**: the platform operator cannot identify users or read their credentials.

### Credential Issuer

Built on [SUNET/vc](https://github.com/SUNET/vc), the issuer creates and signs digital credentials using the **OID4VCI** protocol. It supports:

- **SD-JWT VC** and **mDL/mDoc** credential formats
- **PKCS#11 HSM** and **QSCD** for production signing keys
- **Token Status Lists** for credential revocation
- Pre-authorized and authorization code flows

### Credential Verifier

Also built on SUNET/vc, the verifier validates credential presentations via **OID4VP** and acts as an **OIDC Relying Party** for downstream applications. It supports:

- Same-device and cross-device flows (QR codes, deep links)
- **W3C Digital Credentials API** for browser-native verification
- Selective disclosure and presentation exchange

### Trust Services

**go-trust** is the Policy Decision Point (PDP) implementing the [AuthZEN](https://openid.github.io/authzen/) protocol. It evaluates trust by querying:

- **ETSI Trust Lists** (TS 119 612) — EU Trusted Service Providers
- **OpenID Federation** — Dynamic federation trust chains
- **DID Resolution** — did:web, did:webvh document resolution

The system operates in **fail-closed mode**: if the PDP is unreachable, all trust evaluations return negative.

### Credential Registry

[registry.siros.org](https://registry.siros.org) aggregates **Verifiable Credential Type Metadata (VCTM)** from multiple organizations, providing:

- A static catalogue and JSON API for credential type discovery
- **registry-cli** for building and publishing metadata
- Cached metadata consumed by wallets and verifiers

### Customer Infrastructure

Integrators connect their existing identity infrastructure:

- **Identity Providers** (SAML/OIDC/Keycloak) authenticate users for credential issuance
- **Applications** receive standard OIDC tokens after credential verification
- **Data Sources** supply claims and attributes for credential construction

## Key Protocols

| Protocol | Purpose |
|----------|---------|
| **OID4VCI** | Credential issuance between issuer and wallet |
| **OID4VP** | Credential presentation from wallet to verifier |
| **AuthZEN** | Trust evaluation requests to the PDP |
| **OIDC** | Standard login flow from verifier to applications |
| **WebAuthn** | Passkey authentication and key derivation |
| **DPoP** | Demonstrating proof of possession for tokens |

## Deployment

All components are available as OCI container images and can be deployed via **Docker Compose** or **Kubernetes**. A hosted instance is available at [id.siros.org](https://id.siros.org).

See [Docker Images](/sirosid/operations/docker-images) and [Deployment Guides](/sirosid/issuers/deployment) for details.
