# Watch list

Things worth worrying about that are not fixed yet. Each entry: what, why it matters, where it should be handled. Remove an entry when it is done.

## Content

- **Media in git and on OVH.** About 32 MB of the 100 MB hosting, almost all project videos; every re-encode adds its full size to the git history. `npm run budget` fails over 80 MB (CI and every deploy). Near the limit: re-encode, then consider hosting media outside the repo.

## Hosting

- **HSTS** (`Strict-Transport-Security`) in `static/.htaccess` once HTTPS has run cleanly for a few weeks: hard to undo (browsers refuse plain http for the max-age), so not set in M13.
- **What the free hosting really offers** (FTPS, `mod_headers`, `mod_deflate`) is only known after the first deploy: if the smoke check or `curl -I` shows a missing header, note it in `docs/deploy.md` and here.

## Performance

- **Each page ships both languages' content in its JS** (page node 31 KB gzipped since M13 moved the skill logos into `skill-logos.svg`; about 5-10 KB of it is the other language). Mobile Lighthouse is 97 without it; revisit only if content grows a lot.

## Later

- **`light-dark()`** once iOS < 17.5 is negligible: the light palette in `src/app.css` could then be written once (today twice, kept equal by `theme-tokens.spec.ts`).
- **The copy announcement uses one `requestAnimationFrame`** (`Contact.svelte`): a ~100 ms timeout is more reliable for some screen readers to repeat an identical message.
- **Narrowing the window with focus on a desktop nav link** drops focus to `<body>` when the links hide below 48rem.
- **`npm run screens` without `--compare` silently replaces an existing baseline.** A slip mid-refactor throws the reference away: warn when one exists, or require `--force`.
- **`src/lib/data/icons.ts` header comment** still describes only category icons at a 1.5 stroke; `ICONS` now also holds interface icons drawn at the caller's stroke (2, 2.2).
- **`projectLayout` tests** cover 0, 3, 6 and 13 projects: the exact-5 case (where the phone-only tiles start) would pin the boundary.
