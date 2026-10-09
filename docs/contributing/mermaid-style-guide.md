# Mermaid Diagram Style Guide

This guide defines the standard styling conventions for mermaid diagrams in the SIROS documentation. Following these conventions ensures visual consistency across all documentation.

## Color Palette

All diagrams use the **SIROS Brand Blue** (`#1C4587`) as the foundation, with complementary colors for contrast and readability.

### Primary Colors (SIROS Blue Family)

| Usage | Color | Hex |
|-------|-------|-----|
| Light background | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#E8EEF7', border: '1px solid #888'}} /> | `#E8EEF7` |
| Medium background | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#D4E2F4', border: '1px solid #888'}} /> | `#D4E2F4` |
| **Brand primary** | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#1C4587', border: '1px solid #888'}} /> | `#1C4587` |
| Dark accent | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#14366B', border: '1px solid #888'}} /> | `#14366B` |

### Complement Colors (Orange - for Notes & Highlights)

| Usage | Color | Hex |
|-------|-------|-----|
| Note background | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#FFF3E0', border: '1px solid #888'}} /> | `#FFF3E0` |
| Note border | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#C75A11', border: '1px solid #888'}} /> | `#C75A11` |
| Note text | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#7C3A00', border: '1px solid #888'}} /> | `#7C3A00` |

### Secondary Colors (Teal - for Variety)

| Usage | Color | Hex |
|-------|-------|-----|
| Success/Secondary bg | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#E6F4F1', border: '1px solid #888'}} /> | `#E6F4F1` |
| Success border | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#198754', border: '1px solid #888'}} /> | `#198754` |
| Success text | <span style={{display: 'inline-block', width: '15px', height: '15px', background: '#0F5132', border: '1px solid #888'}} /> | `#0F5132` |

## Global Theme Configuration

The theme is configured globally in `docusaurus.config.ts`. Individual diagrams **do not need** frontmatter configuration—the theme applies automatically.

## Flowchart Diagrams

### Basic Structure

```mermaid
flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

### With Subgraphs (Grouping)

Use subgraphs to visually group related components:

```mermaid
flowchart TB
    subgraph org["Your Organization"]
        A[Identity Provider]
        B[Data Sources]
    end
    
    subgraph issuer["Credential Issuer"]
        C[Auth Layer]
        D[Constructor]
        E[Signer]
    end
    
    A --> C
    B --> D
    C --> D --> E
```

### Node Shape Guidelines

| Shape | Syntax | Usage |
|-------|--------|-------|
| Rectangle | `[Text]` | Standard process/action |
| Rounded | `(Text)` | Start/End points |
| Diamond | `{Text}` | Decision points |
| Hexagon | `{{Text}}` | Preparation steps |
| Parallelogram | `[/Text/]` | Input/Output |
| Circle | `((Text))` | Connectors |
| Stadium | `([Text])` | Terminal states |

## Sequence Diagrams

### Basic Structure

```mermaid
sequenceDiagram
    participant W as Wallet
    participant I as Issuer
    participant V as Verifier
    
    W->>I: Request Credential
    activate I
    I-->>W: Issue Credential
    deactivate I
    
    W->>V: Present Credential
    activate V
    Note right of V: Validates signature
    V-->>W: Verification Result
    deactivate V
```

### Arrow Types

| Arrow | Syntax | Meaning |
|-------|--------|---------|
| Solid line, solid head | `->>` | Synchronous request |
| Solid line, open head | `->` | Synchronous message |
| Dotted line, solid head | `-->>` | Response |
| Dotted line, open head | `-->` | Async response |

### Notes

Use notes sparingly for important clarifications:

```mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    
    A->>B: Hello
    Note over A,B: This note spans both participants
    Note right of B: Processing note
    B-->>A: Hi there!
```

## Class Diagrams

```mermaid
classDiagram
    class Credential {
        +String id
        +String type
        +Date issuanceDate
        +verify() bool
    }
    
    class Issuer {
        +String did
        +issue(claims) Credential
    }
    
    Issuer --> Credential : issues
```

## State Diagrams

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Active : Approved
    Pending --> Rejected : Denied
    Active --> Revoked : Revoke
    Active --> Expired : Timeout
    Revoked --> [*]
    Expired --> [*]
    Rejected --> [*]
```

## Best Practices

### DO ✅

- **Use meaningful participant aliases** in sequence diagrams (`participant W as Wallet` not just `participant Wallet`)
- **Group related items** using subgraphs in flowcharts
- **Use activation boxes** to show when a participant is processing
- **Keep diagrams focused** on one concept per diagram
- **Use consistent terminology** across diagrams

### DON'T ❌

- Don't add custom colors via `style` directives (use the global theme)
- Don't make diagrams too complex (split into multiple if needed)
- Don't use notes for every message (only for important clarifications)
- Don't mix different arrow types inconsistently

### Sizing Guidelines

- **Max 7±2 participants** in sequence diagrams
- **Max 10-12 nodes** in flowcharts before splitting
- **Keep text concise** in nodes (use abbreviations if needed)

## Accessibility

- The theme is designed with WCAG 2.1 AA contrast ratios
- Blue/orange complement provides good color-blind accessibility
- All diagrams have hover states for interactive feedback
- Dark mode is automatically supported

## Example: Complete Credential Issuance Flow

```mermaid
flowchart TB
    subgraph org["Organization"]
        IDP[Identity Provider]
        SRC[(Data Sources)]
    end
    
    subgraph issuer["Credential Issuer"]
        AUTH[Authentication]
        CON[Constructor]
        SIGN[Signer]
        HSM[HSM/PKCS#11]
    end
    
    subgraph wallet["User"]
        W[Wallet App]
    end
    
    IDP -->|Authenticates| AUTH
    SRC -->|Claims| CON
    AUTH --> CON
    CON --> SIGN
    SIGN -.->|Uses| HSM
    SIGN ==>|Issues VC| W
```

## Troubleshooting

### Diagram not rendering?

1. Check for syntax errors (use [Mermaid Live Editor](https://mermaid.live))
2. Ensure proper closing of subgraphs
3. Avoid special characters in labels (use quotes if needed: `["Label with (parens)"]`)

### Colors look different?

The global theme handles colors automatically. Avoid using `style` directives.
