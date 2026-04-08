---
sidebar_position: 1
---

# Security

Security is a foundational concern for the SIROS ID platform. This section documents our security practices, transparency measures, and guidance for integrators conducting their own security assessments.

## Security Principles

SIROS ID is designed with the following security principles:

- **Zero-knowledge architecture** — The platform operator cannot read user credentials or identify users
- **Passkey-only authentication** — No passwords; all user authentication via FIDO2/WebAuthn
- **Hardware-backed keys** — Cryptographic keys never leave the user's device (WSCD)
- **Defense in depth** — Multiple layers of protection at network, application, and data levels
- **Supply chain transparency** — Full visibility into dependencies via SBOMs

## Topics in This Section

| Topic | Description |
|-------|-------------|
| [Software Bill of Materials](./sbom) | Download and verify SBOMs for all SIROS components |
| [Vulnerability Disclosure](./vulnerability-disclosure) | How to report security issues |
| [Security Architecture](./architecture) | Overview of security controls and boundaries |
| [Cryptographic Practices](./cryptography) | Key management, algorithms, and protocols |
| [Compliance](./compliance) | Alignment with eIDAS 2.0, NIS2, and other frameworks |

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

- **Email:** security@siros.org
- **PGP Key:** Available at [/.well-known/security.txt](https://siros.org/.well-known/security.txt)
- **Response SLA:** Initial response within 48 hours

Please do not disclose vulnerabilities publicly until we have had an opportunity to address them.

## Security Assessments

Organizations integrating SIROS ID may need to conduct their own security assessments. We support this by providing:

- **Architecture documentation** in this section
- **SBOMs** for dependency analysis
- **Source code** — all core components are open source
- **Test environments** — available on request for penetration testing

Contact us at security@siros.org to coordinate security testing activities.
