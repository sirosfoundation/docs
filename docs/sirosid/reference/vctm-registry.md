---
sidebar_position: 2
---

# Credential Type Registry

The SIROS Foundation maintains a public registry for publishing credential type metadata at **[registry.siros.org](https://registry.siros.org)**.

## Purpose

The registry provides a publication platform for organizations to share their credential type metadata files (including VCTM). It serves as:

- **A storage backend** for credential type metadata organized by organization
- **A publication point** where credential type metadata can be discovered
- **An aggregation service** that collects metadata from multiple sources

:::note Important Distinction
The registry is a publication mechanism, not a resolution service. Credential type resolution (looking up metadata by VCT identifier) is implemented separately. See the [go-wallet-backend](https://github.com/sirosfoundation/go-wallet-backend) for a reference implementation that can use registry.siros.org as a backend.
:::

:::caution Don't confuse the "registries"
The SIROS ecosystem has three components that use the word "registry" — they serve different purposes:

| Component | Role | Description |
|-----------|------|-------------|
| **[registry-cli](../../../opensource/registry-cli)** | **Publisher** | CLI tool that builds the credential type catalogue (the static site at registry.siros.org). This is the _publishing side_. |
| **registry.siros.org** | **Catalogue** | The public static site produced by registry-cli, hosted on GitHub Pages. |
| **VC registry** (`vc/cmd/registry`) | **Token Status Lists** | A completely separate service in the [VC suite](https://github.com/SUNET/vc) that manages credential revocation via Token Status Lists. It has nothing to do with credential type metadata. |
| **go-wallet-backend registry** (`go-wallet-backend/cmd/registry`) | **Consumer/cache** | A service in go-wallet-backend that _fetches and caches_ credential type metadata from registry.siros.org (or any compatible source). This is the _consuming side_. |

In short: **registry-cli publishes** credential type metadata, **go-wallet-backend's registry consumes** it, and **VC's registry manages revocation** — an entirely unrelated concern.
:::

## What is VCTM?

Verifiable Credential Type Metadata (VCTM) files define how credentials should be displayed and what claims they contain. They follow the [IETF SD-JWT VC specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/).

Visit [registry.siros.org](https://registry.siros.org) for details on available credential types and how to publish your own.
