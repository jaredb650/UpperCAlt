# Upper Capital

A single-page website for Upper Capital, a seed and growth venture fund in San Juan, Puerto Rico.

## Local preview

Run `python3 -m http.server 8000 --bind 127.0.0.1`, then visit http://127.0.0.1:8000/.

No build step or framework. JetBrains Mono from Google Fonts is the only external runtime asset; local monospace fallbacks remain available.

## Files

- `index.html`: page content, native focus-area disclosures, and portfolio roster layout
- `styles.css`: design tokens, components, responsive layouts, and reduced-motion styles
- `script.js`: layered Matrix code rain, scroll effects, counters, motion preferences, clock, and roster filtering/sorting
- `data/portfolio.js`: generated portfolio roster data (all companies marked `Include? = TRUE` in the client sheet)
- `data/editorial.json`: curated spotlight stories, outcome sublines, and verified Crunchbase links
- `scripts/sync-portfolio.py`: one-command Google Sheet CSV sync that regenerates `data/portfolio.js`
- `favicon.svg`: local icon
- `assets/`: Amy and Stephen’s generated pixel portraits and exact image-model prompts
- `content/source.md`: canonical content reference
- `docs/design-audit.md`: critique, revision rationale, research sources, validation, and remaining content gaps

## Syncing the portfolio roster

After updating `Include?` checkboxes in the client Google Sheet, run:

```bash
python3 scripts/sync-portfolio.py
```

This pulls the live CSV export, keeps every row with `Include? = TRUE`, merges curated stories/Crunchbase links from `data/editorial.json`, and rewrites `data/portfolio.js`.

## Design and motion

The near-black, fuchsia, and monospace identity is preserved. Open editorial layouts replace repeated card grids. The background uses a 2D canvas for purple falling code streams at three depths. Heavy terminal typography, hard edges, subtle scanlines, and generated pixel portraits carry the CRT aesthetic. Native scrolling drives parallax, reading progress, and manifesto lighting; content remains available without JavaScript.

The motion control remembers the visitor’s choice in session storage when available. OS reduced motion starts animation disabled. Canvas resolution and mobile particle count are bounded; drawing is limited to roughly 30fps, and animation pauses in hidden tabs.

## Content and publication

Edit copy in `index.html`. The audit records missing portfolio assets and unverified details removed in this revision. This alternate CRT version is published from the `main` branch of `jaredb650/UpperCAlt` using GitHub Pages. The original `jaredb650/UpperCapital` deployment remains separate.


## Client comparison

- Original: https://jaredb650.github.io/UpperCapital/
- CRT revision: https://jaredb650.github.io/UpperCAlt/

GitHub Pages serves this repository root from `main`. `.nojekyll` keeps it a plain static site. All asset URLs are relative so the project-path deployment works.
