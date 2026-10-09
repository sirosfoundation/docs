---
sidebar_position: 5
sidebar_label: Verifier Quick Start
---

# Verifier Quick Start: Trust an Issuer

This guide gets a SIROS ID verifier running that accepts credentials from **one specific issuer** and rejects everyone else. The whole setup is one verifier, one trust service and one small file holding the issuer's certificate.

After following it you will have:

- a verifier and a [go-trust](/sirosid/trust/go-trust) policy decision point (PDP) running under Docker Compose
- the issuer's certificate configured as the only trust anchor
- a verified end-to-end check that a credential from that issuer is accepted and a credential from any other issuer is refused

:::danger A PDP is required for production
Every trust decision goes through the PDP configured in `verifier.trust.pdp_url`. A PDP is required for production use. If `pdp_url` is omitted the verifier runs in "allow all" mode: it trusts every issuer (with only a log warning at startup) and resolves only self-contained `did:key` and `did:jwk` identifiers, locally. That mode is not supported and is for development and testing only. This guide therefore sets up the PDP from the start; it needs only one extra file.
:::

## How the trust decision works

The verifier does not hold a list of issuers itself. When a wallet presents an SD-JWT VC, the verifier reads the issuer's signing key from the credential (the `x5c` certificate chain in the JWS header) and asks the PDP, over [AuthZEN](https://openid.github.io/authzen/), whether that key belongs to a trusted credential issuer. The PDP says yes or no, and the verifier fails closed: no answer or a negative answer means the presentation is refused.

The easiest way to make go-trust say yes for an issuer is to give it that issuer's certificate in a PEM file (an `etsi` registry with a `cert_bundle`). There is no trust list to publish and no federation to join. When you later outgrow a single file, the same PDP can read ETSI trust lists, LoTE, OpenID Federation and more without any change to the verifier; see [Trust Services](/sirosid/trust/).

## Prerequisites

- Docker with the Compose plugin (`docker compose`)
- `openssl` and `curl`; `jq` for the check in step 6
- A **public HTTPS URL** for the verifier, with TLS terminated by a reverse proxy or tunnel in front of port 8080. Wallets must be able to reach it. Below, `verifier.example.org` stands for that host name.
- The **issuer's certificate**, as a PEM file. Ask the issuer operator for the CA certificate that signs their credentials, or for the signing certificate itself. If you run a SIROS ID issuer, it is the first certificate in the file referenced by `issuer.key_config.chain_path` (see [Issuer Deployment](/sirosid/issuers/deployment)). If you only have a credential issued by it, you can [extract the certificate from the credential](#extracting-the-issuer-certificate-from-a-credential).
- A wallet that can present the credential, for the end-to-end check in step 7. Step 6 needs no wallet.

## Step 1: Create the project directory and the verifier key

```bash
mkdir -p verifier-quickstart/pki verifier-quickstart/metadata
cd verifier-quickstart

# The verifier's signing key (JARs and OIDC tokens)
openssl ecparam -name prime256v1 -genkey -noout -out pki/verifier_key.pem

# Development only: a self-signed certificate whose DNS SAN is your public host.
# In production use a certificate chain issued by a CA your wallets trust.
openssl req -x509 -new -key pki/verifier_key.pem -sha256 -days 365 \
  -subj "/CN=verifier.example.org" \
  -addext "subjectAltName=DNS:verifier.example.org" \
  -out pki/verifier_chain.pem

# The credential type the verifier will request (PID in this guide)
curl -fsSL -o metadata/vctm_pid.json \
  https://raw.githubusercontent.com/SUNET/vc/main/metadata/vctm_pid.json
```

Replace `verifier.example.org` with your own public host name in the `openssl req` command, and again in `config.yaml` in step 4. With the default `client_id_scheme: x509_san_dns` the DNS SAN in `verifier_chain.pem` must match the host of `public_url`, or wallets reject the request.

**What you should see:** `pki/` holds `verifier_key.pem` and `verifier_chain.pem`, and `metadata/vctm_pid.json` is a JSON file whose `vct` is `urn:eudi:pid:1`.

## Step 2: Tell the PDP which issuer to trust

Copy the issuer's certificate into `trusted-issuers.pem`:

```bash
cp /path/to/issuer-ca.pem trusted-issuers.pem

# Check what you are about to trust
openssl x509 -in trusted-issuers.pem -noout -subject -issuer -dates
```

This file **is** the integration: whoever holds a private key certified by a certificate in this file can issue credentials your verifier accepts. Put only the issuer CAs (or signing certificates) you mean to trust in it. You can list several PEM blocks in one file to trust several issuers.

:::tip Trusting the signing certificate directly
If the issuer has no CA, or you only have its signing certificate, put that certificate in the file instead. It works the same way, but you must update the file whenever the issuer rotates the signing key. A CA certificate survives rotation.
:::

**What you should see:** the `subject` and `issuer` lines name the issuer, and the dates cover today.

## Step 3: Configure go-trust

Create `trust-config.yaml`:

```yaml
server:
  # go-trust listens on 127.0.0.1 by default, which a published container
  # port cannot reach
  host: "0.0.0.0"
  port: "6001"

registries:
  etsi:
    enabled: true
    name: "trusted-issuers"
    # PEM file with the certificates to trust
    cert_bundle: "/trusted-issuers.pem"
```

No `policies:` section is needed: with none configured, a positive answer from any enabled registry is a "trusted" decision. To restrict an issuer to specific credential types or roles later, see [Policy-Based Trust Decisions](/sirosid/trust/go-trust#policy-based-trust-decisions).

## Step 4: Configure the verifier

Create `config.yaml`. This configuration passes the verifier's strict config parsing and startup validation:

```yaml
common:
  mongo:
    uri: mongodb://mongo:27017
  # Each key is a credential scope the verifier can request
  credential_metadata:
    pid:
      vctm_file_path: "/metadata/vctm_pid.json"
      format: "dc+sd-jwt"

verifier:
  api_server:
    addr: :8080
    # TLS is terminated by a reverse proxy in front of the verifier
    trust_proxy_tls: true
  public_url: "https://verifier.example.org"

  # Signs request objects (JARs) and OIDC tokens; published at /jwks
  key_config:
    private_key_path: "/pki/verifier_key.pem"
    chain_path: "/pki/verifier_chain.pem"

  inbound:
    openid4vp:
      token_endpoint: "https://verifier.example.org/token"
      # Every scope here must also appear in clients[].scopes, and vice versa
      supported_credentials:
        - vct: "urn:eudi:pid:1"
          scopes: ["pid"]
      clients:
        "default":
          type: "public"
          redirect_uri: "https://verifier.example.org/"
          scopes: ["pid"]

  outbound:
    oidc_provider:
      issuer: "https://verifier.example.org"
      subject_type: "pairwise"
      # Development value. For production keep it in a secrets file
      # (common.secret_file_path) and generate it with: openssl rand -hex 32
      subject_salt: "dev-only-change-me"

  # The trust gate: every issuer decision is delegated to this AuthZEN PDP
  trust:
    pdp_url: "http://go-trust:6001"
```

`verifier.trust.pdp_url` is the only trust setting you need. The credential type, its scope and the `vct` the issuer must put in its credentials (`urn:eudi:pid:1` here) come from the VCTM file and `supported_credentials`; to accept a different credential type, add its VCTM file under `common.credential_metadata` and a matching `supported_credentials` and `clients[].scopes` entry, as described in [Verifier Configuration](/sirosid/verifiers/verifier#configuring-presentation-requests). The full key list is in the [VC Configuration Reference](/sirosid/reference/vc-configuration).

## Step 5: Start the stack

Create `docker-compose.yaml`:

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc/verifier:latest
    restart: unless-stopped
    # Lets the container read the bind-mounted key (see the note below)
    user: "${VC_UID}:${VC_GID}"
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
    environment:
      - VC_CONFIG_YAML=/config.yaml
    depends_on:
      - mongo
      - go-trust

  # The trust gate: an AuthZEN policy decision point
  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:6001:6001"
    volumes:
      - ./trust-config.yaml:/config.yaml:ro
      - ./trusted-issuers.pem:/trusted-issuers.pem:ro
    command: ["--config", "/config.yaml"]
    healthcheck:
      # The image's own health check probes port 8080; also, /healthz does
      # not answer HEAD requests, so avoid "wget --spider"
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:6001/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

```bash
export VC_UID=$(id -u) VC_GID=$(id -g)
docker compose up -d
docker compose logs verifier go-trust
```

:::note Why `user:`?
The verifier image runs as an unprivileged user that cannot read a `0600` private key owned by you on the host, and `openssl` creates keys with mode `0600`. Running the container as your own user is the simplest fix for a local setup. In production, give the key to the container's user instead (or mount it from a secrets store).
:::

**What you should see** in the verifier log, as JSON lines:

```text
"msg":"Trust evaluator initialized","mode":"authzen","pdp_url":"http://go-trust:6001"
"logger":"verifier.httpserver","msg":"Started"
```

and in the go-trust log:

```text
msg="ETSI TSL registry registered from config"
msg="Starting API server" address="0.0.0.0:6001" ...
```

If the verifier log instead says `Trust evaluation is DISABLED - no pdp_url configured. All credential issuers will be trusted.`, the `trust.pdp_url` setting was not picked up. Also check that `http://localhost:6001/readyz` (go-trust) answers `"ready":true` and that `curl http://localhost:8080/health` (verifier) answers `STATUS_OK_verifier`.

## Step 6: Ask the PDP directly (no wallet needed)

The verifier asks go-trust exactly this question for every presentation. You can ask it yourself with the issuer's certificate and with one it should not trust:

```bash
check_issuer() {  # usage: check_issuer <certificate.pem> <issuer-identifier>
  chain=$(openssl x509 -in "$1" -outform DER | base64 | tr -d '\n')
  curl -s http://localhost:6001/evaluation -H 'Content-Type: application/json' -d "{
    \"subject\":  {\"type\": \"key\", \"id\": \"$2\"},
    \"resource\": {\"type\": \"x5c\", \"id\": \"$2\", \"key\": [\"$chain\"]},
    \"action\":   {\"name\": \"credential-issuer\"}
  }" | jq -c '{decision, registry: .context.reason.registry, error: .context.reason.error}'
}

# 1. The issuer you configured in step 2
check_issuer trusted-issuers.pem https://issuer.example.org

# 2. A throwaway certificate nobody asked you to trust
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout /dev/null -subj "/CN=Untrusted Issuer" -days 1 -out untrusted.pem >/dev/null 2>&1
check_issuer untrusted.pem https://untrusted.example.net
```

**What you should see:**

```json
{"decision":true,"registry":"trusted-issuers","error":null}
{"decision":false,"registry":null,"error":"no registry returned positive match"}
```

The second answer is the trust gate working. `decision` is the only field the verifier acts on. To see why go-trust refused, drop the `jq` filter: for an unknown certificate the registry reports `x509: certificate signed by unknown authority`.

## Step 7: Present a credential end to end

:::caution Use the verifier's own page for this check
The issuer check described in this guide currently applies to presentations that arrive at `POST /verification/direct_post`. That is the endpoint used by the verifier's own web page at `/`. The request object created for an OIDC `/authorize` session (the QR code and same-device link shown to a user logging in through Keycloak or another relying party) instead points the wallet at `POST /verification/oidc-direct_post`, which currently extracts the claims from SD-JWT VC and mdoc presentations without verifying the credential signature or asking the PDP. In a test, a credential from an untrusted issuer was accepted on that endpoint. Until this is fixed, do not rely on this trust configuration to protect an OIDC login flow, and use the page at `/` for the checks below.
:::

1. Make sure the wallet holds a PID credential from the issuer whose certificate is in `trusted-issuers.pem`, signed with the `urn:eudi:pid:1` type.
2. Open `https://verifier.example.org/` (your public URL) in a browser. The page lists the credential types configured under `common.credential_metadata`; choose **PID** and request it. The page shows a QR code (and a same-device link).
3. Scan the QR code with the wallet and approve sharing.

**What you should see:** the wallet reports success and the verifier log contains

```text
"msg":"Issuer trust verified","scope":"pid","issuer_id":"https://issuer.example.org","key_type":"x5c"
```

and go-trust logs a `POST "/evaluation"` request with status 200.

### The failure case

Present a credential from an issuer that is **not** in `trusted-issuers.pem` (for example one from a different test issuer). The verifier refuses it. The wallet's POST to `/verification/direct_post` gets HTTP 500 with

```json
{"error":{"title":"internal_server_error","details":"issuer trust evaluation failed for scope pid: issuer not trusted: "}}
```

and the verifier log shows

```text
"msg":"WARN: Issuer not trusted","scope":"pid","issuer_id":"https://evil.example.net","key_type":"x5c"
"msg":"issuer trust evaluation failed","scope":"pid","error":"issuer not trusted: "
```

The go-trust log shows the matching decision:

```text
msg="trust decision: deny" action=credential-issuer decision=false reason="no registry returned positive match" resource_type=x5c subject_id="https://evil.example.net"
```

The reason after `issuer not trusted:` is empty for this registry; go-trust's log has the detail.

To add a second issuer, append its certificate to `trusted-issuers.pem` and restart go-trust (`docker compose restart go-trust`).

## Variant: the issuer publishes a JWKS instead of a certificate

Some issuers sign without an `x5c` header and publish their keys at `<issuer>/.well-known/jwt-vc-issuer` (SD-JWT VC issuer metadata). For these, the verifier fetches the key from the issuer's metadata (by the credential's `kid`) and go-trust checks that the key belongs to an allow-listed issuer URL. Replace the `etsi` registry in `trust-config.yaml` with a `whitelist` registry:

```yaml
server:
  host: "0.0.0.0"
  port: "6001"

registries:
  whitelist:
    enabled: true
    lists:
      issuers:
        - "https://issuer.example.org"   # must equal the credential's `iss`
    actions:
      credential-issuer: issuers
```

go-trust fetches the listed issuers' keys when it starts and refreshes them every 5 minutes, and the issuer must serve its metadata over HTTPS (plain HTTP is for testing only, via `allow_http: true`). Restart go-trust after changing the file. The `iss` claim of the credentials must exactly match the listed URL. No `trusted-issuers.pem` is needed in this variant, so drop its volume from the compose file.

:::note Credentials that carry an `x5c` header
If a credential has an `x5c` header, the verifier always uses the certificate chain (the first variant), whether or not the issuer also publishes a JWKS. Use the variant that matches how the issuer signs.
:::

## Extracting the issuer certificate from a credential

If you have an SD-JWT VC issued by the issuer (the string that starts with the issuer-signed JWT), you can pull the signing certificate out of its header:

```bash
CRED='eyJhbGciOiJFUzI1NiIs...'   # the full SD-JWT string

printf '%s' "$CRED" \
  | jq -Rr 'split(".")[0] | gsub("-";"+") | gsub("_";"/") | @base64d | fromjson | .x5c[0]' \
  | base64 -d | openssl x509 -inform DER -out trusted-issuers.pem
```

`x5c[0]` is the signing (leaf) certificate. To trust the issuer's CA instead, ask the issuer for it; do not assume the last certificate in `x5c` is the right anchor.

## Troubleshooting

| What you see | Where | Cause and fix |
|---|---|---|
| `issuer trust evaluation failed for scope pid: issuer not trusted: ` | verifier log, HTTP 500 to the wallet | The PDP refused the issuer. Run `check_issuer` (step 6) with the credential's certificate and read go-trust's reason. Most often the issuer's CA or signing certificate is not in `trusted-issuers.pem`. |
| `x509: certificate signed by unknown authority` | go-trust reason | The presented chain does not lead to a certificate in the bundle. Add the issuer's CA (or signing certificate) to `trusted-issuers.pem`, and restart go-trust. |
| `trust evaluation error: trust evaluation failed: HTTP request failed: Post "http://go-trust:6001/evaluation": dial tcp ...` | verifier log | The PDP is unreachable, so the verifier refuses the presentation (fail closed). Check `docker compose ps`, that the service is called `go-trust`, and `pdp_url`. |
| `subject not in whitelist for action 'credential-issuer'` | go-trust reason (whitelist variant) | The credential's `iss` is not in the list, or `actions` does not map `credential-issuer` to your list. |
| `no keys cached for entity; call Refresh() to load keys` | go-trust reason (whitelist variant) | go-trust could not fetch the issuer's JWKS when it started (issuer not reachable yet, not HTTPS, or no `/.well-known/jwt-vc-issuer`). Fix that and `docker compose restart go-trust`. |
| `failed to resolve issuer key from JWKS` | verifier log | The credential has a `kid` but no `x5c`, and the verifier could not load the issuer's JWKS from its metadata. |
| `credential missing x5c, jwk, or kid header and issuer is not a DID` | verifier log | The credential carries no usable key material; ask the issuer to include an `x5c` chain or a `kid` with published metadata. |
| `algorithm "RS256" is not in the allowed list` | verifier log | The credential's `alg` is not permitted by `verifier.trust.allowed_signature_algorithms` (default: `ES*`, `RS*`, `PS*`, `EdDSA`). |
| `invalid request: subject.type must be 'key' or 'url', got ''` | go-trust response | Your hand-written `/evaluation` request is malformed; use the body from step 6. |
| `no valid credentials found for requested scopes` | verifier log | The scope requested does not select a configured credential; it must be a key of `common.credential_metadata` (or in a presentation-request template's `oidc_scopes`). |
| `PKI signing key not loaded ... open /pki/verifier_key.pem: permission denied` | verifier log | The container user cannot read the key. Export `VC_UID`/`VC_GID` before `docker compose up` (step 5). If they were unset, Compose warns `The "VC_UID" variable is not set` and starts the container as the image user. |
| `failed to load secrets file ... permission denied` | verifier startup panic | Only when you use `common.secret_file_path`: the file must be `0600` or `0400` **and** readable by the container's user, so own it with the same UID as above. |
| Verifier shows `(unhealthy)` in `docker compose ps` although it works | Docker | The image's health check probes HTTPS and `trust_proxy_tls: true` serves plain HTTP. Override it with `healthcheck: {test: ["CMD", "curl", "-fsS", "http://localhost:8080/health"]}` or ignore it. |
| An untrusted issuer was accepted | OIDC login flow | See the caution in step 7: the OIDC flow does not currently check issuers. |

## Next steps

- [Verifier Configuration](/sirosid/verifiers/verifier): client registration, presentation requests, presets and revocation checking
- [Keycloak Integration](/sirosid/verifiers/keycloak_verifier) and [Direct OIDC Integration](/sirosid/verifiers/oidc-rp): connect an application (read the caution in step 7 first)
- [Go-Trust AuthZEN Service](/sirosid/trust/go-trust): more registries (ETSI trust lists, LoTE, OpenID Federation, DID) and per-role policies
- [Trust Services](/sirosid/trust/): choosing a trust framework for production
- [Verifier Deployment](/sirosid/verifiers/deployment): production images, secrets and checklist
