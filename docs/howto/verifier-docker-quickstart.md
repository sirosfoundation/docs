---
sidebar_position: 5
sidebar_label: Verifier Docker Quick Start
---

# Verifier Docker Quick Start

Run the SIROS ID verifier and go-trust with Docker Compose and request a PID with given and family name.

## 1. Create the files

Requires Docker Compose, `openssl`, `curl` and `jq`.

```bash
mkdir -p vq/pki vq/metadata vq/presentation_requests && cd vq
openssl ecparam -name prime256v1 -genkey -noout -out pki/verifier_key.pem
openssl req -x509 -new -key pki/verifier_key.pem -sha256 -days 365 -subj "/CN=verifier.example.org" \
  -addext "subjectAltName=DNS:verifier.example.org" -out pki/verifier_chain.pem
curl -fsS https://registry.siros.org/api/v1/schemas/25e0b924-d5d9-5ecd-b5ef-dc32905efb1c.json \
  | jq -r '.schemaURIs[] | select(.formatIdentifier=="dc+sd-jwt").uri' \
  | xargs curl -fsSL -o metadata/vctm_pid.json
```

`docker-compose.yml`:

```yaml
services:
  verifier:
    image: ghcr.io/sirosfoundation/vc/verifier:latest
    user: "${VC_UID}:${VC_GID}"
    ports: ["8080:8080"]
    environment: [VC_CONFIG_YAML=/config.yaml]
    volumes:
      - ./config.yaml:/config.yaml:ro
      - ./pki:/pki:ro
      - ./metadata:/metadata:ro
      - ./presentation_requests:/presentation_requests:ro
    depends_on: [mongo, go-trust]
    healthcheck: {test: ["CMD-SHELL", "curl -fs http://localhost:8080/health | grep -q STATUS_OK"]}
  go-trust:
    image: ghcr.io/sirosfoundation/go-trust:latest
    command: ["--config", "/config.yaml"]
    ports: ["127.0.0.1:6001:6001"]
    volumes: ["./trust-config.yaml:/config.yaml:ro"]
  mongo:
    image: mongo:7
```

`trust-config.yaml` (the allow-all registry is for development only; a production PDP must use real trust sources such as trust lists or federation):

```yaml
server: {host: "0.0.0.0", port: "6001"}
registries:
  always_trusted: {enabled: true}
```

`config.yaml`:

```yaml
common:
  mongo: {uri: "mongodb://mongo:27017"}
  credential_metadata:
    pid: {vctm_file_path: "/metadata/vctm_pid.json", format: "dc+sd-jwt"}
verifier:
  api_server: {addr: ":8080", trust_proxy_tls: true}
  public_url: "https://verifier.example.org"
  key_config: {private_key_path: "/pki/verifier_key.pem", chain_path: "/pki/verifier_chain.pem"}
  trust: {pdp_url: "http://go-trust:6001"}
  inbound:
    openid4vp:
      token_endpoint: "https://verifier.example.org/token"
      presentation_requests_dir: "/presentation_requests"
      supported_credentials: [{vct: "urn:eudi:pid:1", scopes: ["pid"]}]
      clients:
        default: {type: "public", redirect_uri: "https://verifier.example.org/", scopes: ["pid"]}
  outbound:
    oidc_provider:
      issuer: "https://verifier.example.org"
      subject_type: "pairwise"
      subject_salt: "dev-only-change-me"
```

## 2. Define the presentation request

`presentation_requests/pid.yaml` binds the scope `pid` to a DCQL query for the EUDI PID (SD-JWT VC type `urn:eudi:pid:1`; the mdoc doctype is `eu.europa.ec.eudi.pid.1`):

```yaml
templates:
  - id: pid_name
    name: PID name
    oidc_scopes: [pid]
    dcql:
      credentials:
        - id: pid
          format: dc+sd-jwt
          meta: {vct_values: ["urn:eudi:pid:1"]}
          claims:
            - path: [given_name]
            - path: [family_name]
    claim_mappings: {given_name: given_name, family_name: family_name}
```

## 3. Start

```bash
export VC_UID=$(id -u) VC_GID=$(id -g)
docker compose up -d
curl http://localhost:8080/health
```

You should see `"status":"STATUS_OK_verifier"`, and `docker compose logs verifier` shows `Loaded presentation request templates` and `Trust evaluator initialized`.

## 4. See it work

Open `https://verifier.example.org/` (your public HTTPS URL for port 8080), choose PID and scan the QR code with an OpenID4VP wallet. The verifier asks the wallet for `given_name` and `family_name` and logs `Issuer trust verified`.

## Next steps

- [Use the verifier as an OpenID Provider for your application](/sirosid/verifiers/oidc-rp)
- [Verifier configuration](/sirosid/verifiers/verifier)
