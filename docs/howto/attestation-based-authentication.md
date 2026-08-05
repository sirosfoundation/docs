---
sidebar_position: 4
sidebar_label: Attestation-Based Authentication
---

# Attestation-Based Authentication and Authorization

This guide walks through wiring up **wallet attestation** end-to-end: a wallet authenticates to a credential issuer using a wallet-provider-signed attestation (WIA) plus a per-request proof-of-possession (PoP), with **no pre-registered OAuth `client_id`** anywhere in the flow. See [Wallet Attestation](../sirosid/trust/wallet-attestation.md) for the concepts and security model this guide assumes.

:::tip Three components, three repos
A working deployment touches three independently-configured pieces: the **wallet provider** (issues WIAs), the **issuer** (verifies them and asks the PDP for a trust decision), and the **wallet client** (generates and attaches the attestation headers). This guide configures all three, in that order, then verifies the whole chain with a real PAR request.
:::

## Prerequisites

- A credential issuer with a reachable [Go-Trust PDP](../sirosid/trust/go-trust.md) — `trust.pdp_url` must be set for wallet attestation to activate at all.
- A wallet provider capable of issuing WIAs (this guide uses go-wallet-backend's `wallet_provider.wia` support; any provider implementing [draft-ietf-oauth-attestation-based-client-auth](https://www.ietf.org/archive/id/draft-ietf-oauth-attestation-based-client-auth-10.html) works).
- A wallet client that can generate the attestation headers per flow (this guide uses wallet-frontend's pattern; native SDKs can follow the same shape).

## Step 1 — Configure the wallet provider

Enable WIA issuance and pick an identity format:

```yaml
wallet_provider:
  private_key_path: /path/to/wallet-provider-key.pem
  certificate_path: /path/to/wallet-provider-cert.pem   # only needed for the x5c format below
  wia:
    enabled: true
    issuer: "https://wallet-provider.example.com"
    omit_x5c: true    # see the two formats below
```

There are two identity formats, and they're **mutually exclusive in practice** even though `omit_x5c` looks like a toggle:

| | `omit_x5c: false` (default) | `omit_x5c: true` |
|---|---|---|
| WIA header carries | An `x5c` certificate chain | Nothing — no embedded key material |
| Relying party resolves the key from | The embedded certificate (authoritative) | The provider's own JWKS, discovered from `iss` |
| Use when | You already run a PKI for the wallet provider | You want to avoid managing a cert chain, or need to interop with relying parties that only implement `iss`/JWKS-based resolution |

If you pick `omit_x5c: true`, the wallet provider must publish its signing key somewhere the issuer's discovery can find it. go-wallet-backend does this automatically at two paths once `issuer` is set:

```
GET https://wallet-provider.example.com/.well-known/jwks.json
GET https://wallet-provider.example.com/.well-known/oauth-authorization-server
```

The second is RFC 8414 metadata wrapping the first — publish both if you're rolling your own provider, since relying parties differ in which discovery path they try (see [Wallet Attestation](../sirosid/trust/wallet-attestation.md#trust-evaluation) for the full discovery chain).

## Step 2 — Configure the issuer

```yaml
apigw:
  trust:
    pdp_url: "https://trust.example.com/pdp"
    wallet_attestation:
      enabled: true
```

That's the minimum. `wallet_attestation.policy` is optional and defaults to "open" — any wallet provider the PDP trusts is authorized for any scope. Add it only if you need per-scope tiering by attestation strength (e.g. requiring hardware-backed attestation for a specific credential type):

```yaml
apigw:
  trust:
    wallet_attestation:
      enabled: true
      policy:
        rules:
          - "(wallet (attestation_source ios_app_attest)(scope pid)(issuer *))"
```

## Step 3 — Make the wallet provider trusted by the PDP

The issuer's own config only says "check attestations." The PDP decides whether a *specific* wallet provider is trusted — this is the actual admission-control point. Simplest option, a whitelist registry:

```yaml
registries:
  whitelist:
    enabled: true
lists:
  wallet-providers:
    - "https://wallet-provider.example.com"
actions:
  wallet_provider: "wallet-providers"
```

For production, prefer [OpenID Federation](../sirosid/trust/openid-federation.md) so wallet providers can be added/removed without touching the PDP's static config.

## Step 4 — Generate the attestation on the wallet client

Per flow, the client needs to generate and attach two things to the PAR/token request:

```
OAuth-Client-Attestation: <WIA JWT>
OAuth-Client-Attestation-PoP: <per-flow PoP JWT>
```

The WIA itself is obtained from the wallet provider (typically a challenge/response: fetch a nonce, sign it into a request-PoP, exchange for the WIA). Getting the *claims* right is where real integrations lose the most time — three values are easy to conflate:

| Value | What it is | Goes into |
|-------|-----------|-----------|
| The wallet's own `client_id` for this flow | For an unregistered client, this is the wallet's `redirect_uri` (OID4VCI §7.1 convention) — **not** the credential issuer's URL | The WIA's `sub` claim, and the per-flow PoP's `iss` |
| The credential issuer's URL | Parsed from the credential offer | The per-flow PoP's `aud` — it's sent *to* the issuer |
| The wallet provider's URL | Wherever the WIA itself was requested from | The **request**-PoP's `aud` — a separate JWT, sent to the provider, never to the issuer |

Two of these being swapped are exactly the bugs a real integration (wallet-frontend) hit and fixed — see the troubleshooting table below for the exact symptoms.

## Verifying it works

Drive a real PAR request (through your wallet client, or by hand) and check for `request_uri` in the response — a bare `/authorize?client_id=...` redirect with **no** `request_uri` means PAR silently fell through to a different (or no) authentication path. Trace the request through the issuer's logs; each stage below logs distinctly, so you can tell exactly where a failing attempt stopped.

## Troubleshooting

These are the actual errors hit (in order) getting a real deployment working, each a genuinely different root cause:

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Bare `/authorize` redirect, no `request_uri`, issuer logs show nothing attestation-related at all | The wallet client never attached the attestation headers for this transport/code path | Confirm the client's attestation generation runs for *every* transport it supports — it's easy to wire it into one code path and miss another |
| `JWT signature verification failed: ... failed to discover JWKS for issuer ...: HTTP 404` (all four discovery paths) | The wallet provider's `iss` doesn't resolve to *any* of the discovery documents the issuer tries — often because the provider only publishes a bare `.well-known/jwks.json` with no wrapping metadata document | Publish RFC 8414 metadata (`.well-known/oauth-authorization-server`) alongside the bare JWKS — see Step 1 |
| `wallet attestation subject does not match client_id` | The WIA's `sub` was set to something other than the exact `client_id` the issuer resolves for this request (e.g. the credential issuer's own URL instead of the wallet's `redirect_uri`) | Set the WIA's `sub`/client_id to the same value used as the OAuth `client_id` on the wire — see the table in Step 4 |
| `attestation PoP validation failed: PoP aud [...] does not contain expected audience [issuer URL]` | The per-flow PoP's `aud` was set to the wallet's own `client_id` instead of the credential issuer's URL | The per-flow PoP is sent *to* the issuer — its `aud` must be the issuer's URL, not the wallet's own identifier |
| `[internal_server_error] credential type "..." has no data source configured` (after PAR/`authorize` succeed) | Not an attestation problem — the flow authenticated fine; this specific credential type just isn't wired to a data source on the issuer | Confirm attestation is working by trying a different, already-configured credential type before debugging further |

## Related

- [Wallet Attestation](../sirosid/trust/wallet-attestation.md) — concepts, wire format, and security model
- [Go-Trust](../sirosid/trust/go-trust.md) — PDP configuration and registry setup
- [Issuer Configuration](../sirosid/issuers/issuer.md) — general issuer setup
