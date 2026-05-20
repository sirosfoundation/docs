---
title: Container Images
sidebar_label: Container Images
description: Published container image tags on GitHub Container Registry
---

# Container Image Catalog

All SIROS ID platform container images are published to
[GitHub Container Registry](https://github.com/orgs/sirosfoundation/packages?repo_name=&ecosystem=container).

:::info
This page is automatically updated daily. For programmatic access, use the
[JSON catalog](/catalog/container-images.json).
:::

## Images

| Image | Pull command |
|---|---|
| `ghcr.io/sirosfoundation/confit` | `docker pull ghcr.io/sirosfoundation/confit` |
| `ghcr.io/sirosfoundation/facetec-api` | `docker pull ghcr.io/sirosfoundation/facetec-api` |
| `ghcr.io/sirosfoundation/goff` | `docker pull ghcr.io/sirosfoundation/goff` |
| `ghcr.io/sirosfoundation/go-spocp` | `docker pull ghcr.io/sirosfoundation/go-spocp` |
| `ghcr.io/sirosfoundation/go-trust` | `docker pull ghcr.io/sirosfoundation/go-trust` |
| `ghcr.io/sirosfoundation/go-wallet-backend` | `docker pull ghcr.io/sirosfoundation/go-wallet-backend` |
| `ghcr.io/sirosfoundation/mtcvctm` | `docker pull ghcr.io/sirosfoundation/mtcvctm` |
| `ghcr.io/sirosfoundation/registry-cli` | `docker pull ghcr.io/sirosfoundation/registry-cli` |
| `ghcr.io/sirosfoundation/vc/apigw` | `docker pull ghcr.io/sirosfoundation/vc/apigw` |
| `ghcr.io/sirosfoundation/vc/issuer` | `docker pull ghcr.io/sirosfoundation/vc/issuer` |
| `ghcr.io/sirosfoundation/vc/mockas` | `docker pull ghcr.io/sirosfoundation/vc/mockas` |
| `ghcr.io/sirosfoundation/vc/registry` | `docker pull ghcr.io/sirosfoundation/vc/registry` |
| `ghcr.io/sirosfoundation/vc/ui` | `docker pull ghcr.io/sirosfoundation/vc/ui` |
| `ghcr.io/sirosfoundation/vc/verifier` | `docker pull ghcr.io/sirosfoundation/vc/verifier` |
| `ghcr.io/sirosfoundation/wallet-frontend` | `docker pull ghcr.io/sirosfoundation/wallet-frontend` |

:::tip
To list tags for any image programmatically:
```bash
# Using the OCI Distribution API
curl -s "https://ghcr.io/token?scope=repository:sirosfoundation/IMAGE:pull" \
  | jq -r '.token' \
  | xargs -I{} curl -s -H "Authorization: Bearer {}" \
    "https://ghcr.io/v2/sirosfoundation/IMAGE/tags/list" \
  | jq '.tags'
```
:::
