---
sidebar_position: 1
---

# Open Source

The SIROS Foundation maintains and contributes to a variety of open source projects that form the foundation of the SIROS ID platform. All projects are hosted on GitHub under the [sirosfoundation](https://github.com/sirosfoundation) organization.

## Platform Components

These are the core components that power the SIROS ID platform.

### Credential Issuer & Verifier

| Repository | Description |
|------------|-------------|
| [**SUNET/vc**](https://github.com/SUNET/vc) | The core credential issuer and verifier implementation. Supports OID4VCI, OID4VP, SD-JWT VC, and mDL/mDoc formats. |

### Wallet Backend

| Repository | Description |
|------------|-------------|
| [**go-wallet-backend**](https://github.com/sirosfoundation/go-wallet-backend) | Go-based wallet backend service providing API endpoints for the SIROS ID Credential Manager. Handles credential storage, key management, and protocol flows. |

### Trust Services

| Repository | Description |
|------------|-------------|
| [**go-trust**](https://github.com/sirosfoundation/go-trust) | AuthZEN-based Policy Decision Point (PDP) for trust evaluation. Supports ETSI Trust Lists (TSL), OpenID Federation, and DID resolution. |
| [**goFF**](https://github.com/sirosfoundation/goFF) | Go implementation of OpenID Federation. Supports entity statements, trust chains, and trust marks. |
| [**g119612**](https://github.com/sirosfoundation/g119612) | Go implementation of ETSI TS 119 612 Trust Service Lists parser and validator. |

### Credential Type Registry

| Repository | Description |
|------------|-------------|
| [**registry.siros.org**](https://github.com/sirosfoundation/registry.siros.org) | Aggregated Verifiable Credential Type Metadata (VCTM) registry. Provides credential type definitions, display templates, and claim schemas. |
| [**mtcvctm**](https://github.com/sirosfoundation/mtcvctm) | Merkle Tree Certificate-based VCTM distribution for efficient credential type metadata delivery. |

### Infrastructure & DevOps

| Repository | Description |
|------------|-------------|
| [**sirosid-dev**](https://github.com/sirosfoundation/sirosid-dev) | Development environment and local deployment configurations for SIROS ID. |
| [**sirosid-tests**](https://github.com/sirosfoundation/sirosid-tests) | End-to-end test suites and conformance tests for SIROS ID components. |
| [**confit**](https://github.com/sirosfoundation/confit) | Configuration management tool for SIROS services. |

### Libraries & Utilities

| Repository | Description |
|------------|-------------|
| [**go-cryptoutil**](https://github.com/sirosfoundation/go-cryptoutil) | Cryptographic utilities for Go including key management, signing, and verification helpers. |
| [**go-spocp**](https://github.com/sirosfoundation/go-spocp) | Go implementation of SPOCP (Simple Policy Control Protocol). |
| [**go-siros-cli**](https://github.com/sirosfoundation/go-siros-cli) | Command-line interface for SIROS services administration and debugging. |

### Demo & Testing

| Repository | Description |
|------------|-------------|
| [**demo-credentials**](https://github.com/sirosfoundation/demo-credentials) | Sample credentials and VCTM definitions for testing and demonstration. |
| [**wallet-e2e-tests**](https://github.com/sirosfoundation/wallet-e2e-tests) | End-to-end test suites for wallet functionality. |
| [**facetec-api**](https://github.com/sirosfoundation/facetec-api) | FaceTec integration API for biometric verification. |

### Browser & Web Integration

| Repository | Description |
|------------|-------------|
| [**web-wallet-selector**](https://github.com/sirosfoundation/web-wallet-selector) | Web component for wallet selection in browser-based credential flows. |

---

## wwWallet Project

The [SIROS ID Credential Manager](../sirosid/reference/cm) is based on the **wwWallet** open source project—a collaborative effort to create a flexible, standards-compliant digital credential wallet.

### Project Origin

The wwWallet project was established as an open source collaboration to build a modern digital credential manager supporting the emerging EU Digital Identity Wallet (EUDIW) ecosystem. The project is sponsored by SIROS Foundation with key contributions from:

- [**GUNet**](https://gunet.gr) – Greek Universities Network
- [**SURF**](https://surfnet.nl) – Dutch research and education network
- [**Yubico**](https://yubico.com) – Hardware security key manufacturer
- [**SUNET**](https://sunet.se) – Swedish University Network

### wwWallet Repositories

The wwWallet project consists of several components:

| Repository | Description |
|------------|-------------|
| [**wwWallet/wallet-frontend**](https://github.com/wwWallet/wallet-frontend) | React-based web frontend for the credential manager. Supports PWA deployment. |
| [**wwWallet/wallet-backend-server**](https://github.com/wwWallet/wallet-backend-server) | Node.js backend server handling credential storage and protocol flows. |
| [**wwWallet/wallet-common**](https://github.com/wwWallet/wallet-common) | Shared TypeScript types and utilities used by frontend and backend. |

### SIROS ID Enhancements

The SIROS ID Credential Manager is based on wwWallet but includes significant enhancements that go beyond the original implementation:

- **Passkey-based authentication** – Using FIDO2/WebAuthn for passwordless wallet access
- **Enhanced security architecture** – Hardware-backed key storage via Wallet Secure Cryptographic Device (WSCD)
- **Multi-tenant hosting** – Scalable deployment for multiple organizations
- **Trust framework integration** – Connection to SIROS Trust Services
- **Extended protocol support** – Additional credential formats and verification flows
- **Identity binding** – OIDC-based identity verification for high-assurance scenarios
- **Go-based backend** – High-performance backend rewritten in Go for improved scalability

---

## Related Projects

SIROS Foundation also contributes to and maintains forks of related open source projects:

| Repository | Description |
|------------|-------------|
| [**go-webauthn/webauthn**](https://github.com/go-webauthn/webauthn) | Go library for WebAuthn/FIDO2 server implementation. |
| [**russellhaering/goxmldsig**](https://github.com/russellhaering/goxmldsig) | Go library for XML Digital Signatures (SAML support). |
| [**descope/virtualwebauthn**](https://github.com/descope/virtualwebauthn) | Virtual WebAuthn authenticator for testing. |
| [**pando85/soft-fido2**](https://github.com/pando85/soft-fido2) | Software FIDO2 authenticator implementation. |

---

## Documentation

| Repository | Description |
|------------|-------------|
| [**docs**](https://github.com/sirosfoundation/docs) | This documentation site (you're reading it now). |

---

## Contributing

We welcome contributions to all SIROS Foundation projects. Each repository contains contribution guidelines in its README or CONTRIBUTING file.

- **Report issues**: Use GitHub Issues on the relevant repository
- **Submit changes**: Fork, branch, and submit a Pull Request
- **Discuss**: Join discussions in GitHub Discussions or reach out via support@siros.org

## License

Most SIROS Foundation projects are released under the Apache 2.0 or MIT license. See individual repository LICENSE files for details.
