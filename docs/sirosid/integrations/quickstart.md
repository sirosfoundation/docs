---
sidebar_position: 0
---

# Quick Start Guide

Get started with SIROS ID in minutes. This guide walks you through connecting your first application to verify digital credentials.

## What You'll Build

By the end of this guide, you'll have:

1. ✅ A working credential verification flow
2. ✅ Users logging in with their digital credentials
3. ✅ Verified identity claims in your application

## Prerequisites

- An application with OIDC/OAuth2 login support
- Access to your IAM configuration (e.g., Keycloak, Auth0)
- A test wallet (we'll set this up)

## Step 1: Get a Test Wallet (2 minutes)

1. Open [app.siros.org](https://app.siros.org) in your browser
2. Create a new wallet using a passkey
3. Navigate to **Add Credential** → **Demo PID**
4. Accept the test Person Identification credential

You now have a wallet with a test credential.

## Step 2: Register Your Application (5 minutes)

Register your application with the SIROS ID verifier. Replace `demo` with your tenant ID and `main` with your verifier instance:

```bash
curl -X POST https://app.siros.org/demo/main/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Test App",
    "redirect_uris": ["https://localhost:8080/callback"],
    "token_endpoint_auth_method": "client_secret_post",
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "scope": "openid profile"
  }'
```

Save the returned `client_id` and `client_secret`.

:::info Multi-Tenancy
SIROS ID uses path-based multi-tenancy. All services are under `app.siros.org`:
- **Wallet**: `app.siros.org/<tenant>/...`
- **Verifiers**: `app.siros.org/<tenant>/<verifier_instance>/...` (multiple per tenant)
- **Issuers**: `app.siros.org/<tenant>/<issuer_instance>/...` (multiple per tenant)

In this example, `demo` is the tenant and `main` is the verifier instance.
:::

## Step 3: Configure Your IAM (5 minutes)

Add SIROS ID as an identity provider:

### Keycloak

1. Go to **Identity Providers** → **Add provider** → **OpenID Connect v1.0**
2. Configure:
   - **Alias**: `sirosid`
   - **Display Name**: `SIROS ID`
   - **Discovery URL**: `https://app.siros.org/demo/main/.well-known/openid-configuration`
   - **Client ID**: *(from step 2)*
   - **Client Secret**: *(from step 2)*
   - **Client Authentication**: `Client secret sent as post`
3. Save

### Auth0

1. Go to **Authentication** → **Enterprise** → **OpenID Connect**
2. Create a new connection with:
   - **Issuer URL**: `https://app.siros.org/demo/main`
   - **Client ID**: *(from step 2)*
   - **Client Secret**: *(from step 2)*

### Direct Integration

If not using an IAM, redirect users directly:

```javascript
// Replace 'demo' with your tenant ID and 'main' with your verifier instance
const authUrl = 'https://app.siros.org/demo/main/authorize?' + 
  new URLSearchParams({
    response_type: 'code',
    client_id: 'your-client-id',
    redirect_uri: 'https://localhost:8080/callback',
    scope: 'openid profile',
    state: crypto.randomUUID()
  });

window.location = authUrl;
```

## Step 4: Test the Flow (2 minutes)

1. **Start login**: Click "Login with SIROS ID" in your app
2. **Scan QR code**: Use your test wallet to scan the QR code
3. **Approve sharing**: Review and approve the credential request
4. **Complete**: You're logged in with verified claims!

## What Just Happened?

```mermaid
sequenceDiagram
    participant User
    participant App as Your App
    participant Verifier as SIROS ID
    participant Wallet

    User->>App: Click "Login"
    App->>Verifier: OIDC authorize request
    Verifier->>Wallet: Request credential (QR/link)
    User->>Wallet: Approve sharing
    Wallet->>Verifier: Present credential
    Verifier->>Verifier: Verify signature & trust
    Verifier->>App: ID token with claims
    App->>User: Welcome, Alice!
```

Your application received verified identity claims directly from the user's credential:

```json
{
  "sub": "unique-user-id",
  "given_name": "Alice",
  "family_name": "Smith",
  "birthdate": "1990-01-15"
}
```

## Requesting Specific Claims

Use scopes to request different credentials:

| Scope | What You Get |
|-------|--------------|
| `openid` | Basic authentication |
| `profile` | Name, birthdate from PID |
| `pid` | Full Person ID claims |
| `ehic` | Health insurance card |
| `diploma` | Educational credentials |

Example:

```
scope=openid profile ehic
```

## Going to Production

1. **Register for production**: Contact SIROS ID to get production credentials
2. **Configure trust**: Set up your trust framework registration
3. **Update tenant/instance**: Use your production tenant and verifier instance at `app.siros.org`

## Next Steps

- 📖 [Full Verifier Guide](verifiers/verifier) – Complete verification documentation
- 🎫 [Issuing Credentials](issuers/issuer) – Issue your own credentials
- 🔐 [Trust Services](./trust/) – Configure trust framework
- 🔧 [Keycloak Integration](./verifiers/keycloak_verifier) – Detailed Keycloak setup

## Common Issues

### QR Code Not Scanning

- Ensure the wallet app has camera permissions
- Try the deep link option for mobile browsers

### Claims Not Appearing

- Check that requested scopes match available credentials
- Verify the credential type in your wallet matches the request

### Token Validation Fails

- Ensure your clock is synchronized (NTP)
- Check the JWKS endpoint is accessible

## Get Help

- 📧 Email: support@siros.org
-  GitHub: [sirosfoundation](https://github.com/sirosfoundation)
