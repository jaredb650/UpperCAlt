#!/usr/bin/env python3
"""
Sync Upper Capital's portfolio roster from the Google Sheet CSV export.

Usage:
  python3 scripts/sync-portfolio.py
  python3 scripts/sync-portfolio.py --csv path/to/export.csv
  python3 scripts/sync-portfolio.py --url "https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."

Reads all rows where `Include?` is TRUE, merges curated spotlight narratives
and verified Crunchbase links from `data/editorial.json`, and writes
`data/portfolio.js` (zero-build static bundle for GitHub Pages).
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

DEFAULT_SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1cQ7JX0C2kUzUiKikQm7Po7jZ4szTfbwT-l7rbAodwTk/"
    "export?format=csv&gid=1880967796"
)

ROOT = Path(__file__).resolve().parent.parent
EDITORIAL_PATH = ROOT / "data" / "editorial.json"
OUTPUT_PATH = ROOT / "data" / "portfolio.js"


def classify_outcome(status: str, today: str) -> tuple[str, str]:
    """Return (outcomeType, defaultSubline) derived strictly from sheet fields."""
    today_clean = today.strip()
    lower = today_clean.lower()

    if "public:" in lower or "nasdaq" in lower or "nyse" in lower:
        return "public", today_clean

    if "acquired by" in lower:
        return "acquired", today_clean

    if "agreed to acquire" in lower:
        return "active", today_clean

    if status.strip().lower() == "realized":
        return "realized", today_clean if today_clean not in ("", "Site live", "Operating") else "Realized"

    if lower.startswith("renamed from"):
        return "active", today_clean

    return "active", ""


def is_early_stage(first_round: str) -> bool:
    return first_round.strip().lower() in {"pre-seed", "seed", "series a"}


def fetch_csv_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "UpperCapitalRosterSync/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8-sig")


def load_rows(csv_text: str) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(csv_text)))


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Upper Capital portfolio from Google Sheets CSV.")
    parser.add_argument("--csv", type=Path, help="Local CSV file path instead of fetching the live Google Sheet.")
    parser.add_argument("--url", default=DEFAULT_SHEET_URL, help="Google Sheet CSV export URL.")
    args = parser.parse_args()

    if args.csv:
        csv_text = args.csv.read_text(encoding="utf-8-sig")
        if "---\n\n" in csv_text and csv_text.startswith("Source:"):
            csv_text = csv_text.split("---\n\n", 1)[1]
    else:
        csv_text = fetch_csv_text(args.url)

    editorial: dict[str, dict] = {}
    if EDITORIAL_PATH.exists():
        editorial = json.loads(EDITORIAL_PATH.read_text(encoding="utf-8"))

    rows = load_rows(csv_text)
    companies = []
    warnings = []

    for row in rows:
        if (row.get("Include?") or "").strip().upper() != "TRUE":
            continue

        name = (row.get("Company") or "").strip()
        if not name:
            continue

        segment = (row.get("Segment") or "").strip() or "Other"
        industry = (row.get("Industry") or "").strip()
        status = (row.get("Status") or "").strip() or "Active"
        vintage_raw = (row.get("Vintage") or "").strip()
        year = int(vintage_raw) if vintage_raw.isdigit() else None
        first_round = (row.get("First Round") or "").strip()
        tier = (row.get("Site Tier") or "").strip()
        today = (row.get("Company Today") or "").strip()
        site = (row.get("Website") or "").strip()
        crunchbase_col = (row.get("Crunchbase") or "").strip()
        link_check = (row.get("Link Check") or "").strip()
        notes = (row.get("Notes") or "").strip()

        if tier.lower() == "review" or link_check.lower() == "confirm":
            warnings.append(f"  - {name}: tier={tier!r}, link_check={link_check!r}, notes={notes!r}")

        outcome_type, default_subline = classify_outcome(status, today)
        ed = editorial.get(name, {})

        entry: dict[str, object] = {
            "name": name,
            "segment": segment,
            "industry": industry,
            "stage": first_round,
            "year": year,
            "status": status,
            "outcomeType": outcome_type,
            "featured": tier.lower() == "feature" or bool(ed.get("spotlight")),
            "early": is_early_stage(first_round),
        }

        subline = ed.get("subline") or default_subline
        if subline:
            entry["subline"] = subline
        if site:
            entry["site"] = site
        crunchbase = crunchbase_col or ed.get("crunchbase", "")
        if crunchbase:
            entry["crunchbase"] = crunchbase

        if ed.get("spotlight"):
            entry["spotlight"] = {
                "order": ed.get("spotlightOrder", 99),
                "tag": ed.get("tag", "FEATURED"),
                "outcome": ed.get("outcome", subline.upper()),
                "story": ed.get("story", ""),
            }

        companies.append(entry)

    # Stable alphabetical order in source bundle; UI applies default featured-first or user sort.
    companies.sort(key=lambda c: str(c["name"]).lower())

    payload = {
        "source": "Google Sheets — Upper Capital Portfolio Roster",
        "count": len(companies),
        "companies": companies,
    }

    js_output = (
        "// Auto-generated by scripts/sync-portfolio.py — do not hand-edit.\n"
        "// Edit checkboxes in the Google Sheet or narratives in data/editorial.json, then re-run sync.\n"
        f"window.UPPER_PORTFOLIO = {json.dumps(payload, indent=2, ensure_ascii=False)};\n"
    )
    OUTPUT_PATH.write_text(js_output, encoding="utf-8")

    print(f"Wrote {len(companies)} included companies to {OUTPUT_PATH.relative_to(ROOT)}")
    if warnings:
        print("\nItems flagged Review / Confirm in the sheet (still included because Include? = TRUE):")
        print("\n".join(warnings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
