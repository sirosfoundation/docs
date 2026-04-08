---
sidebar_position: 2
---

# Software Bill of Materials (SBOM)

All SIROS Foundation repositories generate Software Bill of Materials (SBOM) as part of their CI/CD pipeline. SBOMs provide a complete inventory of software components, dependencies, and their versions used in our projects.

## What is an SBOM?

An SBOM is a formal, machine-readable inventory of software components and dependencies. It includes:

- Direct dependencies
- Transitive dependencies
- Version information
- License data
- Security vulnerability mappings

SIROS Foundation uses the [CycloneDX](https://cyclonedx.org/) format (version 1.6), which is an OWASP standard for SBOM interchange.

## Why We Generate SBOMs

SBOMs are generated for several reasons aligned with our security practices:

1. **Supply Chain Transparency** – Know exactly what's in your software
2. **Vulnerability Management** – Quickly identify affected components when CVEs are published
3. **License Compliance** – Track all licenses in the dependency tree
4. **Regulatory Compliance** – Meet requirements from NIS2, EUCS, and similar frameworks
5. **Risk Assessment** – Part of our RSA (Risk- och sårbarhetsanalys) implementation

:::note RSA Reference
SBOM generation implements requirement **K5** from the SIROS ID Risk- och sårbarhetsanalys.
:::

## SBOM Generation

SBOMs are automatically generated on:

- Push to `main` branch
- Tag creation (`v*`)
- Release publication
- Manual workflow dispatch

Each SBOM undergoes vulnerability scanning using [Grype](https://github.com/anchore/grype), with results uploaded to GitHub Security.

## Downloading SBOMs

### From GitHub Releases

For tagged releases, SBOMs are attached as release assets:

1. Navigate to the repository's **Releases** page
2. Find the release version you're interested in
3. Download the `*-sbom.cyclonedx.json` asset

### From Workflow Artifacts

For any commit on `main`, SBOMs are available as workflow artifacts:

```bash
# List recent SBOM workflow runs
gh run list -w sbom.yml -R sirosfoundation/REPO_NAME -L 5

# Get the run ID for the commit you want
gh run view RUN_ID -R sirosfoundation/REPO_NAME

# Download the SBOM artifact
gh run download RUN_ID -n REPO_NAME-sbom -R sirosfoundation/REPO_NAME
```

### Via GitHub API

For automation, you can download SBOMs programmatically:

```bash
# Get artifact ID
ARTIFACT_ID=$(gh api repos/sirosfoundation/REPO_NAME/actions/runs/RUN_ID/artifacts \
  --jq '.artifacts[] | select(.name | endswith("-sbom")) | .id')

# Download artifact
gh api repos/sirosfoundation/REPO_NAME/actions/artifacts/$ARTIFACT_ID/zip > sbom.zip
unzip sbom.zip
```

## Reading SBOMs

### Quick Summary

Use `jq` to get a quick overview:

```bash
# Component count and format
jq '{
  format: .bomFormat,
  specVersion: .specVersion,
  componentCount: (.components | length),
  project: .metadata.component.name
}' sbom.cyclonedx.json

# List all components
jq '.components[].name' sbom.cyclonedx.json

# Find specific component versions
jq '.components[] | select(.name | contains("crypto")) | {name, version}' sbom.cyclonedx.json
```

### Using CycloneDX CLI

The [CycloneDX CLI](https://github.com/CycloneDX/cyclonedx-cli) provides validation and conversion:

```bash
# Install
brew install cyclonedx/cyclonedx/cyclonedx-cli

# Validate SBOM
cyclonedx validate --input-file sbom.cyclonedx.json

# Convert to other formats
cyclonedx convert --input-file sbom.cyclonedx.json --output-file sbom.spdx.json --output-format spdxjson
```

### Using Dependency-Track

For enterprise SBOM management, import SBOMs into [Dependency-Track](https://dependencytrack.org/):

```bash
# Upload via API
curl -X POST "https://your-dtrack-instance/api/v1/bom" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @sbom.cyclonedx.json
```

## Vulnerability Scanning

Each SBOM workflow run performs vulnerability scanning. Results are:

1. Available in the workflow run logs
2. Uploaded to GitHub Security → Code Scanning
3. Included in SARIF format for integration with security tools

### Manual Scanning

You can scan downloaded SBOMs locally:

```bash
# Install Grype
brew install anchore/grype/grype

# Scan SBOM
grype sbom:sbom.cyclonedx.json

# Output in table format with severity filtering
grype sbom:sbom.cyclonedx.json -o table --fail-on high
```

## SBOM Contents

A typical SIROS Foundation Go project SBOM includes:

| Component Type | Description |
|----------------|-------------|
| `application` | The main project itself |
| `library` | Go module dependencies |
| `framework` | Framework dependencies (if any) |
| `file` | GitHub Actions used in workflows |

### Example SBOM Structure

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.6",
  "serialNumber": "urn:uuid:...",
  "version": 1,
  "metadata": {
    "timestamp": "2026-04-08T12:00:00Z",
    "tools": [...],
    "component": {
      "type": "application",
      "name": "go-cryptoutil",
      "version": "v0.5.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "golang.org/x/crypto",
      "version": "v0.31.0",
      "purl": "pkg:golang/golang.org/x/crypto@v0.31.0"
    }
    // ... more components
  ]
}
```

## Repositories with SBOM Generation

The following SIROS Foundation repositories have SBOM generation enabled:

| Repository | Status |
|------------|--------|
| [go-cryptoutil](https://github.com/sirosfoundation/go-cryptoutil) | ✅ Active |
| [go-trust](https://github.com/sirosfoundation/go-trust) | 🔜 Planned |
| [go-wallet-backend](https://github.com/sirosfoundation/go-wallet-backend) | 🔜 Planned |
| [goFF](https://github.com/sirosfoundation/goFF) | 🔜 Planned |
| [g119612](https://github.com/sirosfoundation/g119612) | 🔜 Planned |

## Adding SBOM to a Repository

To add SBOM generation to a SIROS Foundation repository, create `.github/workflows/sbom.yml`:

```yaml
name: SBOM

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]
  release:
    types: [published]
  workflow_dispatch:

jobs:
  sbom:
    uses: sirosfoundation/.github/.github/workflows/sbom.yml@main
    with:
      artifact-name: your-repo-name
      scan-vulnerabilities: true
      sign-sbom: false  # Enable after testing
    permissions:
      contents: write
      id-token: write
      security-events: write
```

See the [reusable workflow documentation](https://github.com/sirosfoundation/.github/blob/main/.github/workflows/sbom.yml) for all available options.

## Related Resources

- [CycloneDX Specification](https://cyclonedx.org/specification/overview/)
- [OWASP SBOM Guide](https://owasp.org/www-project-sbom/)
- [NTIA SBOM Minimum Elements](https://www.ntia.gov/page/software-bill-materials)
- [Grype Vulnerability Scanner](https://github.com/anchore/grype)
