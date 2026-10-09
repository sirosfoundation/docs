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
A Policy Decision Point (AuthZEN, e.g. [Go-Trust](/sirosid/trust/go-trust-configuration)) configured through `trust.pdp_url` is required for production use of the VC components. Running without one is not supported and is for development and testing only. Some things may still work without a PDP (the resolver handles self-contained `did:key` and `did:jwk` locally, and trust evaluation runs in "allow all" mode where any resolved key is treated as trusted), but other `did:` methods and trust-framework lookups cannot be resolved, and there are no guarantees and no support for such a setup.
:::
