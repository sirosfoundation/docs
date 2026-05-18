---
sidebar_position: 3
sidebar_label: SAML IdP Integration
---

# SAML Identity Provider Integration

This guide explains how to connect a SAML 2.0 identity provider to the SIROS ID issuer for credential issuance. After reading this guide, you will understand how to:

- Configure SAML authentication for the issuer
- Map SAML attributes to credential claims
- Set up metadata exchange (manual or MDQ)
- Handle federation scenarios

## Overview

SAML integration allows organizations with existing SAML identity federations to issue digital credentials to their users. Users authenticate through their familiar SAML login, then receive credentials based on the attributes released by the IdP.

```mermaid
sequenceDiagram
    participant User
    participant Wallet as SIROS ID Wallet
    participant Issuer as SIROS ID Issuer
    participant IdP as SAML IdP

    User->>Wallet: Request credential
    Wallet->>Issuer: Initiate OID4VCI
    Issuer->>IdP: SAML AuthnRequest
    User->>IdP: Authenticate (SSO)
    IdP->>Issuer: SAML Response with assertions
    Issuer->>Issuer: Map attributes to claims
    Issuer->>Wallet: Issue credential
    Wallet->>User: Credential stored
```

:::tip When to Use SAML
Use SAML integration when:
- Your organization is part of a SAML federation (e.g., eduGAIN, InCommon, SWAMID)
- Users already have accounts in a SAML IdP
- You need to leverage existing attribute release policies
:::

## Prerequisites

- A SAML 2.0 compliant identity provider
- IdP metadata (URL or file)
- A SIROS ID issuer with SAML configured (`apigw.auth_providers.saml` section)

## Integration Mode

SAML authentication is integrated into the standard **OpenID4VCI** credential issuance pipeline. When a data source scope has `auth_provider: saml`, the OID4VCI consent step redirects the user to the SAML IdP. After successful authentication, the SAML assertion attributes are normalized via `attribute_mapping` and then used to construct the credential (for `assertion` data sources) or to perform an identity lookup (for `datastore` data sources), and the standard OID4VCI token/credential flow continues.

This means SAML-authenticated credentials benefit from the same DPoP binding, token lifecycle, and wallet protocol support as every other auth method.

:::tip Data Source Scope Key
The scope key under `apigw.data_sources` must match the key in `common.credential_metadata`. For example, if credential metadata defines `pid`, the data source scope must also be `pid`.
:::

## Configuration

SAML authentication is configured in the `apigw.auth_providers.saml` section. Credential types are defined separately in `common.credential_metadata`, and authentication bindings are configured in `apigw.data_sources`.

### Basic Configuration

```yaml
common:
  credential_metadata:
    pid:
      vctm_file_path: "/metadata/vctm_pid_arf_1_8.json"
      format: "dc+sd-jwt"
    diploma:
      vctm_file_path: "/metadata/vctm_diploma.json"
      format: "dc+sd-jwt"

apigw:
  auth_providers:
    saml:
      # Enable SAML support
      enable: true

      # Service Provider entity ID (your issuer's identifier)
      entity_id: "https://issuer.example.org/sp"

      # Assertion Consumer Service endpoint (where IdP sends responses)
      acs_endpoint: "https://issuer.example.org/saml/acs"

      # SP signing/encryption certificates
      certificate_path: "/pki/sp-cert.pem"
      private_key_path: "/pki/sp-key.pem"

      # Session duration in seconds (default: 300)
      session_duration: 300

      # Attribute mapping normalizes SAML attribute OIDs to canonical claim names
      attribute_mapping:
        "urn:oid:2.5.4.42":
          claim: "given_name"
        "urn:oid:2.5.4.4":
          claim: "family_name"
        "urn:oid:1.3.6.1.5.5.7.9.1":
          claim: "birth_date"
        "urn:oid:0.9.2342.19200300.100.1.3":
          claim: "email_address"
          transform: "lowercase"

  # Data sources bind credential scopes to auth providers
  data_sources:
    assertion:
      scopes:
        pid:
          auth_provider: saml
        diploma:
          auth_provider: saml
    datastore:
      scopes:
        ehic:
          auth_provider: saml
          auth_claims: ["given_name", "family_name", "birth_date"]
```

### IdP Metadata Configuration

You must configure either MDQ or static IdP metadata (but not both).

#### Option 1: MDQ (Metadata Query Protocol)

For federation environments with many IdPs, use [MDQ](https://datatracker.ietf.org/doc/draft-young-md-query/) to fetch metadata on-demand:

```yaml
apigw:
  auth_providers:
    saml:
      enable: true
      entity_id: "https://issuer.example.org/sp"
      acs_endpoint: "https://issuer.example.org/saml/acs"
      certificate_path: "/pki/sp-cert.pem"
      private_key_path: "/pki/sp-key.pem"
    
      # MDQ configuration
      mdq_server: "https://mds.swamid.se/md"
    
      # Cache TTL in seconds (default: 86400)
      metadata_cache_ttl: 86400
    
      # Optional: verify metadata XML signatures (recommended for production)
      metadata_signing_cert_path: "/pki/federation-signing.pem"
```

**Federation MDQ Endpoints:**

| Federation | MDQ Endpoint |
|------------|--------------|
| **SWAMID** | \`https://mds.swamid.se/entities/\` |
| **InCommon** | \`https://mdq.incommon.org/entities/\` |

:::note eduGAIN Metadata
eduGAIN provides aggregate metadata intended for national federations. For individual entity queries, use your national federation's MDQ service.
:::

#### Metadata Signature Validation

When fetching IdP metadata from an MDQ service or a remote URL, you should verify that the metadata is signed by the federation operator. This prevents tampering with metadata in transit and ensures you only trust IdPs that are registered in the federation.

Configure the `metadata_signing_cert_path` option to point to the federation's metadata signing certificate (PEM format):

```yaml
apigw:
  auth_providers:
    saml:
      # ... other SAML config ...
    
      # Federation metadata signing certificate
      # When set, ALL fetched metadata (MDQ and static URL) must carry
      # a valid XML signature from this certificate.
      metadata_signing_cert_path: "/pki/federation-signing.pem"
```

**Behavior:**
- When `metadata_signing_cert_path` is set, the issuer validates the enveloped XML signature on every metadata document before parsing it.
- Metadata without a valid signature from the configured certificate is **rejected**.
- When not set, metadata is accepted without signature verification (suitable for testing or environments where transport security is sufficient).

:::tip Federation Signing Certificates
Federation operators publish their metadata signing certificates. Common sources:
- **SWAMID**: Available at [swamid.se](https://wiki.sunet.se/display/SWAMID/SWAMID+Metadata)
- **InCommon**: Available at [incommon.org](https://spaces.at.internet2.edu/x/jokYAQ)

Download the certificate in PEM format and mount it into your container.
:::

:::caution Production Recommendation
Always configure `metadata_signing_cert_path` in production. Without signature verification, a compromised network path could inject malicious IdP metadata, redirecting authentication to an attacker-controlled IdP.
:::

#### Option 2: Static IdP Metadata

For single IdP setups or testing:

```yaml
apigw:
  auth_providers:
    saml:
      enable: true
      entity_id: "https://issuer.example.org/sp"
      acs_endpoint: "https://issuer.example.org/saml/acs"
      certificate_path: "/pki/sp-cert.pem"
      private_key_path: "/pki/sp-key.pem"
    
      # Static IdP configuration (mutually exclusive with mdq_server)
      static_idp_metadata:
        entity_id: "https://idp.example.org"
        # Use file path OR URL (not both)
        metadata_path: "/metadata/idp-metadata.xml"
        # metadata_url: "https://idp.example.org/metadata"
```

## Attribute Mapping

Attribute mapping is configured in `apigw.auth_providers.saml.attribute_mapping` and normalizes SAML attribute OIDs to canonical claim names. The mapping is applied globally to ALL attributes in the SAML assertion. Which normalized attributes are used depends on the data source:
- **assertion**: VCTM determines which claims go into the credential
- **datastore**: `auth_claims` determines which are used for DB identity lookup
- **external_api**: `auth_claims` determine identity, remote API provides data

### Standard Attribute Names

SAML uses OID-based attribute names. Common mappings:

| Credential Claim | SAML Attribute (OID) | Friendly Name |
|------------------|---------------------|---------------|
| `given_name` | `urn:oid:2.5.4.42` | `givenName` |
| `family_name` | `urn:oid:2.5.4.4` | `sn` |
| `email_address` | `urn:oid:0.9.2342.19200300.100.1.3` | `mail` |
| `personal_administrative_number` | `urn:oid:1.2.752.29.4.13` | Swedish personnummer |
| `birth_date` | `urn:oid:1.3.6.1.5.5.7.9.1` | `dateOfBirth` |
| `affiliation` | `urn:oid:1.3.6.1.4.1.5923.1.1.1.1` | `eduPersonAffiliation` |
| `principal_name` | `urn:oid:1.3.6.1.4.1.5923.1.1.1.6` | `eduPersonPrincipalName` |
| `institution` | `urn:oid:2.5.4.10` | `organizationName` |

### Attribute Mapping Configuration

The `attribute_mapping` section normalizes provider-specific attribute names to canonical claim names:

```yaml
apigw:
  auth_providers:
    saml:
      attribute_mapping:
        "urn:oid:2.5.4.42":
          claim: "given_name"
        "urn:oid:2.5.4.4":
          claim: "family_name"
        "urn:oid:0.9.2342.19200300.100.1.3":
          claim: "email_address"
          transform: "lowercase"
        "urn:oid:1.2.752.29.4.13":
          claim: "personal_administrative_number"
        "urn:oid:2.5.4.6":
          claim: "nationality"
        "urn:oid:1.3.6.1.5.5.7.9.1":
          claim: "birth_date"
        "urn:oid:1.3.6.1.4.1.5923.1.1.1.1":
          claim: "affiliation"
        "urn:oid:1.3.6.1.4.1.5923.1.1.1.6":
          claim: "principal_name"
        "urn:oid:2.5.4.10":
          claim: "institution"
```

### Attribute Configuration Options

Each attribute mapping supports:

| Option | Type | Description |
|--------|------|-------------|
| `claim` | string | Canonical claim name to map to |
| `required` | boolean | Whether the attribute must be present |
| `transform` | string | Optional transformation: `lowercase`, `uppercase`, `trim` |

## Docker Deployment

```yaml
services:
  apigw:
    image: ghcr.io/sirosfoundation/vc/apigw:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro  # For static IdP metadata
    depends_on:
      - mongo
      - issuer

  issuer:
    image: ghcr.io/sirosfoundation/vc/issuer:latest
    # ...

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Generate SP Certificates

```bash
# Generate signing/encryption key pair
openssl req -x509 -newkey rsa:2048 \
  -keyout pki/sp-key.pem \
  -out pki/sp-cert.pem \
  -days 3650 -nodes \
  -subj "/CN=issuer.example.org/O=Example Org"
```

## Complete Configuration Example

```yaml
common:
  mongo:
    uri: mongodb://mongo:27017

  credential_metadata:
    pid:
      vctm_file_path: "/metadata/vctm_pid_arf_1_8.json"
      format: "dc+sd-jwt"
    diploma:
      vctm_file_path: "/metadata/vctm_diploma.json"
      format: "dc+sd-jwt"

apigw:
  public_url: "https://issuer.example.org"
  key_config:
    private_key_path: "/pki/signing_ec_private.pem"
    chain_path: "/pki/signing_ec_chain.pem"

  auth_providers:
    saml:
      enable: true
      entity_id: "https://issuer.example.org/sp"
      acs_endpoint: "https://issuer.example.org/saml/acs"
      certificate_path: "/pki/sp-cert.pem"
      private_key_path: "/pki/sp-key.pem"

      # MDQ for SWAMID federation
      mdq_server: "https://mds.swamid.se/md"
      metadata_cache_ttl: 86400

      # Verify metadata signatures (recommended for production)
      metadata_signing_cert_path: "/pki/swamid-signing.pem"

      session_duration: 300

      attribute_mapping:
        "urn:oid:2.5.4.42":
          claim: "given_name"
        "urn:oid:2.5.4.4":
          claim: "family_name"
        "urn:oid:1.3.6.1.5.5.7.9.1":
          claim: "birth_date"
        "urn:oid:1.2.752.29.4.13":
          claim: "personal_administrative_number"
        "urn:oid:0.9.2342.19200300.100.1.3":
          claim: "email_address"
          transform: "lowercase"

  data_sources:
    assertion:
      scopes:
        pid:
          auth_provider: saml
        diploma:
          auth_provider: saml

  delivery:
    openid4vci:
      token_endpoint: "https://issuer.example.org/token"
      clients:
        "1003":
          type: "public"
          redirect_uri: "https://dev.wallet.sunet.se"
          scopes:
            - "pid"
            - "diploma"
```

## Troubleshooting

### SAML Response Validation Failed

**Solutions:**
1. Verify IdP signing certificate in metadata is current
2. Check clock synchronization (SAML has strict time windows)
3. Ensure SP certificates are valid and not expired

### Attributes Not Received

**Solutions:**
1. Check IdP attribute release policy allows attributes to your SP
2. Verify attribute OIDs match your mapping configuration
3. Enable debug logging to inspect raw SAML assertions
4. Contact IdP administrator to verify attribute configuration

### MDQ Lookup Failed

**Solutions:**
1. Verify MDQ server URL ends with \`/\`
2. Check the IdP is registered in the federation
3. Verify network connectivity to MDQ service

### Metadata Signature Verification Failed

**Solutions:**
1. Confirm the federation signing certificate is current (not expired or rotated)
2. Verify you are using the correct certificate for your MDQ service (e.g., SWAMID cert for SWAMID MDQ)
3. Check that the metadata is actually signed (some MDQ services may return unsigned metadata for non-federated entities)
4. If testing, temporarily remove `metadata_signing_cert_path` to confirm the metadata itself is valid

## Next Steps

- [Issuer Configuration](./issuer) – Full issuer documentation
- [OpenID Connect Provider Integration](./oidc-op) – Use OIDC instead of SAML
- [Trust Services](../trust/) – Configure trust framework integration
