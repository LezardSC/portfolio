# Watch list

Things worth worrying about that are not fixed yet. Each entry: what, why it matters, where it should be handled. Remove an entry when it is done.

## Before or at deployment (M13)

- **The English CV is the French one.** `static/cv-en.pdf` and `static/cv-fr.pdf` are byte-identical, so English visitors download a French CV. Export an English CV (without the phone number) before going public.
- **Absolute canonical / hreflang / `og:image` URLs.** Link previews and Lighthouse SEO (92 today, `hreflang`) need absolute URLs, which need the domain. One site-origin setting; `DOMAIN_PENDING_AUDITS` in `scripts/audit-report.ts` then goes.
- **32 MB of project videos in git.** Every re-encode adds its full size to the history forever. Decide before deployment: keep in git, Git LFS, or host media outside the repo.
- **`PRIORITY` is empty** (`src/lib/data/projects.ts`): "Relevance" sorts exactly like "Newest". Known; Jocelyn sets it with the final content.

## Performance (next milestone)

- **Lighthouse mobile performance 93–94 < 95** (desktop 100). FCP 2.1 s, LCP 2.9 s on simulated slow 4G + 4× CPU; TBT 10 ms, CLS 0. Look at render-blocking CSS and font (the font preload is in place; inline critical CSS?) and the LCP element. Report: `reports/lighthouse-mobile.html` after `npm run audit`.
- **Each page ships both languages' content in its JS** (page node about 66 KB gzipped, `{ en, fr }` everywhere). Fine at this size; revisit if content grows a lot.
- **simple-icons objects ship whole** (title, slug, an `svg` getter) where only `{ path, hex }` is used: a few KB of the page JS.

## Later

- **`light-dark()`** once iOS < 17.5 is negligible: the light palette in `src/app.css` could then be written once (today twice, kept equal by `theme-tokens.spec.ts`).
- **The copy announcement uses one `requestAnimationFrame`** (`Contact.svelte`): a ~100 ms timeout is more reliable for some screen readers to repeat an identical message.
- **Narrowing the window with focus on a desktop nav link** drops focus to `<body>` when the links hide below 48rem.
- **`npm run screens` without `--compare` silently replaces an existing baseline.** A slip mid-refactor throws the reference away: warn when one exists, or require `--force`.
- **`src/lib/data/icons.ts` header comment** still describes only category icons at a 1.5 stroke; `ICONS` now also holds interface icons drawn at the caller's stroke (2, 2.2).
- **`projectLayout` tests** cover 0, 3, 6 and 13 projects: the exact-5 case (where the phone-only tiles start) would pin the boundary.
