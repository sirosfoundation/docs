---
sidebar_position: 4
---

# VCTM Registry

The SIROS Foundation maintains a public registry of Verifiable Credential Type Metadata (VCTM) at **[registry.siros.org](https://registry.siros.org)**.

## What is VCTM?

Verifiable Credential Type Metadata (VCTM) files define credential schemas, display properties, and claim definitions. When an issuer issues a credential, the VCTM tells wallets and verifiers:

- What claims the credential contains
- How to display the credential to users
- What the VCT (Verifiable Credential Type) identifier is
- Localized labels and descriptions

## Registry Overview

The SIROS VCTM Registry aggregates and publishes VCTM files from multiple organizations, providing:

- **Stable URLs** for VCTM references
- **Organization-based namespacing**
- **Automatic aggregation** from source repositories
- **Consistent SIROS branding**

## URL Structure

VCTMs are accessible at:

```
https://registry.siros.org/<organization>/<vctm-name>.json
```

**Examples:**

| URL | Description |
|-----|-------------|
| `https://registry.siros.org/sirosfoundation/pid.json` | SIROS Foundation PID credential |
| `https://registry.siros.org/sirosfoundation/ehic.json` | SIROS Foundation EHIC credential |

## Using the Registry

### In Issuer Configuration

Reference VCTM files from the registry in your issuer configuration:

```yaml
credential_constructor:
  pid:
    vct: "urn:eudi:pid:arf-1.8:1"
    vctm_url: "https://registry.siros.org/sirosfoundation/pid-arf-1.8.json"
    # Or use a local copy
    vctm_file_path: "/metadata/vctm_pid.json"
    format: "dc+sd-jwt"
    auth_method: basic
```

### Fetching VCTM

```bash
# Download a VCTM file
curl -o vctm_pid.json https://registry.siros.org/sirosfoundation/pid.json
```

## Publishing to the Registry

Organizations can publish their own VCTMs to the registry.

### Requirements

1. Use the [mtcvctm](https://github.com/sirosfoundation/mtcvctm) GitHub Action
2. Publish VCTMs to a `vctm` branch in your repository
3. Include a `.well-known/vctm-registry.json` manifest

### Setup with GitHub Actions

```yaml
# .github/workflows/publish-vctm.yml
name: Publish VCTM

on:
  push:
    branches: [main]
    paths:
      - 'metadata/*.json'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: sirosfoundation/mtcvctm@v1
        with:
          vctm-directory: metadata/
```

### Registry Manifest

The `vctm` branch must contain `.well-known/vctm-registry.json`:

```json
{
  "organization": "your-org",
  "vctms": [
    {
      "name": "my-credential",
      "file": "my-credential.json",
      "vct": "urn:example:my-credential:1"
    }
  ]
}
```

## VCTM File Structure

A VCTM file follows the [IETF SD-JWT VC specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/):

```json
{
  "vct": "urn:eudi:pid:arf-1.8:1",
  "name": "Person Identification Data",
  "description": "EU Person Identification Data credential",
  "display": [
    {
      "lang": "en-US",
      "name": "PID",
      "description": "Personal identification credential",
      "rendering": {
        "simple": {
          "background_color": "#12107c",
          "text_color": "#ffffff",
          "logo": {
            "uri": "https://example.org/logo.png",
            "alt_text": "Organization Logo"
          }
        }
      }
    }
  ],
  "claims": [
    {
      "path": ["given_name"],
      "display": [
        {"lang": "en-US", "label": "First Name"}
      ],
      "sd": "allowed"
    },
    {
      "path": ["family_name"],
      "display": [
        {"lang": "en-US", "label": "Last Name"}
      ],
      "sd": "allowed"
    }
  ]
}
```

## Official SIROS VCTMs

The following VCTMs are maintained by the SIROS Foundation:

| Credential | VCT | Registry URL |
|------------|-----|--------------|
| **PID (ARF 1.5)** | `urn:eudi:pid:arf-1.5:1` | [pid-arf-1.5.json](https://registry.siros.org/sirosfoundation/pid-arf-1.5.json) |
| **PID (ARF 1.8)** | `urn:eudi:pid:arf-1.8:1` | [pid-arf-1.8.json](https://registry.siros.org/sirosfoundation/pid-arf-1.8.json) |
| **EHIC** | `urn:eudi:ehic:1` | [ehic.json](https://registry.siros.org/sirosfoundation/ehic.json) |
| **PDA1** | `urn:eudi:pda1:1` | [pda1.json](https://registry.siros.org/sirosfoundation/pda1.json) |
| **Diploma** | `urn:eudi:diploma:1` | [diploma.json](https://registry.siros.org/sirosfoundation/diploma.json) |
| **ELM** | `urn:eudi:elm:1` | [elm.json](https://registry.siros.org/sirosfoundation/elm.json) |

## Resources

- **Registry Website**: [registry.siros.org](https://registry.siros.org)
- **Source Repository**: [github.com/sirosfoundation/registry.siros.org](https://github.com/sirosfoundation/registry.siros.org)
- **VCTM Action**: [github.com/sirosfoundation/mtcvctm](https://github.com/sirosfoundation/mtcvctm)
- **IETF SD-JWT VC Draft**: [draft-ietf-oauth-sd-jwt-vc](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)
