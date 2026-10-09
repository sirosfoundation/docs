---
id: sirosid-reference-index
slug: /sirosid/reference
title: Reference
---

Technical reference documentation including standards, credential types, and configuration.

- [Standards & Specifications](/sirosid/reference/standards)
- [Credential Type Registry](/sirosid/reference/vctm-registry)
- [Token Status Lists](/sirosid/reference/token-status-lists)
- [Credential Manager](/sirosid/reference/cm)
- [API Reference](/sirosid/reference/api)

## Configuration Reference

Configuration reference for each SIROS ID component. The VC reference is generated from [SUNET/vc](https://github.com/SUNET/vc) `main` at site build time, so it tracks the latest code:

- [VC Configuration Reference](/sirosid/reference/vc-configuration)
- [Wallet Backend Configuration Reference](/wallet/wallet-backend-configuration)
- [Go-Trust Configuration Reference](/sirosid/trust/go-trust-configuration)

:::warning A trust PDP is required for production
A Policy Decision Point (AuthZEN, e.g. [Go-Trust](/sirosid/trust/go-trust-configuration)) configured through `trust.pdp_url` is required for production use of the VC components. Without it, key resolution is limited to self-contained local DID methods (`did:key`, `did:jwk`), so resolving other `did:` methods and trust-framework lookups is unsupported, and trust evaluation runs in "allow all" mode: any resolved key is treated as trusted. Run without a PDP only for development and testing.
:::
