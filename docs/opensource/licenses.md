---
title: License Inventory
sidebar_label: License Inventory
description: Open source licenses used across SIROS Foundation repositories
---

# License Inventory

All open source licenses found in dependencies across SIROS Foundation
repositories, generated automatically from [GitHub dependency graph](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph) SBOMs.

Licenses are classified against the [SIROS license policy](https://github.com/sirosfoundation/compliance/blob/main/catalog/technical/license-policy.yaml),
which defines allowed, restricted, and blocked license categories. NOASSERTION
entries from SBOM tooling are resolved using verified overrides.

:::info
This page is automatically updated daily. For programmatic access, use the
[JSON catalog](https://developers.siros.org/catalog/license-inventory.json):

```
https://developers.siros.org/catalog/license-inventory.json
```
:::

**18** repositories scanned · **1932** unique packages · **51** license types · **2** unresolved

## Policy Compliance

| Category | Packages | Description |
|----------|--------:|-------------|
| allowed | 1880 | |
| weak-copyleft | 40 | |
| test-only | 8 | |
| unclassified | 2 | |
| documentation | 1 | |
| build-only | 1 | |

License policy overrides applied: **594** · Dual-license selections: **146**

## License Summary

| License | Category | Unique Packages | Total Usages |
|---------|----------|---------------:|-------------:|
| MIT | allowed | 793 | 1404 |
| Apache-2.0 | allowed | 517 | 707 |
| BSD-3-Clause | allowed | 78 | 130 |
| BSD-2-Clause | allowed | 59 | 113 |
| ISC | allowed | 30 | 59 |
| MPL-2.0 | weak-copyleft | 19 | 43 |
| BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang | allowed | 10 | 41 |
| Unicode-3.0 | allowed | 18 | 18 |
| Apache-2.0 AND MIT | allowed | 6 | 13 |
| LGPL-3.0-or-later | weak-copyleft | 10 | 10 |
| LGPL-3.0 | weak-copyleft | 1 | 9 |
| EPL-2.0 | test-only | 7 | 7 |
| MIT-0 | allowed | 3 | 6 |
| Apache-2.0 AND BSD-3-Clause AND MIT | allowed | 1 | 5 |
| CC0-1.0 AND MIT | allowed | 5 | 5 |
| BlueOak-1.0.0 | allowed | 3 | 4 |
| 0BSD | allowed | 1 | 4 |
| CC0-1.0 | allowed | 2 | 3 |
| Apache-2.0 AND LGPL-3.0-or-later | weak-copyleft | 3 | 3 |
| BSD-2-Clause AND BSD-3-Clause | allowed | 1 | 2 |
| Python-2.0 | allowed | 1 | 2 |
| EUPL-1.2 | weak-copyleft | 1 | 2 |
| Apache-2.0 AND CC-BY-3.0 AND MIT | allowed | 1 | 2 |
| CDLA-Permissive-2.0 | allowed | 1 | 2 |
| NOASSERTION | unclassified | 2 | 2 |
| Apache-2.0 AND BSD-3-Clause | allowed | 2 | 2 |
| MIT AND Zlib | allowed | 1 | 2 |
| Apache-2.0 AND BSD-2-Clause AND CC0-1.0 AND ISC AND MIT | allowed | 1 | 1 |
| Apache-2.0 AND ISC | allowed | 1 | 1 |
| LicenseRef-scancode-jdom | allowed | 1 | 1 |
| EPL-1.0 | test-only | 1 | 1 |
| CDDL-1.1 | weak-copyleft | 1 | 1 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND Elastic-2.0 AND LicenseRef-scancode-public-domain AND MIT AND bzip2-1.0.6 | build-only | 1 | 1 |
| LGPL-2.1 | weak-copyleft | 1 | 1 |
| Apache-2.0 AND LGPL-2.1-only | weak-copyleft | 1 | 1 |
| MPL-1.1 | weak-copyleft | 1 | 1 |
| Apache-2.0 AND LicenseRef-scancode-public-domain AND bzip2-1.0.6 | allowed | 1 | 1 |
| CDDL-1.0 | weak-copyleft | 1 | 1 |
| Apache-2.0 AND LicenseRef-scancode-dco-1.1 AND MIT | allowed | 1 | 1 |
| Apache-2.0 AND CC-BY-SA-4.0 | documentation | 1 | 1 |
| BSD-2-Clause-Views | allowed | 1 | 1 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause | allowed | 1 | 1 |
| BSD-2-Clause AND CC0-1.0 AND ISC AND MIT | allowed | 1 | 1 |
| LicenseRef-scancode-generic-cla AND MIT | allowed | 1 | 1 |
| 0BSD AND ISC AND MIT | allowed | 1 | 1 |
| BSD-3-Clause AND ISC AND MIT | allowed | 1 | 1 |
| ISC AND MIT | allowed | 1 | 1 |
| Apache-2.0 AND LGPL-3.0-or-later AND MIT | weak-copyleft | 1 | 1 |
| LicenseRef-scancode-unicode AND MIT | allowed | 1 | 1 |
| Apache-2.0 AND OFL-1.1 AND Ubuntu-font-1.0 | allowed | 1 | 1 |
| BSD-2-Clause AND BSD-2-Clause-Views | allowed | 1 | 1 |

## Per-Repository Breakdown

| Repository | Dependencies | Licenses |
|------------|------------:|----------|
| [browser-log](https://github.com/sirosfoundation/browser-log) | 300 | MIT (236), MPL-2.0 (12), ISC (11), MIT OR Apache-2.0 (9), BSD-2-Clause (8), NOASSERTION (8), Apache-2.0 (4), BSD-3-Clause (4), MIT-0 (2), 0BSD (1), Apache-2.0 AND BSD-2-Clause AND CC0-1.0 AND ISC AND MIT (1), BSD-2-Clause AND BSD-3-Clause (1), BlueOak-1.0.0 (1), CC0-1.0 (1), Python-2.0 (1) |
| [facetec-api](https://github.com/sirosfoundation/facetec-api) | 59 | MIT (21), NOASSERTION (16), Apache-2.0 (12), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (6), BSD-3-Clause (2), Apache-2.0 AND MIT (1), BSD-2-Clause (1) |
| [g119612](https://github.com/sirosfoundation/g119612) | 38 | NOASSERTION (21), MIT (6), Apache-2.0 (4), BSD-2-Clause (4), BSD-3-Clause (1), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (1), ISC (1) |
| [go-cryptoutil](https://github.com/sirosfoundation/go-cryptoutil) | 17 | NOASSERTION (15), BSD-2-Clause (1), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (1) |
| [go-invite-op](https://github.com/sirosfoundation/go-invite-op) | 132 | MIT (68), Apache-2.0 (18), NOASSERTION (14), MPL-2.0 (12), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (8), BSD-3-Clause (6), ISC (3), Apache-2.0 AND BSD-3-Clause AND MIT (1), Apache-2.0 AND MIT (1), BSD-2-Clause (1) |
| [go-r2ps-service](https://github.com/sirosfoundation/go-r2ps-service) | 48 | NOASSERTION (18), Apache-2.0 (9), MIT (8), BSD-3-Clause (5), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (5), Apache-2.0 AND BSD-3-Clause AND MIT (1), Apache-2.0 AND MIT (1), BSD-2-Clause (1) |
| [go-spocp](https://github.com/sirosfoundation/go-spocp) | 19 | NOASSERTION (16), MIT (2), BSD-2-Clause (1) |
| [go-trust](https://github.com/sirosfoundation/go-trust) | 129 | NOASSERTION (49), MIT (38), Apache-2.0 (12), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (9), BSD-3-Clause (7), BSD-2-Clause (6), Apache-2.0 AND MIT (3), ISC (2), Apache-2.0 AND BSD-3-Clause AND MIT (1), Apache-2.0 AND CC-BY-3.0 AND MIT (1), MIT-0 (1) |
| [go-wallet-backend](https://github.com/sirosfoundation/go-wallet-backend) | 102 | NOASSERTION (43), MIT (25), Apache-2.0 (17), BSD-3-Clause (7), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (5), BSD-2-Clause (2), Apache-2.0 AND BSD-3-Clause AND MIT (1), Apache-2.0 AND MIT (1), ISC (1) |
| [goFF](https://github.com/sirosfoundation/goFF) | 32 | NOASSERTION (19), Apache-2.0 (4), BSD-2-Clause (2), BSD-3-Clause (2), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (2), MIT (2), ISC (1) |
| [goxmldsig](https://github.com/sirosfoundation/goxmldsig) | 17 | NOASSERTION (7), Apache-2.0 (3), BSD-2-Clause (2), BSD-3-Clause (2), MIT (2), ISC (1) |
| [r2ps-client](https://github.com/sirosfoundation/r2ps-client) | 161 | MIT OR Apache-2.0 (91), Apache-2.0 OR MIT (22), Unicode-3.0 (18), MIT (6), NOASSERTION (5), Apache-2.0 (3), BSD-2-Clause OR Apache-2.0 OR MIT (2), CDLA-Permissive-2.0 (2), ISC (2), Unlicense OR MIT (2), (MIT OR Apache-2.0) AND Unicode-3.0 (1), 0BSD OR MIT OR Apache-2.0 (1), Apache-2.0 AND ISC (1), Apache-2.0 OR ISC OR MIT (1), Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT (1), BSD-2-Clause (1), BSD-3-Clause (1), MIT OR Zlib OR Apache-2.0 (1) |
| [registry-cli](https://github.com/sirosfoundation/registry-cli) | 38 | NOASSERTION (16), BSD-3-Clause (9), Apache-2.0 (6), MIT (3), BSD-2-Clause (2), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (1), ISC (1) |
| [siros-sdk-kotlin](https://github.com/sirosfoundation/siros-sdk-kotlin) | 466 | NOASSERTION (249), Apache-2.0 (173), BSD-3-Clause (15), MIT (9), EPL-2.0 (6), BSD-2-Clause (2), Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND Elastic-2.0 AND LicenseRef-scancode-public-domain AND MIT AND bzip2-1.0.6 (1), Apache-2.0 AND BSD-3-Clause (1), Apache-2.0 AND LGPL-2.1-only (1), Apache-2.0 AND LicenseRef-scancode-public-domain AND bzip2-1.0.6 (1), Apache-2.0 AND MIT (1), Apache-2.0 OR LGPL-2.1-or-later (1), CDDL-1.0 OR GPL-2.0-only WITH Classpath-exception-2.0 (1), CDDL-1.1 OR GPL-2.0-only WITH Classpath-exception-2.0 (1), EPL-1.0 (1), LGPL-2.1 (1), LicenseRef-scancode-jdom (1), MPL-1.1 (1) |
| [siros-sdk-swift](https://github.com/sirosfoundation/siros-sdk-swift) | 10 | NOASSERTION (9), BSD-2-Clause (1) |
| [vc](https://github.com/sirosfoundation/vc) | 211 | NOASSERTION (71), MIT (57), Apache-2.0 (44), BSD-3-Clause (17), BSD-2-Clause (5), Apache-2.0 AND MIT (3), BSD-3-Clause AND LicenseRef-scancode-google-patent-license-golang (3), ISC (2), Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause (1), Apache-2.0 AND BSD-3-Clause (1), Apache-2.0 AND BSD-3-Clause AND MIT (1), Apache-2.0 AND CC-BY-3.0 AND MIT (1), Apache-2.0 AND CC-BY-SA-4.0 (1), Apache-2.0 AND LicenseRef-scancode-dco-1.1 AND MIT (1), BSD-2-Clause-Views (1), MIT-0 (1), MPL-2.0 (1) |
| [wallet-common](https://github.com/sirosfoundation/wallet-common) | 210 | MIT (165), Apache-2.0 (18), NOASSERTION (11), BSD-3-Clause (7), 0BSD (2), ISC (2), 0BSD AND ISC AND MIT (1), BSD-2-Clause AND CC0-1.0 AND ISC AND MIT (1), BSD-3-Clause AND ISC AND MIT (1), LicenseRef-scancode-generic-cla AND MIT (1), MIT AND Zlib (1) |
| [wallet-companion](https://github.com/sirosfoundation/wallet-companion) | 635 | MIT (440), Apache-2.0 (46), ISC (32), BSD-2-Clause (29), MPL-2.0 (18), BSD-3-Clause (13), LGPL-3.0-or-later (10), MIT OR Apache-2.0 (9), NOASSERTION (9), CC0-1.0 AND MIT (5), Apache-2.0 AND LGPL-3.0-or-later (3), BlueOak-1.0.0 (3), Apache-2.0 AND MIT (2), CC0-1.0 (2), MIT-0 (2), 0BSD (1), Apache-2.0 AND LGPL-3.0-or-later AND MIT (1), Apache-2.0 AND OFL-1.1 AND Ubuntu-font-1.0 (1), Apache-2.0 OR BSD-2-Clause OR MIT OR (Apache-2.0 AND BSD-2-Clause) OR (Apache-2.0 AND MIT) OR (BSD-2-Clause AND MIT) (1), BSD-2-Clause AND BSD-2-Clause-Views (1), BSD-2-Clause AND BSD-3-Clause (1), BSD-3-Clause OR GPL-2.0-only (1), GPL-3.0-only OR MIT (1), ISC AND MIT (1), LicenseRef-scancode-unicode AND MIT (1), MIT AND Zlib (1), Python-2.0 (1) |

_Last updated: 2026-06-15T20:02:37Z_

_License policy: [sirosfoundation/compliance](https://github.com/sirosfoundation/compliance/blob/main/catalog/technical/license-policy.yaml)_
