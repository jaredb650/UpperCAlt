# Upper Capital — design audit and second revision

Reviewed September 13, 2026. Scope: the local single-page website, its HTML/CSS/JavaScript, the repository’s source-copy reference, and desktop/mobile browser behavior. This is an expert design review, not a user study or an accessibility certification.

## Overall critique

The first revision had a recognizable identity: near-black, fuchsia, monospace, and a procedural code background. Its weakness was composition. Repeated ruled cards, equally weighted statistics, tiny technical labels, and similar section spacing made it feel like a dashboard with marketing copy. The background added activity but did not fix the hierarchy. The small ASCII people placeholders and unsupported statistics also reduced credibility.

The second revision treats the page as a sequence: an opening statement, an operator’s perspective, tangible evidence, areas of interest, people, and a conversation. The shapes, density, scale, and motion now change with the purpose of each section.

## Findings and changes

| Priority | Finding | Implemented revision |
| --- | --- | --- |
| High | Repeated rectangular containers gave unrelated content equal weight. | Removed the boxed statistic and team grids. Used an open evidence composition, linear profiles, and one rounded section transition. |
| High | Statistics competed with each other instead of establishing a memorable proof point. | Made 150+ the dominant number, with founding year and investment stages as quieter supporting information. |
| High | Several labels were 7–10px, and body copy shrank substantially on mobile. | Established 12px secondary labels and 16px main paragraphs, with responsive display type and larger actions. |
| High | The 70% sourcing claim, market-cycle claim, biographies, and Amy’s title were unsupported by the repository’s canonical content. | Removed those assertions. Retained the sourced founding year, 150+ investments, fund stages, names, and contact destinations. |
| High | Repeating particle noise competed with reading and lacked a distinct shape. | Rebuilt the torus with continuous filaments and a thinner code surface. It fades away through the content sections and returns around contact. |
| Medium | The manifesto looked like a terminal widget rather than a meaningful investment perspective. | Used a large operator-focused headline, asymmetric copy placement, and scroll-lit words. |
| Medium | Focus areas were a dense table with decorative signal ratings that did not explain fit. | Replaced it with native keyboard-operable disclosures, large category names, short descriptions, and clear open/closed controls. Removed the unexplained signal ratings. |
| Medium | ASCII headshots looked unfinished and were not portraits of the named people. | Used typographic initials and generous linked profile rows. No simulated or generated headshots. |
| Medium | The closing call to action resembled another terminal block. | Added a large closing statement, a circular meeting link, and a distinct email alternative. |
| Medium | Repeated underscore labels and decorative system claims obscured useful information. | Simplified public-facing copy and removed the simulated secure-session/build labels. Kept mono typography, precise metadata, and the live clock. |
| Medium | Motion preference reset after reload, and decorative effects could distract. | Persisted the visitor’s choice for the session, retained OS reduced-motion support, kept an always-visible pause control, and suspended animation when the tab is hidden. |
| Medium | Metadata and brand treatment were generic. | Updated the document title and description, added a local favicon, refined the wordmark, and kept one H1 with named content sections. |
| Medium | Layered CSS overrides made revisions brittle. | Replaced the accumulated stylesheet with a coherent set of components, tokens, and responsive rules; rewrote the motion code to match. |

## Principles used

- **Scale, hierarchy, balance, and grouping:** visual differences should explain what deserves attention. The evidence figure, profile rows, and contact circle intentionally have different visual weights. [Nielsen Norman Group: Five Principles of Visual Design](https://www.nngroup.com/articles/principles-visual-design/)
- **Readable contrast:** WCAG’s standard threshold is 4.5:1 for ordinary text and 3:1 for qualifying large text. The main foreground tokens on the #0d0c10 panel calculate to 16.99:1 (primary), 7.74:1 (secondary), and 6.29:1 (fuchsia). These token checks do not constitute a whole-site contrast certification, particularly during animated transitions. [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- **Respect motion preferences:** support a reduced-motion presentation and user control rather than requiring animation to read or operate the site. Native scrolling remains intact. [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)

## Verification

- JavaScript syntax and Git whitespace checks pass.
- Static HTML checks pass: one H1, unique IDs, valid internal anchor destinations, and existing local stylesheet/script/favicon files.
- Desktop layout inspected at 1440px; mobile at 390px, with an additional 320px overflow and heading-clipping check. No document-level horizontal overflow at those widths.
- Focus disclosures expand with the Enter key; their open state is native HTML and works without JavaScript.
- Navigation, the fixed header, motion-off state, and session persistence were checked in the browser. No browser console errors were reported in the final check.
- Calendly, email, and LinkedIn destinations were preserved and inspected without submitting anything or contacting anyone.
- The canvas caps device pixel ratio at 1.5, paints at roughly 30fps, reduces particles on small screens, and suspends its animation loop in hidden tabs.
- Reduced-motion handling and no-JavaScript fallbacks were reviewed in source. A full screen-reader session, OS preference test, real-device performance benchmark, and cross-browser matrix were not performed.

## What would make the next revision materially stronger

1. **Real portfolio evidence.** Supply approved company names/logos and two or three short investment stories. These would make the investment thesis credible in a way visual effects cannot. The canonical source explicitly says these assets are missing.
2. **Actual people and experience.** Approved headshots, concise factual biographies, and confirmation of Amy’s role would improve the human connection. The typography is intentional in their absence.
3. **Founder feedback.** Ask several target founders what Upper Capital invests in, why they would choose it, and how they would make contact. Use that evidence to revise messaging and navigation.
4. **Production measurement.** Once a release is authorized, measure real-device loading and interaction performance and review the public URL’s metadata. The current work stays local in the existing repository.

This revision raises the quality of art direction and interaction. Award recognition is subjective and cannot be guaranteed by a design pass.


## User-directed CRT revision

The subsequent feedback keeps the open layout but explicitly rejects the lighter editorial type, torus, and circular meeting link. The latest implementation supersedes those choices:

- Heavy JetBrains Mono headings, filled lettering, bracketed wordmark, and terminal-style navigation.
- Three layers of falling purple Matrix glyphs replace all torus geometry.
- Static subtle scanlines and a blinking terminal caret; motion controls still apply.
- A command-line booking link replaces the circular call to action.
- Real user-supplied photos were transformed with the built-in image model into matching purple pixel portraits, replacing the typographic initials. Exact prompts are stored in `assets/avatar-generation-prompts.txt`.
- No fabricated biographies or portfolio evidence added. Those content gaps remain.


## Alternate publication — September 21, 2026

At the user's request, this revision is published separately through `jaredb650/UpperCAlt` on GitHub Pages. The original `UpperCapital` repository and deployment are preserved for client comparison. This supersedes the earlier local-only delivery notes above.
