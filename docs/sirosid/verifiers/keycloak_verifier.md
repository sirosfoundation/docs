---
sidebar_position: 4
sidebar_label: Keycloak Integration
---

# Keycloak Integration

This guide explains how to integrate SIROS ID credential verification with [Keycloak](https://www.keycloak.org/), allowing users to authenticate to your applications using their digital credentials. After reading this guide, you will understand how to:

- Add SIROS ID as an identity provider in Keycloak
- Configure claim mappings for user attributes
- Request specific credential types
- Handle first-time logins and account linking

## Overview

Keycloak can use the SIROS ID verifier as an external [OpenID Connect identity provider](https://www.keycloak.org/docs/latest/server_admin/index.html#_identity_broker_oidc). When users select "Login with SIROS ID", they present credentials from their wallet instead of entering a username and password.

```mermaid
sequenceDiagram
    participant User
    participant App as Your Application
    participant KC as Keycloak
    participant Verifier as SIROS ID Verifier
    participant Wallet as User's Wallet

    User->>App: Access protected resource
    App->>KC: Redirect to Keycloak login
    User->>KC: Select "SIROS ID"
    KC->>Verifier: OIDC authorize
    Verifier->>Wallet: Request credential (QR/link)
    User->>Wallet: Approve sharing
    Wallet->>Verifier: Present credential
    Verifier->>KC: ID token with verified claims
    KC->>KC: Create/update user
    KC->>App: Session token
    App->>User: Access granted
```

:::tip Hosted or Self-Hosted
This guide works with both the **SIROS ID hosted verifier** and **self-hosted deployments**. Simply replace the verifier URL as needed. See [Verifier Deployment Options](./verifier.md#deployment-options) for more information.

When using the **SIROS ID hosted service**, verifiers use subdomain-based URLs:
`https://<tenant>.verifier.id.siros.org`
:::

## Prerequisites

- Keycloak 22+ installed and running
- Admin access to your Keycloak realm
- A SIROS ID verifier (hosted or self-hosted)

## Step 1: Register Your Keycloak Instance

Register Keycloak as an OIDC client with the verifier:

```bash
curl -X POST https://verifier.example.org/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Keycloak",
    "redirect_uris": ["https://keycloak.example.com/realms/myrealm/broker/sirosid/endpoint"],
    "token_endpoint_auth_method": "client_secret_post",
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "scope": "openid pid"
  }'
```

The `scope` string is the list of scopes Keycloak may request. Include every
scope you will configure in Keycloak in Step 2 (the default is `openid` only,
and any other requested scope is rejected with `invalid_scope`). The scopes
must also exist on the verifier, see [Scopes](#scopes) below. The verifier
requires PKCE for clients registered this way, which is why **Use PKCE** is ON
in Step 2.

:::info SIROS Hosted Example
For the SIROS hosted service with tenant `acme` and verifier instance `main`:
```bash
curl -X POST https://main.acme.verifier.id.siros.org/register \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```
:::

Save the returned `client_id` and `client_secret` for the next step.

:::warning Redirect URI Format
The redirect URI must exactly match Keycloak's broker endpoint format:
```text
https://<keycloak-host>/realms/<realm-name>/broker/<alias>/endpoint
```
:::

## Step 2: Add the Identity Provider

1. Open **Keycloak Admin Console**
2. Select your realm
3. Navigate to **Identity Providers** → **Add provider** → **OpenID Connect v1.0**

Configure the following settings:

### General Settings

| Setting | Value | Description |
|---------|-------|-------------|
| **Alias** | `sirosid` | Internal identifier (used in redirect URI) |
| **Display Name** | `Login with Credential` | Shown on login page |
| **Enabled** | ON | Enable the provider |
| **Store Tokens** | OFF | Turn ON to inspect the raw ID token while debugging |
| **Trust Email** | OFF | The default presentation requests do not return an `email` claim; enable only if your verifier's template provides a verified email |

### OpenID Connect Settings

| Setting | Value |
|---------|-------|
| **Discovery Endpoint** | `https://verifier.example.org/.well-known/openid-configuration` |
| **Client ID** | *(from Step 1)* |
| **Client Secret** | *(from Step 1)* |
| **Client Authentication** | `Client secret sent as post` |

### Security Settings

| Setting | Value | Description |
|---------|-------|-------------|
| **Validate Signatures** | ON | Verify ID token signatures |
| **Use PKCE** | ON | Required: the verifier rejects authorization requests from registered clients without PKCE |
| **PKCE Method** | `S256` | SHA-256 challenge method |

### Scopes {#scopes}

| Setting | Value |
|---------|-------|
| **Default Scopes** | `openid pid` |

The scopes select which credentials the verifier requests from the wallet.
There is no fixed list: the available scopes are those the verifier operator
configured (discovery's `scopes_supported` lists them), and each one must also
be in the `scope` string you registered in Step 1. For example, with `pid` and
`ehic` configured on the verifier and both registered, use `openid pid ehic` for
health services.

## Step 3: Configure Claim Mappers

Map verified credential claims to Keycloak user attributes.

Navigate to **Identity Providers** → **sirosid** → **Mappers** → **Add mapper**

### Essential Mappers

#### Username

| Setting | Value |
|---------|-------|
| **Name** | `username` |
| **Mapper Type** | `Username Template Importer` |
| **Template** | `${CLAIM.sub}` |
| **Sync Mode** | `inherit` |

#### First Name

| Setting | Value |
|---------|-------|
| **Name** | `firstName` |
| **Mapper Type** | `Attribute Importer` |
| **Claim** | `given_name` |
| **User Attribute Name** | `firstName` |
| **Sync Mode** | `inherit` |

#### Last Name

| Setting | Value |
|---------|-------|
| **Name** | `lastName` |
| **Mapper Type** | `Attribute Importer` |
| **Claim** | `family_name` |
| **User Attribute Name** | `lastName` |
| **Sync Mode** | `inherit` |

#### Email

The PID presentation requests shipped with the verifier do not request an
`email` claim, so this mapper only has a value if your verifier uses a template
that does.

| Setting | Value |
|---------|-------|
| **Name** | `email` |
| **Mapper Type** | `Attribute Importer` |
| **Claim** | `email` |
| **User Attribute Name** | `email` |
| **Sync Mode** | `inherit` |

### Optional Mappers

#### Birth Date

| Setting | Value |
|---------|-------|
| **Name** | `birthdate` |
| **Mapper Type** | `Attribute Importer` |
| **Claim** | `birthdate` |
| **User Attribute Name** | `birthdate` |
| **Sync Mode** | `inherit` |

#### Nationality

| Setting | Value |
|---------|-------|
| **Name** | `nationalities` |
| **Mapper Type** | `Attribute Importer` |
| **Claim** | `nationalities` (an array in the PID) |
| **User Attribute Name** | `nationalities` |
| **Sync Mode** | `inherit` |

## Step 4: Configure First Login Behavior

Control what happens when a user logs in with credentials for the first time.

Navigate to **Authentication** → **Flows** and configure the **first broker login** flow:

| Option | Recommended Setting | Description |
|--------|---------------------|-------------|
| **Create User If Unique** | ON | Auto-create accounts for new users |
| **Confirm Link Existing Account** | ON | Prompt before linking to existing accounts |
| **Verify Existing Account By Email** | ON | Keep ON unless Trust Email is enabled and your verifier supplies a verified email |

### Auto-Linking by Email

To automatically link credential logins to existing accounts with matching email:

1. Create a new authentication flow
2. Add **Automatically Link Brokered Account** execution
3. Set the IdP's **First Login Flow** to your new flow

:::caution
Only use auto-linking if you trust the credential issuer to verify email addresses.
:::

## Step 5: Test the Integration

1. Open your application's login page
2. Click **Login with Credential** (or your configured display name)
3. Scan the QR code with your SIROS ID wallet
4. Approve the credential sharing request in your wallet
5. Verify you're logged in with the correct user attributes

### Test with the Demo Wallet

If you don't have credentials yet:

1. Go to [id.siros.org](https://id.siros.org)
2. Create a wallet with a passkey
3. Add a **Demo PID** credential
4. Use this wallet to test your Keycloak integration

## Advanced Configuration

### Step-Up Authentication

Require credential verification for sensitive operations by sending the user
back through the SIROS ID identity provider. With a Keycloak OIDC client
adapter, add `kc_idp_hint=sirosid` and `prompt=login` to the authorization
request so Keycloak skips its own login screen and re-authenticates against the
verifier:

```text
https://keycloak.example.com/realms/myrealm/protocol/openid-connect/auth
  ?client_id=my-app&response_type=code&scope=openid
  &redirect_uri=https%3A%2F%2Fmy-app.example.com%2Fcallback
  &kc_idp_hint=sirosid&prompt=login
```

### Conditional Authentication

Create authentication flows that conditionally require credential verification:

1. **Authentication** → **Flows** → **Create flow**
2. Add a **Conditional** subflow
3. Add **Condition - User Role** to check if user needs verification
4. Add **Identity Provider Redirector** pointing to `sirosid`

### Custom Theme

Customize the login button appearance:

```ftl
<!-- In your Keycloak theme: login.ftl -->
<#list social.providers as p>
    <#if p.alias == "sirosid">
        <a href="${p.loginUrl}" class="siros-login-btn">
            <img src="${url.resourcesPath}/img/siros-logo.svg" alt="SIROS ID" />
            <span>Login with Digital Credential</span>
        </a>
    </#if>
</#list>
```

## Troubleshooting

### Invalid Redirect URI

**Error**: `invalid_redirect_uri`

**Solution**: Verify the redirect URI exactly matches:
```
https://keycloak.example.com/realms/{realm}/broker/sirosid/endpoint
```

Check for:
- Trailing slashes
- HTTP vs HTTPS
- Correct realm name
- Correct alias (`sirosid`)

### Token Signature Validation Failed

**Error**: `token_signature_validation_failed`

**Solutions**:
1. Ensure **Validate Signatures** is ON
2. Verify Keycloak can reach the verifier's JWKS endpoint
3. Clear the key cache:
   - **Realm Settings** → **Keys** → **Providers**
   - Toggle the provider off and on

### Claims Not Appearing in User Profile

**Symptoms**: User created but attributes are empty

**Solutions**:
1. Verify mapper **Sync Mode** is `inherit` or `force`
2. Check the claim name matches exactly (case-sensitive)
3. Enable **Store Tokens** and inspect the raw ID token in user sessions
4. Verify the requested scopes include the needed claims

### User Already Exists

**Error**: `User already exists` or duplicate user created

**Solutions**:
1. Configure the first login flow to link existing accounts
2. Use email as the linking attribute
3. If using email linking, make sure your verifier's template returns a verified `email` claim and enable **Trust Email**

## Configuration Reference

### Complete Identity Provider JSON

Export this configuration to replicate the setup:

```json
{
  "alias": "sirosid",
  "displayName": "Login with Credential",
  "providerId": "oidc",
  "enabled": true,
  "trustEmail": false,
  "storeToken": false,
  "linkOnly": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "${CLIENT_ID}",
    "clientSecret": "${CLIENT_SECRET}",
    "tokenUrl": "https://verifier.example.org/token",
    "authorizationUrl": "https://verifier.example.org/authorize",
    "jwksUrl": "https://verifier.example.org/jwks",
    "userInfoUrl": "https://verifier.example.org/userinfo",
    "issuer": "https://verifier.example.org",
    "clientAuthMethod": "client_secret_post",
    "syncMode": "INHERIT",
    "validateSignature": "true",
    "pkceEnabled": "true",
    "pkceMethod": "S256",
    "defaultScope": "openid pid"
  }
}
```

### Client Secret

Keycloak stores the identity provider's client ID and secret in its realm
configuration. Keep the secret out of exported realm files, and inject it at
import time (for example with the `${CLIENT_SECRET}` placeholder above and your
realm-import tooling) rather than committing it.

## Next Steps

- [Verifier Configuration](./verifier.md) – Full verifier documentation
- [Trust Services](../trust/) – Configure trust framework integration
- [Quick Start Guide](../quickstart) – Get started in 15 minutes
