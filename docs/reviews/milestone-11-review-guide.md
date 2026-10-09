# Milestone 11 - Content-ready refactor: review guide

**Goal:** every content edit touches one place, mistakes are caught by `npm run check` or by a test that names the project and field, and `docs/content-guide.md` explains every edit. The site looks the same as before.

Spec: `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 11 - Content-ready refactor". Plan: `docs/superpowers/plans/2026-10-08-milestone-11-content-refactor.md`.

## Where do I edit…

| I want to… | File | Guide section |
|---|---|---|
| Add, remove, hide a project; add a demo link | `src/lib/data/projects.ts` | Projects |
| Choose which projects come first | `PRIORITY` at the top of `projects.ts` | Projects |
| Add an image, a video, a phone image | `static/projects/<id>/` + the project's `media` | Media (with ffmpeg commands) |
| Add or rename a domain or context | `src/lib/data/categories.ts` | Categories |
| Add a skill or a skill group | `src/lib/data/skills.ts` | Skills |
| Add a job, school, certificate, hackathon | `src/lib/data/experience.ts` | Experience |
| Rewrite the About, pitch, "At a glance" | `src/lib/data/profile.ts` | Profile |
| Replace the CV or photo | `static/` (same file names) | Profile |

## What changed, task by task

1. **French typography, automatic.** French content can be typed with plain spaces and `'`: `typeset()` adds the no-break spaces (before `: ; ! ? % »`, after `«`) and `’` at build time. Every data export goes through it. `fr.ts` (interface text) is unchanged and still typed by hand.
2. **Icons.** One icon list (`src/lib/data/icons.ts`, path strings) and one `Icon.svelte`. `DomainIcon` and `SkillGroupIcon` are gone; each skill group has an `icon` field.
3. **Categories, one entry each.** `src/lib/data/categories.ts` holds each domain's label, colour and icon, and each context's label (moved out of `en.ts`/`fr.ts`). Adding a domain is one line; the contrast tests run on every domain. Filters only list categories that a visible project uses. Content-only tests were removed ("one project in every context", "a private project exists", "the six skill groups in this order").
4. **Priority list and hidden projects.** `PRIORITY` (a list of ids, any length) replaces the `featured: 1…6` numbers: it's an order, not a category. The default sort is now called **Relevance / Pertinence**; the big cards are simply the first 6 of whatever is displayed. The lead reads « 17 projets, les plus importants d’abord. » and the line « Projets d’école et de game jam, plus courts. » under « Autres projets » is gone (changed after your first review). `hidden: true` takes a project off the site while keeping its text. A test names any unknown, hidden or duplicated id in `PRIORITY`.
5. **Phone images.** `media.phone` (optional) is used on phones only, through `<picture><source media="not all and (min-width: 48rem)">`. Desktop never downloads it, and phones without one use the image or poster as before.
6. **"At a glance" computed from the data.** "Latest role" comes from the newest job (new optional `roleShort` / `companyShort`) and "2 wins, 5 podiums" from the hackathon list, with proper singular and plural forms. The text is identical to before. With a single About paragraph, phones show no "Read more" button.
7. **Content guide** `docs/content-guide.md`, linked from the README and CLAUDE.md.
8. **Final review fix:** `typeset()` was hiding TypeScript's typo check (`hiden: true` compiled). Data files now call `typeset<Project[]>(…)`; `npm run check` says "Did you mean to write 'hidden'?", and a test stops the old pattern from coming back.

## Visual changes

The projects lead, the sort label (Relevance / Pertinence) and the removed line under « Autres projets » (see 4). And on **desktop**, project cards without an image show a gradient with the title. Its colours used to come from a separate hue table; now they come from the domain's own colour (blue for blockchain, teal for AI…), matching the phone tiles. This disappears as soon as a project gets real media. Phones are unchanged.

## Verification

- `npm test`: **308 passed**. `npm run check`: 0 errors. `npm run lint`: clean. `npm run build`: OK.
- `npm run audit`: 0 axe violations (EN/FR × dark/light × 360/1280px, collapsibles open, before hydration); no horizontal scroll at 360px; Lighthouse mobile performance 97 / desktop 100, accessibility and best practices 100, SEO 92 (hreflang pending the domain, M12).
- **Pixel comparison** with a fresh build of `master` (full pages, `/en/` and `/fr/`, dark and light, 360 and 1280px):
  - phones: only icon edges differ (up to ~700 pixels per page of antialiasing: icons are now drawn as one path instead of several shapes; same shapes, checked magnified);
  - desktop: the same icon edges plus the placeholder gradients above, nothing else.
- **Phone image**, checked with stock photos injected temporarily (never committed): at 390px KAYP's card loads and shows the phone image, and microcode (no phone image) shows its normal image; at 1280px the phone image is never requested; the prerendered HTML contains the `<source>`.
- **`hidden`**: with `love-takedown` hidden, it's absent from the page and the lead reads "16 projects".
- **Guide walk-through:** following the recipes literally, I added a "DevOps" domain (`#1f5f3a`, icon `cycle`) and a project with a demo link and French typed with plain spaces and `'`. Tests and check passed, the DevOps filter and card appeared with "Live demo ↗" and the right no-break spaces. Hiding the project removed the DevOps filter. Reverted afterwards. The ffmpeg commands were run on sample media: exact 1280×720 and 800×1000 output, video without sound.

## Try it yourself

1. Open `docs/content-guide.md` and follow one recipe, e.g. add a skill, or move a line in `PRIORITY`, then `npm test` and `npm run dev`.
2. Add `hidden: true` to a project: it disappears from the page and the count.
3. Misspell a field (`hiden: true`) and run `npm run check`: it should point at it.

## Deferred minors

- The Experience heading "Hackathons - {n} podiums" has no singular or zero form (predates M11).
- `typeset()` would turn a non-plain object (`Date`, `Map`) into `{}`; there are none in the data.
- `typeset()` also touches `fr` file paths (`cv.fr`): a French file name containing `'` would break; keep file names plain.
- `PRIORITY` is a list of strings rather than a type of known ids; the test gives clear messages instead.
