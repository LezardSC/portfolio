# How to review the Milestone 6 PR (Contact & Footer)

Branch `milestone-6-contact` → `master`. See the PR link on GitHub for the number.

The review has three parts, in this order:

1. **Automated checks** (2 min)
2. **Manual browser testing** (10 min). I already checked the built site with headless Chromium: screenshots in EN/FR, dark/light, at 1280px and 375px, plus a no-sideways-scroll check at 320px. Chromium also exercised the Copy button (normal copy, double click, clipboard unavailable) and the tab order. Look at it in a real browser anyway, above all to try Copy and the `mailto:` link with your own mail client.
3. **Content and code review** (10 min)

Source of truth: the "Contact & Footer" section of `docs/superpowers/specs/2026-09-23-portfolio-design.md`,
together with `docs/superpowers/plans/2026-10-01-milestone-6-contact.md`.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-6-contact
npm install
```

(Alternative from any clone: `gh pr checkout <PR number>`.)

| Commit | Plan task |
|---|---|
| `docs: settle Milestone 6 contact and footer design` + 1 follow-up | spec |
| `docs: add Milestone 6 contact and footer plan` | plan |
| `feat: add contact data, tile helper and brand icons` | Task 1 |
| `refactor: share one new-tab screen-reader text across sections` | Task 2 |
| `feat: add contact tiles with copyable email` | Task 3 |
| `feat: add site footer with back-to-top link` | Task 4 |
| `fix: show the Malt symbol and break the email after the @` | Task 5 (visual check) |
| `docs: add Milestone 6 review guide` | this file |

## 1. Automated checks

```bash
npm run check && npm test && npm run lint && npm run build
```
Expected: 0 errors/warnings, 128 tests pass, lint clean, build writes `build/`.

## 2. Manual browser testing

```bash
npm run preview    # http://localhost:4173
```

Contact (`/en/#contact`, then `/fr/#contact`):
- [ ] A short grey intro line: *Open to opportunities. Email is the fastest way to reach me.* / *Ouvert aux opportunités. Le plus rapide pour me joindre, c’est l’e-mail.*
- [ ] Five tiles, centered, in this order: email, LinkedIn (*jocelyn-renault*), GitHub (*LezardSC*), Malt, CV (PDF). All are always expanded, with no hover-to-reveal.
- [ ] No phone number, no location, no link to this site's repo.
- [ ] Hovering a tile turns its border blue and lifts it slightly.
- [ ] **Email tile:** the envelope opens your mail client (`mailto:`). The address is plain text you can select. **Copy** / **Copier** copies it and shows *Copied!* / *Copié !* for 2 s.
- [ ] LinkedIn, GitHub, Malt and CV open in a new tab. The CV is the English file on `/en/` and the French one on `/fr/`.
- [ ] Logos: LinkedIn blue, Malt red-pink **symbol** (see below), GitHub in the text colour on dark and black on light, envelope and document in the accent blue.

Footer (bottom of both pages):
- [ ] *© 2026 Jocelyn Renault* on the left, *Back to top ↑* / *Retour en haut ↑* on the right, with a thin line above.
- [ ] *Back to top* scrolls to the top of the page.

Both themes (toggle in the nav):
- [ ] Tile borders, logos and the footer line are visible in dark **and** light mode.

Widths (DevTools device mode):
- [ ] Under 640px the tiles stack as full-width rows and the footer parts stack and center.
- [ ] At 375px the address breaks after the **@** (*jocelynrenaultpro@* / *gmail.com*). At 320px it breaks inside the name, but nothing scrolls sideways.

Keyboard:
- [ ] Tab order through Contact: envelope → Copy → LinkedIn → GitHub → Malt → CV, each with a visible blue focus.

Unchanged but touched:
- [ ] Hero buttons and the CS50 link in Education look the same as before. Their hidden "(opens in a new tab)" text now comes from one shared key, so the French wording is *(s’ouvre dans un nouvel onglet)* everywhere.

## 3. Content and code review

Calls I made during the build (please confirm):
- **Malt logo:** the `simple-icons` Malt icon is the whole *malt* wordmark, which was unreadable at 28px. The tile shows only the flower symbol, cropped to fill the icon. The label next to it still says *Malt*. If you prefer the wordmark, it's a one-entry revert in `src/lib/data/contact-icons.ts`.
- **LinkedIn logo:** it isn't in `simple-icons`, so its path is written into `src/lib/data/contact-icons.ts` next to the others instead of a separate `LinkedInIcon.svelte`. The spec was updated to match.
- **Email line break:** a hidden break point (`<wbr>`) after the @ lets the address wrap there on phones. Copying still gives the plain address.

Content, which is yours to edit in `src/lib/data/profile.ts` and the dictionaries:
- [ ] Email, LinkedIn and Malt URLs are right.
- [ ] The intro sentence says what you want, in both languages.

Code:
- `src/lib/contact.ts`: `contactLinks(lang, base, cvLabel)` builds the five tiles in order; `profileHandle` takes a profile URL's last path segment for the label. Tested in `contact.spec.ts`, including the CV link under a sub-path.
- `src/lib/data/contact-icons.ts`: `{ path, hex }` for LinkedIn, GitHub and Malt (Malt with a `viewBox` crop). `contact-icons.spec.ts` checks each logo keeps its brand colour in at least one theme.
- `src/lib/components/contact/ContactIcon.svelte`: draws all five icons. Brand colours per theme come from `logoColor`, the same mechanism as Skills.
- `src/lib/components/sections/Contact.svelte`: the tiles and the copy logic. If the clipboard isn't available (plain `http://`, permission denied), it selects the address instead of throwing. Props are narrowed to `{ lang, title, t: Dict['contact'], newTab }`.
- `src/lib/components/Footer.svelte`: the year is the build year, so it updates on each rebuild.
- i18n: new `contact` and `footer` keys; `hero.newTab` and `experience.newTab` merged into a top-level `newTab` (a test keeps it single); unused `placeholder` removed.

Left for later (final-review minors):
- The Malt crop depends on how `simple-icons` orders its path. If a future `simple-icons` update redraws it, the crop could break. Inlining the symbol path, like LinkedIn's, would pin it.
- A second Copy within 2 s isn't re-announced to screen readers.
- If copying fails, the address is selected but there's no visible "press Ctrl+C" hint.
- The copy timer isn't cleared when the component is destroyed (harmless today).
- The email tile builds its text from `PROFILE.email` instead of the tested `contactLinks` label (because of the `<wbr>`).
