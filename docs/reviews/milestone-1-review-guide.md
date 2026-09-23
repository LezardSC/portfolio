# How to review PR #1 — Milestone 1 (Foundation)

PR: https://github.com/LezardSC/portfolio/pull/1 · branch `milestone-1-foundation` → `master`

This guide covers three things, in this order:

1. **Automated checks** (5 min): confirm the machine-checkable parts pass on your machine.
2. **Manual browser testing** (15–20 min): check what a recruiter will actually experience.
3. **Code review** (30–45 min): read the code, understand it, and decide whether you'd maintain it as-is.

What this milestone is supposed to do is defined in
`docs/superpowers/specs/2026-09-23-portfolio-design.md` (Milestone 1 only) and
`docs/superpowers/plans/2026-09-23-milestone-1-foundation.md`. When the code and those
documents disagree, the spec wins.

---

## 0. Get the code

The branch is already checked out in the worktree:

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-1-foundation
git pull            # in case new commits were pushed to the PR
npm install         # only needed the first time, or after package.json changes
```

(Alternative from any clone: `gh pr checkout 1`.)

The branch has 6 commits. You can review them one by one (`git log --oneline master..HEAD`),
because each one matches a task in the plan:

| Commit | Plan task |
|---|---|
| `chore: scaffold SvelteKit project…` | Task 1 |
| `feat: add /en and /fr prerendered routes…` | Task 2 |
| `feat: add typed EN/FR dictionaries` | Task 3 |
| `feat: add dark/light theme tokens…` | Task 4 |
| `feat: add nav, language switch, theme toggle…` | Task 5 |
| `fix: base-aware locale links, theme first-paint, lint config` | fixes from the final review |

---

## 1. Automated checks

Run these from the worktree. Each one has an expected result:

```bash
npm test          # Expect: Test Files 4 passed, Tests 18 passed
npm run check     # Expect: 0 ERRORS 0 WARNINGS
npm run lint      # Expect: "All matched files use Prettier code style!"
npm run build     # Expect: ends with 'Wrote site to "build"' and "✔ done"
```

Then look at what the build produced:

```bash
find build -name index.html
# Expect exactly: build/index.html  build/en/index.html  build/fr/index.html

grep -o '<html lang="[a-z]*"' build/en/index.html build/fr/index.html
# Expect: lang="en" for the en page, lang="fr" for the fr page

grep -o '<title>[^<]*' build/en/index.html build/fr/index.html
# Expect: "Jocelyn — Software Engineer" / "Jocelyn — Ingénieur logiciel"
```

**If any of these fails**, stop there. Paste the output into a PR comment, or give it to me next session.

---

## 2. Manual browser testing

Start the production build (this is the real static site, not the dev server):

```bash
npm run preview
```

Open **http://localhost:4173/** in Chrome, or any Chromium-based browser. The DevTools steps below
use Chrome's menus. Keep DevTools open (F12) the whole time and watch the **Console**: it must stay
free of red errors.

Tick each box on the PR as you go. The PR description has the same list.

### 2.1 Language redirect from `/`

| Step | Expected |
|---|---|
| Open `http://localhost:4173/` with your normal browser language | You land on `/en/` (or `/fr/` if your browser is set to French) |
| DevTools → ⋮ → More tools → **Sensors** → **Location**: set a custom location and set **Locale** to `fr-FR`. Reload `http://localhost:4173/` | You land on `/fr/`, and the page is in French |
| Same, with Locale `de-DE` | You land on `/en/` (unsupported language falls back to English) |
| Same, with Locale `fr-CA` | `/fr/` |

If the Sensors panel won't override the locale, change the browser's language settings instead
(Settings → Languages → put French first), then restore them afterwards.

**No-JavaScript fallback:** DevTools → `Ctrl+Shift+P` → type "Disable JavaScript" → Enter.
Open `http://localhost:4173/`. **Expected:** the page shows two links, "English · Français", and
both work. Turn JavaScript back on the same way ("Enable JavaScript").

### 2.2 Unknown URLs

| URL | Expected |
|---|---|
| `http://localhost:4173/de/` | 404 page (not a broken page with missing text) |
| `http://localhost:4173/EN/` | 404 |
| `http://localhost:4173/en` (no trailing slash) | Redirects to `/en/` |

### 2.3 Page structure and nav

On `/en/`:

- [ ] A fixed bar at the top with "Jocelyn", then About · Projects · Skills · Experience · Contact, then an **FR** button and a round theme button.
- [ ] Below it: a big "Jocelyn" hero, then five sections, each with a title and "Coming soon."
- [ ] Click each nav link: the page **scrolls smoothly** to that section, and the section title is **not hidden under the nav bar**.
- [ ] Click "Jocelyn" in the nav: you go back to the top.
- [ ] Press `Tab` repeatedly: every link and button gets a **visible focus outline**.

### 2.4 Language switch

| Step | Expected |
|---|---|
| On `/en/`, click **FR** | `/fr/`, everything in French, the button now says **EN** |
| Click the **Projects** nav link (URL becomes `/en/#projects`), then click **FR** | You land on `/fr/#projects`, scrolled to the Projects section |
| After switching, DevTools → Elements → the top `<html>` tag | `lang="fr"` |
| `Ctrl`+click (or middle-click) **FR** | Opens `/fr/` in a **new tab**, current tab unchanged |

Known limitation (deliberate, planned for Milestone 7): if you scroll to a section **by hand**
rather than through a nav link, switching language takes you to the top. Only the `#hash` in the URL
is kept.

### 2.5 Theme

Start clean: DevTools → **Application** → Local storage → `http://localhost:4173` → delete the
`theme` key (or run `localStorage.removeItem('theme')` in the Console).

| Step | Expected |
|---|---|
| DevTools → `Ctrl+Shift+P` → "Show Rendering" → **Emulate CSS prefers-color-scheme: dark**, then reload | Dark page, **sun** icon on the theme button |
| Same with **light**, then reload | Light page, **moon** icon |
| Click the theme button | Theme flips immediately; the icon flips too |
| Reload the page | Your chosen theme is kept (stored under the `theme` key in Local storage) |
| Keep light chosen, then **hard reload** (`Ctrl+Shift+R`) several times | **No flash of dark** before the page appears |
| Switch language (FR/EN) | The theme is kept |
| With a theme chosen, change the emulated prefers-color-scheme | The page does **not** change, because your explicit choice wins (expected) |

**Storage blocked** (like a very strict privacy setting):
Chrome → Settings → Privacy → Third-party cookies → "See all site data and permissions", or go to
`chrome://settings/content/siteDetails?site=http%3A%2F%2Flocalhost%3A4173` directly → **Cookies and site data: Block**.
Reload the page. **Expected:** the page still loads with the system theme, the toggle still flips it,
and the Console shows no error. Reset the setting afterwards.

Known limitation (Milestone 7): if you haven't chosen a theme and change the OS theme while the page
is open, the page only follows after a reload.

### 2.6 Mobile width

DevTools → device toolbar (`Ctrl+Shift+M`) → width **375**.

- [ ] The nav links can be scrolled sideways inside the bar.
- [ ] The **page itself** does not scroll sideways, and nothing overflows the right edge.
- [ ] The FR and theme buttons stay visible and clickable.

### 2.7 Hosting under a sub-path (optional, 5 min)

The site must work whether it's hosted at `https://yourdomain.com/` or at a sub-path like
`https://lezardsc.github.io/portfolio/`. To try the sub-path case:

1. In `vite.config.ts`, change `adapter: adapter()` to
   `adapter: adapter(),` followed by a new line `paths: { base: '/portfolio' }`.
2. `npm run build && npm run preview`
3. Open **http://localhost:4173/portfolio/**. The redirect, the language switch and the no-JS links
   must all stay under `/portfolio/…`.
4. **Undo the change:** `git checkout -- vite.config.ts` (it must not be committed), then run
   `npm run build` again.

---

## 3. Code review

### 3.1 Suggested reading order

Read from the core outwards. Each layer only depends on the ones above it.

1. `src/lib/i18n/lang.ts`: languages, browser-language picking, URL building. Pure functions, no Svelte.
2. `src/lib/i18n/lang.spec.ts` and `src/params/lang.spec.ts`: what those functions promise.
3. `src/lib/sections.ts`, `src/lib/i18n/en.ts`, `fr.ts`, `index.ts`, `dicts.spec.ts`: all UI text.
4. `src/lib/theme.ts` and `theme.spec.ts`, then `src/app.html` (inline theme script) and `src/app.css`.
5. `src/params/lang.ts`, `src/hooks.server.ts`, `src/routes/+layout.ts`: routing and prerender config.
6. `src/routes/+page.svelte`: the `/` redirect.
7. `src/routes/[lang=lang]/+page.ts` and `+page.svelte`: the real page.
8. `src/lib/components/*.svelte`, then `components/sections/*.svelte`.
9. Config: `vite.config.ts`, `package.json`, `.prettierignore`, `.gitignore`.

On GitHub, use the **Files changed** tab. You can mark each file "Viewed" as you finish it.
`package-lock.json` is generated, so skip it.

### 3.2 What to check, file by file

**`lang.ts`**
- `isLang` is **case-sensitive** (`'EN'` is rejected). That is intentional: `/EN/` must return 404, not a page.
- `pickLang` lowercases and takes the part before `-`, so `fr-CA` becomes `fr`. It returns the **first supported**
  language in the browser's list, else `en`.
- `localeHref(base, lang)` always ends with `/`. It must, because `+layout.ts` sets `trailingSlash = 'always'`.
- It must **not** import the dictionaries (`en.ts`/`fr.ts`). That keeps `/` and the route matcher small.

**Tests (`*.spec.ts`)**
- Does each test check **behaviour** (inputs → outputs), not implementation details?
- Is anything missing that you'd expect? For example: what happens with `pickLang(['fr_FR'])` (underscore)?
  That falls back to `en` today. Decide whether you care.

**Dictionaries (`en.ts`, `fr.ts`)**
- `fr` is typed `Dict` (= the shape of `en`). Try it: delete a key in `fr.ts` and run `npm run check`.
  It should fail. Then undo.
- Read every French string. **You are the native speaker here**, so check tone and wording.
- The meta description and tagline are placeholders written by me. Check whether they describe you
  the way you want. They will be rewritten in Milestone 3 anyway.

**Theme (`theme.ts`, `app.html`, `app.css`)**
- The script in `app.html` **duplicates** the logic of `resolveTheme` on purpose. It must run before
  any JavaScript module loads, or you'd see a flash. Check that the two copies agree:
  valid stored value → use it; otherwise → system preference.
- `try/catch` around `localStorage` in both `app.html` and `ThemeToggle.svelte`: storage can be blocked.
- `app.css` defines the light colours twice: once for `[data-theme='light']`, and once for no-JS
  visitors whose system is light. Check that both blocks have **identical values**.
- Colour contrast: are `--muted` on `--bg` and `--accent` readable in both themes? A quick check is
  the DevTools "CSS Overview" panel, or any contrast checker.

**Routing (`params/lang.ts`, `hooks.server.ts`, `+layout.ts`, `[lang=lang]/+page.ts`)**
- The matcher rejects anything but `en`/`fr`, which is why unknown locales 404.
- `hooks.server.ts` only runs **at build time** (prerender). It replaces `%lang%` in `app.html`. There is no server in production.
- `entries()` lists `/en/` and `/fr/` for prerendering, from `LANGS`, so adding a language is a one-place change.
- `load` returns `{ lang, t }`. `t` is the whole dictionary for that language.

**Components**
- **Svelte 5 runes only:** `$props()`, `$state()`, `$derived()`. There must be no `export let` and no
  `$:` statements. Grep for them: `grep -rn "export let\|\$:" src` should print nothing.
- `LangSwitch.svelte`: plain clicks do a **full page load** (`location.assign` plus `data-sveltekit-reload`),
  so `<html lang>` comes from the prerendered file. Ctrl, Cmd, Shift and middle clicks are left to the browser.
  The `href` is a real link, so it still works without JS.
- `ThemeToggle.svelte`: both icons are always in the HTML. CSS shows the right one based on
  `html[data-theme]`, which gives the correct icon from the first paint. Note the `aria-label` is only
  exact after JS loads (known, Milestone 7).
- `Section.svelte`: each `<section>` has an `id` (the nav anchor) and `aria-labelledby` pointing at its `<h2>`.
- The five section files are near-copies **on purpose**. Each will get completely different content in
  Milestones 2–6.
- Accessibility: buttons and links have labels, and `nav` has a translated `aria-label`.
  Does anything else seem to be missing?

**Config**
- `vite.config.ts`: SvelteKit's config lives here (there is intentionally no `svelte.config.js`).
- `.prettierignore` excludes `docs/` and `.superpowers/`, so Prettier never rewrites the spec or plan.
- `package.json` name is `portfolio`.

### 3.3 Questions to ask yourself on every file

- **Do I understand it?** If a line is unclear, leave a question comment on the PR. That's a valid review comment.
- **Is it correct?** Look for edge cases: empty values, wrong case, missing storage, no JS, narrow screens.
- **Is it the simplest thing that works?** Flag anything that looks over-built for a portfolio.
- **Would I be comfortable changing it in 3 months?** Names, file sizes, comments where something non-obvious happens.
- **Does it match the spec?** Anything the spec asks for Milestone 1 that you can't find? Anything extra that nobody asked for?

### 3.4 Decisions already made (review them, but know they're deliberate)

These came up during review. Each was kept on purpose, with its trade-off. If you disagree with any
of them, say so. It's your project.

| Decision | Why | Cost if it's wrong |
|---|---|---|
| Theme logic duplicated in `app.html` | Must run before modules load (no flash) | Copies could drift, a one-line fix |
| Five near-identical placeholder sections | They'll diverge completely in M2–M6 | ~60 lines of temporary duplication |
| No component tests, only unit tests on pure functions | All logic is in tested functions; component tests need extra setup | A wiring bug would only show in manual testing |
| Language switch keeps only the URL `#hash` | Meets the spec; the better version needs scroll tracking | Hand-scrolled readers land at the top (M7) |
| Theme doesn't follow live OS changes | Rare case; small follow-up | Needs a reload (M7) |
| Stock Svelte favicon, no `<title>` on `/` | `/` is only a redirect page; favicon is branding work | Cosmetic (M7) |
| Placeholder text in hero and meta | Real content is Milestone 3 | None, it gets replaced |

**Out of scope for this PR** (don't block on these): real content, projects and filters (M2), CV and
photo, SEO/Open Graph tags, a custom 404 page, and deployment.

### 3.5 One thing to know about the spec

Your spec edit changed the project `Context` type to `'professionnal' | 'personal' | 'school' | 'hackathon'`.
Note the spelling "professionnal"; in English it's "professional". But the **Filters** line in the same
spec still lists "School, Personal, Hackathon, Game jam". This doesn't affect this PR. It needs a
decision before Milestone 2.

---

## 4. Giving your verdict

On GitHub, in the PR's **Files changed** tab:

- Click a line number (or drag over several lines) to leave a **comment** on specific code.
- When you're done, click **Review changes** and pick one:
  - **Comment**: questions only, no decision yet.
  - **Request changes**: something must change before merging.
  - **Approve**: good to merge.

Or tell me in the next session: "PR #1: <what you found>". I'll read your GitHub comments
(`gh` is set up), fix things on the same branch, and the PR updates automatically. Once it's
approved and merged, we move to Milestone 2.
