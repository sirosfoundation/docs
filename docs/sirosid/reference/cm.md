---
sidebar_position: 4
---
# Credential Manager

The SIROS ID Credential Manager (CM) is based on the [wwWallet](/opensource#wwwallet-project) open source project, with significant enhancements developed by SIROS Foundation. While wwWallet provides a flexible foundation for digital credential management, SIROS ID CM includes substantial improvements in security architecture, protocol support, and scalability that go beyond the original implementation.

The SIROS ID CM supports both native apps and web clients, can be accessed on any device, and supports all major browsers and platforms.

:::info Alternative Wallets
The SIROS ID Credential Manager is **one example** of an OID4VCI/OID4VP compatible wallet. The [SIROS ID Issuer](/sirosid/issuers/concepts) and [Verifier](/sirosid/verifiers/concepts) work with **any standards-compliant wallet**, including:

- **EUDI Reference Wallet** – EU Digital Identity reference implementation
- **Third-party commercial wallets** – Any wallet implementing OID4VCI/OID4VP
- **Custom enterprise wallets** – Your own wallet implementation

This page documents the SIROS ID Credential Manager specifically. For general wallet requirements, see the [Standards & Specifications](./standards#wallet-standards) page.
:::

## Account-Free Design

There is no concept of an "account" in the SIROS ID CM. Instead, users authenticate using **FIDO passkeys**. This design provides:

- **No passwords to remember or steal** – Authentication is cryptographic
- **No email verification** – Instant wallet setup
- **Privacy by default** – No personal data collected to create a wallet

## Security: Passkeys as the Wallet Secure Cryptographic Device

The CM uses FIDO authenticators as a **Wallet Secure Cryptographic Device (WSCD)** – a concept from the [EU Digital Identity Wallet Architecture Reference Framework (ARF)](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework). The WSCD protects the wallet's cryptographic keys and ensures only the user can access their credentials.

By using passkeys as the WSCD, SIROS ID achieves EU-level security requirements using hardware already in users' devices – fingerprint sensors, face recognition, or platform authenticators in modern smartphones and laptops.

### Why Passkeys Provide Strong Security and Privacy

| Property | Benefit |
|----------|---------|
| **Phishing resistant** | Keys are bound to the origin and cannot be used on fake sites |
| **No shared secrets** | Private keys never leave the user's authenticator |  
| **Hardware protection** | Keys stored in secure hardware (TPM, Secure Enclave) |
| **Encrypted storage** | All credentials encrypted with keys derived from the passkey |
| **No tracking** | The CM operator cannot identify users or read their credentials |

:::tip For Integrators
Users need a modern browser with WebAuthn support – all major platforms have this built in. There are no user accounts to provision; users create their own wallets instantly with strong authentication built-in.
:::

## Learn More

- [EUDI Architecture Reference Framework](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework) – EU wallet security requirements
- [FIDO Alliance](https://fidoalliance.org/passkeys/) – About passkeys
