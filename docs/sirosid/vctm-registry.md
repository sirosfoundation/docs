---
sidebar_position: 4
---

# VCTM Registry

The SIROS Foundation maintains a public registry for publishing Verifiable Credential Type Metadata (VCTM) at **[registry.siros.org](https://registry.siros.org)**.

## Purpose

The registry provides a publication platform for organizations to share their VCTM files. It serves as:

- **A storage backend** for VCTM files organized by organization
- **A publication point** where credential type metadata can be discovered
- **An aggregation service** that collects VCTMs from multiple sources

:::note Important Distinction
The registry is a publication mechanism, not a VCTM resolution service. VCTM resolution (looking up credential type metadata by VCT identifier) is implemented separately. See the [go-wallet-backend](https://github.com/sirosfoundation/go-wallet-backend) for a reference implementation that can use registry.siros.org as a backend.
:::

## What is VCTM?

Verifiable Credential Type Metadata (VCTM) files define how credentials should be displayed and what claims they contain. They follow the [IETF SD-JWT VC specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/).

Visit [registry.siros.org](https://registry.siros.org) for details on available VCTMs and how to publish your own.
