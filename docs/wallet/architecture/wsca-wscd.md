---
sidebar_position: 1
---

# WSCA/WSCD Architecture

This page describes the Wallet Secure Cryptographic Application (WSCA) and Wallet Secure Cryptographic Device (WSCD) architecture used by the SIROS ID platform for key management and Proof of Possession operations.

## Overview

The EUDI Wallet must support multiple WSCD backends — remote HSMs, FIDO2 security keys, and software key stores — while presenting a unified key operation API to the wallet application layer. The `siros-wscd-manager` Rust crate provides this abstraction as a pluggable manager consumed by both native mobile SDKs (via UniFFI) and web clients (via WASM through the wallet-companion browser extension).

## Component Diagram

```mermaid
graph TB
    subgraph "Client Applications"
        MA[Mobile App<br/>Kotlin / Swift]
        WF[Web Wallet<br/>wallet-frontend]
    end

    subgraph "Integration Layer"
        UF[UniFFI Bindings]
        WC[wallet-companion<br/>Browser Extension]
    end

    subgraph "siros-wscd-manager"
        WM[WscdManager]
        SK[SoftkeyPlugin<br/>JWE Container]
        R2[R2psPlugin<br/>Remote HSM]
        FD[PreviewSignPlugin<br/>FIDO2 rawSign]
    end

    subgraph "WSCD Backends"
        SW[Software Key Store<br/>Encrypted at rest]
        RS[R2PS Service<br/>go-r2ps-service]
        FK[FIDO2 Authenticator<br/>YubiKey / Security Key]
    end

    subgraph "Server-Side WSCA/WSCD"
        WSCA[WSCA Role<br/>WKA · WIA · Revoke · Suspend]
        WSCD[WSCD Role<br/>Keygen · ECDSA · ECDH]
        HSM[PKCS#11 HSM<br/>QSCD]
        DB[(MongoDB<br/>Public Keys · OPAQUE Records)]
    end

    MA --> UF
    WF --> WC

    UF --> WM
    WC -->|WASM| WM

    WM --> SK
    WM --> R2
    WM --> FD

    SK --> SW
    R2 -->|R2PS Protocol<br/>OPAQUE / WebAuthn| RS
    FD -->|CTAP2<br/>BLE / NFC / USB| FK

    RS --> WSCA
    RS --> WSCD
    WSCD --> HSM
    WSCA --> DB
    WSCD -->|PutPublicKey| DB
```

## Native Deployment (Mobile)

In the native deployment, `siros-wscd-manager` is compiled as a Rust library and exposed to Kotlin (Android) and Swift (iOS) via [UniFFI](https://mozilla.github.io/uniffi-rs/) bindings. The host application implements the callback traits to provide UI for authentication and progress.

```mermaid
graph LR
    subgraph "Mobile Device"
        subgraph "Host App (Kotlin / Swift)"
            UI[Wallet UI]
            AC[AuthCallback<br/>PIN · WebAuthn]
            PC[ProgressCallback<br/>Spinners]
            CT[Ctap2Transport<br/>BLE / NFC]
        end

        subgraph "UniFFI Bridge"
            UB[Generated Bindings<br/>Kotlin ↔ Rust · Swift ↔ Rust]
        end

        subgraph "siros-wscd-manager (Native Library)"
            WM2[WscdManager]
            SK2[SoftkeyPlugin]
            R2P[R2psPlugin]
            FD2[PreviewSignPlugin]
        end

        subgraph "Local WSCD"
            SE[Secure Enclave /<br/>StrongBox]
            YK[YubiKey<br/>via NFC/USB]
        end
    end

    subgraph "Remote WSCD"
        R2S[R2PS Service<br/>go-r2ps-service]
        HSM2[PKCS#11 HSM]
    end

    UI --> UB
    AC --> UB
    PC --> UB
    CT --> UB
    UB --> WM2
    WM2 --> SK2
    WM2 --> R2P
    WM2 --> FD2

    SK2 -->|JWE encrypted<br/>key container| SE
    R2P -->|HTTPS + OPAQUE| R2S
    FD2 -->|CTAP2 rawSign| YK
    R2S --> HSM2

    style SE fill:#e6f3ff,stroke:#4a90d9
    style HSM2 fill:#e6f3ff,stroke:#4a90d9
    style YK fill:#e6f3ff,stroke:#4a90d9
```

### Native Key Flow

1. **Key Generation**: The wallet calls `WscdManager::generate_key()`. The manager resolves the target plugin (per configuration) and delegates. For R2PS, this triggers an OPAQUE-authenticated `p256_generate` call to the remote HSM. The key binding (`kid → plugin`) is recorded automatically.
2. **Signing (PoP)**: The wallet calls `WscdManager::sign()` with the key ID. The manager looks up the key binding, resolves the plugin, and delegates. For R2PS, this runs the OPAQUE session protocol and calls `hsm_ecdsa`.
3. **Callbacks**: The host app provides `AuthCallback` (to collect the user's PIN or trigger a WebAuthn assertion) and `ProgressCallback` (to update UI spinners). For FIDO2, `Ctap2Transport` relays CTAP2 commands over BLE/NFC.

## Web Deployment (Browser Extension)

In the web deployment, `siros-wscd-manager` is compiled to WebAssembly and loaded by the **wallet-companion** browser extension. The extension bridges the gap between the web wallet (wallet-frontend) and hardware-backed key operations that are not available to pure web applications.

```mermaid
graph LR
    subgraph "Browser"
        subgraph "Web Wallet (wallet-frontend)"
            WUI[Wallet UI<br/>React PWA]
            API[Credential API Calls]
        end

        subgraph "wallet-companion Extension"
            BG[Background Script<br/>Service Worker]
            WASM[siros-wscd-manager<br/>WASM Module]
            CS[Content Script<br/>Page ↔ Extension Bridge]
        end

        subgraph "Browser APIs"
            WA[WebAuthn API<br/>navigator.credentials]
            DC[Digital Credentials API<br/>navigator.credentials.get]
        end
    end

    subgraph "Remote WSCD"
        R2S2[R2PS Service<br/>go-r2ps-service]
        HSM3[PKCS#11 HSM]
    end

    subgraph "External WSCD"
        YK2[FIDO2 Security Key<br/>USB / NFC]
    end

    WUI --> CS
    CS --> BG
    API --> CS
    BG --> WASM

    WASM -->|SoftkeyPlugin<br/>IndexedDB / Extension Storage| BG
    WASM -->|R2psPlugin<br/>fetch API + OPAQUE| R2S2
    WASM -->|PreviewSignPlugin| WA

    WA --> YK2
    BG --> DC
    R2S2 --> HSM3

    style WASM fill:#fff3e0,stroke:#f57c00
    style BG fill:#fff3e0,stroke:#f57c00
```

### Web Key Flow

1. **Extension Loading**: When wallet-companion starts, the background service worker initializes the WASM module containing `siros-wscd-manager`.
2. **Page Communication**: The web wallet communicates with the extension via `window.WalletCompanion` (injected by the content script). Key operation requests are forwarded to the background script.
3. **Plugin Routing**: The WASM `WscdManager` routes operations identically to the native case. The softkey plugin uses extension storage; the R2PS plugin uses the browser `fetch` API; the FIDO2 plugin delegates to the browser's WebAuthn API.
4. **DC API Integration**: For presentation flows, wallet-companion intercepts `navigator.credentials.get()` calls via the Digital Credentials API and routes them through the appropriate WSCD plugin for Proof of Possession signing.

## Server-Side Split Architecture (R2PS)

The `go-r2ps-service` binary supports split deployment of WSCA and WSCD roles, controlled by the `R2PS_MODE` environment variable. This reduces the certification scope of each component.

```mermaid
graph TB
    subgraph "Clients"
        C1[Mobile App]
        C2[Browser Extension]
    end

    subgraph "Application Tier (no HSM required)"
        subgraph "WSCA Instances"
            W1[go-r2ps-service<br/>R2PS_MODE=wsca]
            W2[go-r2ps-service<br/>R2PS_MODE=wsca]
        end
    end

    subgraph "HSM Tier (certified boundary)"
        subgraph "WSCD Instances"
            D1[go-r2ps-service<br/>R2PS_MODE=wscd]
        end
        HSM4[PKCS#11 HSM<br/>QSCD]
    end

    DB2[(MongoDB<br/>Shared Store)]

    C1 -->|R2PS Protocol| W1
    C2 -->|R2PS Protocol| W2

    W1 -->|WKA · WIA<br/>Revoke · Suspend| DB2
    W2 -->|WKA · WIA<br/>Revoke · Suspend| DB2

    D1 -->|Keygen · ECDSA · ECDH<br/>OPAQUE 2FA| HSM4
    D1 -->|PutPublicKey<br/>OPAQUE Records| DB2
    W1 -.->|GetPublicKey| DB2
    W2 -.->|GetPublicKey| DB2

    style HSM4 fill:#e6f3ff,stroke:#4a90d9
    style D1 fill:#fce4ec,stroke:#c62828
```

### Role Separation

| Role     | Handlers                                                                               | HSM Required | Purpose                                   |
|----------|----------------------------------------------------------------------------------------|:------------:|-------------------------------------------|
| **WSCD** | `p256_generate`, `hsm_ecdsa`, `agree_ecdh`, `list_keys` + OPAQUE 2FA                  | Yes          | Cryptographic operations on private keys  |
| **WSCA** | `eudiw_wka_etsi`, `eudiw_wia_etsi`, `eudiw_wi_revoke`, `eudiw_wi_suspend` + status lists | No           | Attestation issuance and lifecycle management |

The key insight is that **public keys are exported to the shared MongoDB store at generation time**, allowing WSCA instances to resolve keys without HSM access. This means WSCA can be scaled, updated, and redeployed independently of the WSCD certification boundary.

## Plugin Resolution

The `WscdManager` resolves which plugin handles a given operation using a three-level fallback:

```mermaid
flowchart TD
    OP[Key Operation<br/>sign / generate / attest] --> KB{Per-key binding?<br/>config.key_bindings}
    KB -->|Found| P1[Use bound plugin]
    KB -->|Not found| OD{Per-operation default?<br/>config.operation_defaults}
    OD -->|Found| P2[Use operation plugin]
    OD -->|Not found| GD[Use global default<br/>config.default_plugin]

    style OP fill:#f5f5f5,stroke:#333
    style P1 fill:#c8e6c9,stroke:#2e7d32
    style P2 fill:#c8e6c9,stroke:#2e7d32
    style GD fill:#c8e6c9,stroke:#2e7d32
```

## Phased Migration Strategy

The architecture supports a phased migration from remote to local WSCDs as certification matures:

```mermaid
timeline
    title WSCD Migration Roadmap
    section Phase 1 — Now
        Remote WSCD (R2PS) : Primary plugin
        : Certified HSM in secure datacenter
        : OPAQUE/WebAuthn user auth
        Software keys : Development/testing fallback
    section Phase 2 — 12–24 months
        FIDO2 rawSign : Certified FIDO tokens
        : YubiKey previewSign
        : Local external WSCD
    section Phase 3 — 24–36 months
        Platform native : iOS Secure Enclave
        : Android StrongBox
        : Local internal WSCD
```

Key migration between plugins is supported via `WscdManager::migrate_key()`. When the target plugin cannot import keys (e.g., migrating from softkey to R2PS), the manager signals `ReEnrollmentRequired` — the credential must be re-issued with the new public key.

## Security Properties

- **Zeroize**: All private key material is zeroized on drop via the `zeroize` crate
- **No key export**: R2PS and FIDO2 plugins never expose private keys; softkey exports only the encrypted JWE container
- **Mutex isolation**: Each plugin's internal state is behind `std::sync::Mutex`
- **OPAQUE (RFC 9807)**: R2PS authentication uses password-authenticated key exchange — the server never sees the user's PIN
- **SCAL2 compliance**: The R2PS protocol implements sole-control semantics per ETSI TS 119 431-1
