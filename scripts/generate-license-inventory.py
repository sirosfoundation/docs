#!/usr/bin/env python3
"""Generate license inventory from GitHub SBOM data.

Fetches SPDX SBOMs for all public repos in the organization, applies
license policy (overrides, dual-license selections, classification),
and generates both a JSON catalog and a Markdown page.

Usage:
    python scripts/generate-license-inventory.py [--org ORG] [--policy-dir DIR] [--output-json PATH] [--output-md PATH]

Environment:
    GH_TOKEN: GitHub token for API access (required)
"""

import argparse
import fnmatch
import json
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


# --- Policy loading and validation ---


def load_policy(policy_dir: Path) -> tuple[list, dict, dict]:
    """Load and validate policy files from directory."""
    overrides_path = policy_dir / "overrides.json"
    classification_path = policy_dir / "classification.json"
    dual_license_path = policy_dir / "dual-license-map.json"

    for path in (overrides_path, classification_path, dual_license_path):
        if not path.exists():
            sys.exit(f"Error: policy file not found: {path}")

    overrides = json.loads(overrides_path.read_text())
    classification = json.loads(classification_path.read_text())
    dual_license_map = json.loads(dual_license_path.read_text())

    # Validate overrides schema
    required_fields = {"pattern", "license", "scope", "reason"}
    for i, entry in enumerate(overrides):
        missing = required_fields - set(entry.keys())
        if missing:
            sys.exit(f"Error: override #{i} missing fields: {missing}")
        if entry["scope"] not in ("production", "ci-only", "build", "test"):
            sys.exit(f"Error: override #{i} has invalid scope: {entry['scope']!r}")

    return overrides, classification, dual_license_map


# --- License classification ---

SCOPE_CATEGORIES = {"ci-only": "ci-only", "build": "build-only", "test": "test-only"}


def classify_license(lic: str, classification: dict, dual_license_map: dict) -> str:
    """Classify a license string against the policy."""
    if lic in classification:
        return classification[lic]

    # Strip outer parentheses
    stripped = lic.strip()
    if stripped.startswith("(") and stripped.endswith(")"):
        stripped = stripped[1:-1].strip()
        if stripped in classification:
            return classification[stripped]

    # Check dual-license map (OR expression → resolved)
    if lic in dual_license_map:
        resolved = dual_license_map[lic]
        if resolved in classification:
            return classification[resolved]

    # Compound license (AND) — classify by strictest component
    if " AND " in lic:
        parts = _split_license_expr(lic, " AND ")
        cats = [classification[p] for p in parts if p in classification]
        for cat in ("blocked", "build-only", "test-only", "weak-copyleft", "documentation", "allowed"):
            if cat in cats:
                return cat

    # OR expressions not in dual-license map — classify by most permissive
    if " OR " in lic:
        parts = _split_license_expr(lic, " OR ")
        cats = [classification[p] for p in parts if p in classification]
        for cat in ("allowed", "documentation", "weak-copyleft", "test-only", "build-only", "blocked"):
            if cat in cats:
                return cat

    return "unclassified"


def _split_license_expr(expr: str, sep: str) -> list[str]:
    """Split a license expression on a separator, handling one level of parens."""
    # Remove outer parens if present
    s = expr.strip()
    if s.startswith("(") and s.endswith(")"):
        s = s[1:-1]
    parts = []
    for part in s.split(sep):
        cleaned = part.strip().strip("()")
        if cleaned:
            parts.append(cleaned)
    return parts


# --- Override matching ---


def find_override(name: str, overrides: list) -> dict | None:
    """Find the first matching override for a package name."""
    for o in overrides:
        if fnmatch.fnmatch(name, o["pattern"]):
            return o
    return None


# --- Package enrichment ---


def enrich_package(pkg: dict, overrides: list, classification: dict, dual_license_map: dict) -> dict:
    """Apply policy enrichment to a single package. Mutates and returns pkg."""
    orig_license = pkg["license"]
    override = find_override(pkg["name"], overrides)

    if override:
        scope = override["scope"]
        pkg["override_scope"] = scope
        pkg["override_reason"] = override["reason"]

        if orig_license == "NOASSERTION":
            pkg["license_resolved"] = override["license"]
            pkg["license_source"] = "policy-override"
        elif orig_license in dual_license_map:
            pkg["license_resolved"] = dual_license_map[orig_license]
            pkg["license_source"] = "dual-license-selection"
        else:
            pkg["license_resolved"] = orig_license
            pkg["license_source"] = "sbom"

        # Non-production scope sets category directly
        if scope in SCOPE_CATEGORIES:
            pkg["policy_category"] = SCOPE_CATEGORIES[scope]
        else:
            pkg["policy_category"] = classify_license(
                pkg["license_resolved"], classification, dual_license_map
            )
    elif orig_license in dual_license_map:
        pkg["license_resolved"] = dual_license_map[orig_license]
        pkg["license_source"] = "dual-license-selection"
        pkg["policy_category"] = classify_license(
            pkg["license_resolved"], classification, dual_license_map
        )
    else:
        pkg["license_resolved"] = orig_license
        pkg["license_source"] = "sbom"
        pkg["policy_category"] = classify_license(
            orig_license, classification, dual_license_map
        )

    return pkg


# --- SBOM fetching ---


def fetch_repos(org: str) -> list[str]:
    """Get all non-archived public repos in the org."""
    result = subprocess.run(
        ["gh", "api", "--paginate", f"/orgs/{org}/repos?per_page=100&type=public",
         "--jq", '.[] | select(.archived == false) | .name'],
        capture_output=True, text=True, check=True,
    )
    repos = sorted(line for line in result.stdout.strip().split("\n") if line)
    print(f"Found {len(repos)} repos")
    return repos


def fetch_sbom(org: str, repo: str) -> dict | None:
    """Fetch SBOM for a single repo. Returns None if unavailable."""
    result = subprocess.run(
        ["gh", "api", f"repos/{org}/{repo}/dependency-graph/sbom"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return None
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return None
    # Check for error responses
    if "message" in data and "sbom" not in data:
        return None
    if "sbom" not in data or "packages" not in data.get("sbom", {}):
        return None
    return data


def extract_packages(sbom: dict, repo: str) -> list[dict]:
    """Extract packages from an SPDX SBOM response."""
    packages = []
    for pkg in sbom["sbom"]["packages"]:
        if not pkg.get("name") or pkg.get("SPDXID") == "SPDXRef-DOCUMENT":
            continue
        packages.append({
            "name": pkg["name"],
            "version": pkg.get("versionInfo"),
            "license": pkg.get("licenseConcluded") or pkg.get("licenseDeclared") or "NOASSERTION",
            "repo": repo,
        })
    return packages


# --- Aggregation ---


def deduplicate_packages(all_packages: list[dict]) -> list[dict]:
    """Deduplicate packages across repos, merging repo lists."""
    groups = defaultdict(list)
    for pkg in all_packages:
        key = f"{pkg['name']}@{pkg.get('version') or ''}"
        groups[key].append(pkg)

    unique = []
    for group in groups.values():
        merged = {
            "name": group[0]["name"],
            "version": group[0]["version"],
            "license": group[0]["license"],
            "repos": sorted({p["repo"] for p in group}),
        }
        unique.append(merged)
    return sorted(unique, key=lambda p: p["name"])


def build_repo_summary(all_packages: list[dict]) -> list[dict]:
    """Build per-repo license breakdown from enriched packages."""
    repo_pkgs = defaultdict(list)
    for p in all_packages:
        repo_pkgs[p["repo"]].append(p)

    summary = []
    for repo in sorted(repo_pkgs.keys()):
        pkgs = repo_pkgs[repo]
        lic_counts: dict[str, int] = {}
        for p in pkgs:
            rl = p.get("license_resolved", p["license"])
            lic_counts[rl] = lic_counts.get(rl, 0) + 1
        licenses = sorted(lic_counts.items(), key=lambda x: -x[1])
        summary.append({
            "repo": repo,
            "package_count": len(pkgs),
            "licenses": [{"license": l, "count": c} for l, c in licenses],
        })
    return summary


def build_license_summary(all_packages: list[dict]) -> list[dict]:
    """Build license summary from enriched packages."""
    lic_data: dict[str, dict] = {}
    for p in all_packages:
        rl = p.get("license_resolved", p["license"])
        if rl not in lic_data:
            lic_data[rl] = {"usages": 0, "packages": set(), "repos": set(), "categories": Counter()}
        lic_data[rl]["usages"] += 1
        lic_data[rl]["packages"].add(p["name"])
        lic_data[rl]["repos"].add(p["repo"])
        lic_data[rl]["categories"][p.get("policy_category", "unclassified")] += 1

    summary = []
    for lic, data in sorted(lic_data.items(), key=lambda x: -x[1]["usages"]):
        # Use the most common category for this license (accounts for scope overrides)
        most_common_cat = data["categories"].most_common(1)[0][0]
        summary.append({
            "license": lic,
            "total_usages": data["usages"],
            "unique_packages": len(data["packages"]),
            "repos": sorted(data["repos"]),
            "policy_category": most_common_cat,
        })
    return summary


def build_audit_drilldown(unique_packages: list[dict]) -> dict[str, list]:
    """Build audit drilldown grouped by non-allowed category."""
    audit: dict[str, list] = defaultdict(list)
    for p in unique_packages:
        cat = p.get("policy_category", "unclassified")
        if cat == "allowed":
            continue
        audit[cat].append({
            "name": p["name"],
            "version": p.get("version") or "",
            "license": p.get("license_resolved", p["license"]),
            "license_source": p.get("license_source", "sbom"),
            "repos": p.get("repos", []),
            "override_scope": p.get("override_scope", ""),
            "override_reason": p.get("override_reason", ""),
        })
    return dict(audit)


# --- Output generation ---


def generate_json_catalog(
    timestamp: str, org: str, unique_packages: list, license_summary: list,
    repo_summary: list, policy_summary: dict,
) -> dict:
    """Build the JSON catalog structure."""
    return {
        "generated": timestamp,
        "organization": org,
        "policy": policy_summary,
        "license_summary": license_summary,
        "repositories": repo_summary,
        "packages": unique_packages,
    }


def generate_markdown(
    timestamp: str, org: str, unique_packages: list, license_summary: list,
    repo_summary: list, policy_summary: dict, audit_drilldown: dict,
) -> str:
    """Generate the Markdown page content."""
    lines = []

    # Frontmatter
    lines.extend([
        "---",
        "title: License Inventory",
        "sidebar_label: License Inventory",
        "description: Open source licenses used across SIROS Foundation repositories",
        "---",
        "",
        "# License Inventory",
        "",
        "All open source licenses found in dependencies across SIROS Foundation",
        "repositories, generated automatically from [GitHub dependency graph]"
        "(https://docs.github.com/en/code-security/supply-chain-security/"
        "understanding-your-software-supply-chain/about-the-dependency-graph) SBOMs.",
        "",
        "Licenses are classified against the [SIROS license policy]"
        "(https://github.com/sirosfoundation/compliance/blob/main/catalog/technical/license-policy.yaml),",
        "which defines allowed, restricted, and blocked license categories. NOASSERTION",
        "entries from SBOM tooling are resolved using verified overrides.",
        "",
        ":::info",
        "This page is automatically updated daily. For programmatic access, use the",
        "[JSON catalog](https://developers.siros.org/catalog/license-inventory.json):",
        "",
        "```",
        "https://developers.siros.org/catalog/license-inventory.json",
        "```",
        ":::",
        "",
    ])

    # Summary stats
    total_repos = len(repo_summary)
    total_packages = len(unique_packages)
    total_licenses = len(license_summary)
    noassertion_remaining = policy_summary["noassertion_remaining"]
    lines.append(
        f"**{total_repos}** repositories scanned · **{total_packages}** unique packages · "
        f"**{total_licenses}** license types · **{noassertion_remaining}** unresolved"
    )
    lines.append("")

    # Policy compliance
    lines.extend(["## Policy Compliance", "", "| Category | Packages | Description |", "|----------|--------:|-------------|"])
    for cat, count in sorted(policy_summary["categories"].items(), key=lambda x: -x[1]):
        lines.append(f"| {cat} | {count} | |")
    lines.append("")
    lines.append(
        f"License policy overrides applied: **{policy_summary['overrides_applied']}** · "
        f"Dual-license selections: **{policy_summary['dual_license_selections']}**"
    )
    lines.append("")

    # License summary
    lines.extend([
        "## License Summary", "",
        "| License | Category | Unique Packages | Total Usages |",
        "|---------|----------|---------------:|-------------:|",
    ])
    for entry in license_summary:
        lines.append(
            f"| {entry['license']} | {entry['policy_category']} | "
            f"{entry['unique_packages']} | {entry['total_usages']} |"
        )
    lines.append("")

    # Per-repo breakdown
    lines.extend([
        "## Per-Repository Breakdown", "",
        "| Repository | Dependencies | Licenses |",
        "|------------|------------:|----------|",
    ])
    for repo in repo_summary:
        lic_str = ", ".join(f"{l['license']} ({l['count']})" for l in repo["licenses"])
        lines.append(
            f"| [{repo['repo']}](https://github.com/{org}/{repo['repo']}) | "
            f"{repo['package_count']} | {lic_str} |"
        )
    lines.append("")

    # Audit drilldown
    lines.extend([
        "## Packages Requiring Review", "",
        "The following packages do not fall into the **allowed** category and may require",
        "additional review. Each entry shows which repositories pull in the dependency,",
        "enabling audit of the dependency graph.",
        "",
    ])

    category_order = ["weak-copyleft", "unclassified", "build-only", "test-only", "ci-only", "documentation"]
    for category in category_order:
        pkgs = audit_drilldown.get(category, [])
        if not pkgs:
            continue
        lines.append(f"### {category} ({len(pkgs)} packages)")
        lines.append("")
        lines.append("| Package | Version | License | Source | Repositories | Reason |")
        lines.append("|---------|---------|---------|--------|--------------|--------|")
        for pkg in sorted(pkgs, key=lambda p: p["name"]):
            repos_str = ", ".join(
                f"[{r}](https://github.com/{org}/{r}/network/dependencies)" for r in pkg["repos"]
            )
            lines.append(
                f"| {pkg['name']} | {pkg['version']} | {pkg['license']} | "
                f"{pkg['license_source']} | {repos_str} | {pkg['override_reason']} |"
            )
        lines.append("")

    # Footer
    lines.extend([
        "",
        f"_Last updated: {timestamp}_",
        "",
        f"_License policy: [sirosfoundation/compliance]"
        f"(https://github.com/sirosfoundation/compliance/blob/main/catalog/technical/license-policy.yaml)_",
    ])

    return "\n".join(lines) + "\n"


# --- Main ---


def main():
    parser = argparse.ArgumentParser(description="Generate license inventory from GitHub SBOMs")
    parser.add_argument("--org", default="sirosfoundation", help="GitHub organization")
    parser.add_argument("--policy-dir", default="scripts/license-policy", help="Path to policy JSON files")
    parser.add_argument("--output-json", default="static/catalog/license-inventory.json", help="JSON output path")
    parser.add_argument("--output-md", default="docs/opensource/licenses.md", help="Markdown output path")
    args = parser.parse_args()

    policy_dir = Path(args.policy_dir)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Load policy
    print("Loading license policy...")
    overrides, classification, dual_license_map = load_policy(policy_dir)
    print(f"  {len(overrides)} overrides, {len(classification)} classifications, {len(dual_license_map)} dual-license entries")

    # Fetch SBOMs
    print("Fetching SBOMs...")
    repos = fetch_repos(args.org)
    all_packages = []
    skipped = []

    for repo in repos:
        print(f"  {repo}... ", end="", flush=True)
        sbom = fetch_sbom(args.org, repo)
        if sbom is None:
            print("skip")
            skipped.append(repo)
            continue
        pkgs = extract_packages(sbom, repo)
        print(f"{len(pkgs)} pkgs")
        all_packages.extend(pkgs)

    print(f"\nTotal: {len(all_packages)} package entries from {len(repos) - len(skipped)} repos")

    # Enrich all packages
    print("Applying license policy...")
    override_count = 0
    dual_count = 0
    for pkg in all_packages:
        orig = pkg["license"]
        enrich_package(pkg, overrides, classification, dual_license_map)
        if pkg.get("license_source") == "policy-override":
            override_count += 1
        elif pkg.get("license_source") == "dual-license-selection":
            dual_count += 1

    # Deduplicate and enrich unique packages
    unique_packages = deduplicate_packages(all_packages)
    for pkg in unique_packages:
        enrich_package(pkg, overrides, classification, dual_license_map)

    # Build summaries
    repo_summary = build_repo_summary(all_packages)
    license_summary = build_license_summary(all_packages)
    audit_drilldown = build_audit_drilldown(unique_packages)

    cat_counts = Counter(p["policy_category"] for p in unique_packages)
    noassertion_remaining = sum(1 for p in unique_packages if p.get("license_resolved") == "NOASSERTION")

    policy_summary = {
        "overrides_applied": override_count,
        "dual_license_selections": dual_count,
        "noassertion_remaining": noassertion_remaining,
        "categories": dict(cat_counts),
    }

    print(f"  Overrides: {override_count}, Dual-license: {dual_count}")
    print(f"  Categories: {dict(cat_counts)}")
    print(f"  NOASSERTION remaining: {noassertion_remaining}")

    # Generate outputs
    print("Generating outputs...")
    catalog = generate_json_catalog(
        timestamp, args.org, unique_packages, license_summary, repo_summary, policy_summary
    )
    json_path = Path(args.output_json)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(catalog, indent=None, separators=(",", ":")) + "\n")
    print(f"  JSON: {json_path} ({json_path.stat().st_size} bytes)")

    md_content = generate_markdown(
        timestamp, args.org, unique_packages, license_summary,
        repo_summary, policy_summary, audit_drilldown,
    )
    md_path = Path(args.output_md)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(md_content)
    print(f"  Markdown: {md_path} ({len(md_content.splitlines())} lines)")


if __name__ == "__main__":
    main()
