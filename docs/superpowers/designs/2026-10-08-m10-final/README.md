# Milestone 10 - final phone design (2026-10-08)

Copies of the validated boards from the Claude Design canvas "Portfolio - Mobile"
(https://claude.ai/artifact/9N2zK35VungBsy2GnLcE59). The canvas is the source of truth; these files are a snapshot.

- `Mobile-Clair.dc.html`: full phone page, 390px wide, light theme (canvas board `Mix.dc.html`).
  Its `theme` prop switches it to dark.
- `Mobile-Sombre.dc.html`: dark board. It only mounts the light board with `theme="Sombre"`
  (`<dc-import name="Mix">`, the light board's name on the canvas).
- `skill-logos.json`: the skill logos (name → colour + SVG path). On the canvas the boards load it from
  an uploaded asset (`/_blob/8f1fccbf5449c2e2aa96d9aee959c001`); the logos are the same as on the desktop boards.

Desktop reference stays `../2026-10-07-m9-final/`. Colours, fonts, borders and radii are the desktop ones.

## What the user chose, section by section

| Section | Choice |
|---|---|
| Header | Name, theme toggle, EN, and a filled **Contact** button. No burger menu. |
| Hero | Compact: name on two lines (58px), role, one-sentence pitch, "En bref" as 2×2 tiles + full-width Stack tile; "Voir les projets" full width, then "Voir le CV" / "Malt ↗" side by side. |
| About | Photo (88px) + first paragraph; the rest behind "Lire la suite". |
| Projects - filters | Three native selects: Contexte, Domaine (side by side), Trier par (full width). |
| Projects - featured | Compact cards: the project's **mobile photo** as full-card background, blurred (6px) and darkened (62% black veil), info on top in white (domain, year · context, title, award, 3-line description, tags, code link). Blur/darkening to be tuned with the real photos. |
| Projects - others | 2-column tiles tinted by domain, large domain icon as a watermark, domain · year, title, **one-sentence summary**, context, Code ↗ / Privé. 6 shown, then "Voir les 5 autres projets". |
| Skills | Accordion version of the desktop tabs: one row per domain (icon, name, count, chevron); the open one gets the 2px ink border + 5px accent offset shadow and shows its logos in 2 columns. |
| Experience | Jobs stacked; each recommendation collapsed behind a "Recommandation - Name" button. Compact education and hackathon list. |
| Contact | E-mail card (address on one line, 19px), Malt card as one tappable row, then LinkedIn / GitHub / CV as three equal buttons. |
| Titles | Section headers: outlined number 46px inline with a 29px title. |

## New requirements this implies

- Every project needs a **short description** (one sentence, EN + FR) for the small tiles, next to the long one.
  Draft FR summaries are in the board (`SHORT`); the user still has to review them.
- Every featured project needs a **mobile photo** (featured projects with a video already have one).
- **Domain colours** for the tiles: IA `#0B6E6E`, Blockchain `#24408E`, Bas niveau `#C2391B`, Jeux `#7A2E5E`
  (Web is not in the other projects; it would need one if a Web project becomes "other").
  Light: tile background = 11% of the colour on white, label in the colour.
  Dark: background = 24% of the colour on `#121210`, label = colour mixed 45% with white.
- Black brand logos (Express, Java, Rust, Django, Solidity…) switch to the text colour in dark mode.
- No sideways scrolling anywhere; touch targets ≥ 44px.

## Open points

- The hero name (58px) is tight on 360px phones; it should scale down there.
- Tablet widths were not designed.
- Blur and darkening of the featured cards: revisit once real photos are in.
