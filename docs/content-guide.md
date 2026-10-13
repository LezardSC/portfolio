# Content guide

How to change what the portfolio says and shows, without touching any component.
Each recipe gives the file, a snippet to copy, and what to check.

## Where things live

| File | What it holds |
|---|---|
| `src/lib/data/projects.ts` | Every project, and the **PRIORITY** list (which come first) |
| `src/lib/data/categories.ts` | Project **domains** (Web, AI…) and **contexts** (School, Hackathon…): label, colour, icon |
| `src/lib/data/skills.ts` | Skill groups and the skills in them |
| `src/lib/data/skill-icons.ts` | Hand-made skill logos (when simple-icons has none) |
| `src/lib/data/icons.ts` | Line icons for domains and skill groups |
| `src/lib/data/experience.ts` | Jobs, education and certificates, hackathon results |
| `src/lib/data/profile.ts` | Name, role, pitch, About paragraphs, "At a glance", links, CV and photo paths |
| `static/` | CV PDFs, the photo, project images and videos (`static/projects/`) |
| `src/lib/i18n/en.ts`, `fr.ts` | Interface text only (buttons, headings): not content |

Text that changes with the language is written `{ en: '…', fr: '…' }`. Names that don't translate (Rust, Docker, a company name) are plain strings.

**French is typed naturally.** Plain spaces before `:` `;` `!` `?` `%` `»` (and after `«`) and straight apostrophes `'` are fixed automatically when the site is built. A string containing `'` can't sit inside single quotes as is: write it in double quotes (`"l'IA"`), or escape it (`'l\'IA'`) and `npm run format` turns it into `"l'IA"`. A bare `'l'IA'` is a syntax error that `npm run check` and `npm run format` both point at.

After any edit, run the checks at the end of this guide ([Check your edit](#check-your-edit)).

---

## Projects

All in `src/lib/data/projects.ts`, inside `ALL_PROJECTS`. The order of entries doesn't matter: the page sorts them.

### A project, field by field

```ts
	{
		id: 'my-project', // unique, lowercase-with-dashes; never change it once published
		title: 'My Project',
		description: {
			en: 'Long text for the big cards (desktop). Two or three sentences.',
			fr: 'Texte long pour les grandes cartes. Deux ou trois phrases.'
		},
		summary: {
			en: 'One sentence for the small cards, and the big cards on phones, ending with a full stop.', // ≤ 100 characters
			fr: 'Une phrase pour les tuiles du téléphone.'
		},
		date: '2026-05', // 'YYYY-MM' (sorts "Newest"; the card shows the year)
		context: 'personal', // a key of CONTEXTS in categories.ts
		domains: ['ai', 'web'], // keys of DOMAINS; the FIRST one is the main one (card icon, colour, label)
		tech: ['Python', 'Ollama'], // tags at the bottom of the card, at least one
		links: { repo: gh('my-project'), demo: 'https://demo.example.com' }, // both optional
		company: 'Some Company', // optional, professional projects only
		award: { en: 'Winner - Some Hackathon 2026', fr: 'Vainqueur - Some Hackathon 2026' }, // optional
		media: { kind: 'image', src: 'projects/my-project/cover.webp' }, // optional, see Media
		hidden: true // optional: keeps the entry but takes it off the site
	},
```

- `gh('repo-name')` is a shortcut for `https://github.com/LezardSC/repo-name`.
- **Links:** `repo` adds a "Source code ↗" link, `demo` a "Live demo ↗" link. The card's image (and the small cards' title) points to the repo, or to the demo when there's no repo. With neither, the card shows "Private code".
- Filters only list domains and contexts that at least one visible project uses.

### Add a project

Copy the block above into `ALL_PROJECTS`, fill it in, delete the optional lines you don't need. It is placed by date among the projects that aren't in `PRIORITY`; add its id there to move it up.

### Remove a project

Delete its entry. If its id is in `PRIORITY`, delete it there too (a test reminds you).

### Hide a project (and bring it back later)

Add `hidden: true,` to the entry. Delete the line to show it again. A hidden project can't be in `PRIORITY`.

### Choose which projects come first

At the top of `projects.ts`:

```ts
export const PRIORITY: string[] = [
	'kayp-pbw-2024',
	'microcode',
	// …
];
```

In the default "Relevance" sort, these come first in this order, then every other project newest first. It's an order, not a category: the list can be as long as you like. The **first 6 of whatever is displayed** get the big cards (with image or video) and the rest small cards, so with 9 priority projects the last 3 lead the small cards, and filtering on School gives big cards to the 6 best-ranked school projects. Phones show only the **first 5** as big cards; the 6th leads the small tiles there (`LARGE_COUNT` and `PHONE_LARGE_COUNT` in `src/lib/projects.ts`). To reorder, move a line. A typo in an id makes `npm test` fail with `"the-id": no project has this id`.

### Add a live demo link

Add `demo: 'https://…'` to `links`: `links: { repo: gh('my-project'), demo: 'https://my-project.example.com' }`. Use `https://`.

### Show the company

`company: 'Sogeti (Capgemini)'` on a `professional` project shows the company under the title, with a briefcase. It's a plain string: company names don't translate. A test refuses it on other contexts.

### Mark an award

`award: { en: 'Winner - Event 2026', fr: 'Vainqueur - Event 2026' }`. It shows with a trophy on the card. To also list it under Experience → Hackathons, add a hackathon result (see [Experience](#experience)).

---

## Media (images and videos)

Files go in `static/projects/<project-id>/`, and `media` paths start with `projects/` (no leading `/`). File names are **case-sensitive** on the server: `Cover.webp` and `cover.webp` are different files (a test checks that the exact name exists).

### The three shapes

```ts
// An image
media: { kind: 'image', src: 'projects/my-project/cover.webp' },

// A video with its still poster (required)
media: { kind: 'video', src: 'projects/my-project/demo.mp4', poster: 'projects/my-project/poster.webp' },

// Either of the above, plus an image for phones only
media: { kind: 'video', src: '…/demo.mp4', poster: '…/poster.webp', phone: 'projects/my-project/phone.webp' },
```

### How they are shown

- **Desktop:** big cards show the media in a 16:9 frame at the top. A video plays muted and looped while it's on screen; visitors who ask for reduced motion see the poster.
- **Phones:** never play videos. The card's background is the `phone` image if there is one, otherwise the image or poster, blurred and darkened under the text. The text sits in the bottom part of the card, so choose a phone image whose interesting part is in the top half. Desktop never downloads the phone image.
- Small cards (beyond the first 6) show no media.
- Formats: images `.jpg`, `.jpeg`, `.png` or `.webp` (`.webp` is smallest); videos `.mp4`.

### Preparing files with ffmpeg

Install it once: on the Mac `brew install ffmpeg`; on Linux it's usually there (`ffmpeg -version`). Run the commands from the repo root; replace `my-project` with the project id. Create the folder first: `mkdir -p static/projects/my-project`.

**Compress a screen recording into a web video** (16:9, 1280×720, no sound):

```bash
ffmpeg -ss 3 -t 20 -i recording.mov -an \
  -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart \
  static/projects/my-project/demo.mp4
```

- `-ss 3` starts 3 seconds into the recording, `-t 20` keeps 20 seconds. Drop them to keep everything.
- `-crf 28` sets the quality: lower = better and bigger (23), higher = smaller (32). Aim for **5 MB or less**: check with `ls -lh static/projects/my-project/`.
- The crop fills 16:9 by trimming the edges if the recording has another shape.

**Take the poster from the video** (here at second 5):

```bash
ffmpeg -ss 5 -i static/projects/my-project/demo.mp4 -frames:v 1 -c:v libwebp -quality 80 \
  static/projects/my-project/poster.webp
```

Aim for 200 KB or less. Pick a moment that shows the project well: the poster is what phones and reduced-motion visitors see.

**A 16:9 image from a screenshot:**

```bash
ffmpeg -i screenshot.png -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" \
  -c:v libwebp -quality 80 static/projects/my-project/cover.webp
```

**A phone image** (portrait 4:5, 800×1000, centred crop):

```bash
ffmpeg -i screenshot.png -vf "scale=800:1000:force_original_aspect_ratio=increase,crop=800:1000" \
  -c:v libwebp -quality 80 static/projects/my-project/phone.webp
```

To keep another part than the centre, crop it in any image editor first.

### Tune the blur and darkening on phones

Both live in the phone block (`@media (width < 48rem)`) of `src/lib/components/projects/ProjectCardLarge.svelte`:

- **Blur:** `filter: blur(var(--blur, 4px));` on `.card > :global(.media)`. Change `4px` (more = blurrier). For a much stronger blur, also make its `inset: -1rem` more negative (e.g. `-2rem`): the image overflows the card so the blur's soft edge stays hidden.
- **Darkening:** a `#10100e` layer whose opacity is `--veil` (0 = none, 1 = black). `.card.has-media { --veil: 0.58; }` is for cards with an image; `--veil: 0.35;` in `.card` is for cards without one (domain colour as background).

Change the no-image veil in `src/lib/overlay.ts` as well (`veilPlain`): `npm test` fails if it differs from the CSS. It also checks the text contrast on every domain colour with `veilPlain`, so lowering it may fail for a light domain colour. Over an image the contrast isn't tested: check the cards by eye at 360px in both themes.

---

## Categories (domains and contexts)

In `src/lib/data/categories.ts`. The key order is the filter order.

### Add a domain

```ts
	devops: { label: { en: 'DevOps', fr: 'DevOps' }, color: '#1f5f3a', icon: ICONS.cycle },
```

- **key** (`devops`): lowercase-with-dashes, used in projects' `domains`.
- **color**: `#rrggbb`. It tints the phone tiles and the phone cards without media, so it must be fairly dark: `npm test` checks contrast in both themes and fails if it's too light (in `categories.spec.ts`, with "label", "body" or "muted"; in `overlay.spec.ts`, with "text", "meta", "domain", "award", "desc" or "tag"). Darken it until it passes. Each domain needs its own colour.
- **icon**: one of `ICONS` in `icons.ts`, or a new one (below).

The domain shows up in the filters as soon as a visible project uses it.

### Rename or remove a domain

- **Rename** the label only: change `label`. Changing the key means changing it in every project too; `npm run check` lists the projects to fix.
- **Remove**: delete the line; `npm run check` lists the projects that still use it.

### Add, rename or remove a context

```ts
	freelance: { label: { en: 'Freelance', fr: 'Freelance' } },
```

As for domains: to rename, change `label`; changing the key or deleting the line makes `npm run check` list the projects to update.

### Add an icon

Icons are line drawings on a 24×24 grid. The easiest source is [lucide.dev](https://lucide.dev) (same grid and style): open an icon, copy its SVG, and join the `d="…"` values of its `<path>` elements into one string:

```ts
	/** Short description (where it's used). */
	rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91…' + 'M12 15l-3-3…',
```

If a `d` starts with a lowercase `m`, make it an uppercase `M` before joining (a lowercase one would move relative to the end of the previous piece and shift the drawing). `<rect>` and `<circle>` elements have no `d`: convert them to path data first (a circle at `cx, cy` with radius `r` is `M{cx-r} {cy}a{r} {r} 0 1 0 {2r} 0a{r} {r} 0 1 0 {-2r} 0z`), or pick another icon. `npm test` checks every icon is valid path data.

---

## Skills

In `src/lib/data/skills.ts`. Group order and skill order are display order.

### Add a skill

1. Find its logo on [simpleicons.org](https://simpleicons.org). The import name is `si` + the slug with a capital first letter: Rust → `siRust`, Node.js → `siNodedotjs`, GitHub Actions → `siGithubactions`.
2. Add it to the `import { … } from 'simple-icons';` list at the top (alphabetical).
3. Add it to its group: `{ name: 'Rust', icon: siRust },`.

A name that translates: `{ name: { en: 'LLM agents', fr: 'Agents LLM' }, icon: siOllama }`.

No logo on simple-icons? Add one to `skill-icons.ts`: a filled 24×24 path and a brand colour (6 hex digits, no `#`):

```ts
export const MY_TOOL: SkillIcon = { path: 'M…z', hex: '336791' };
```

then `import { …, MY_TOOL } from './skill-icons';` and `{ name: 'My tool', icon: MY_TOOL }`. A colour too close to the page background is replaced by the text colour automatically.

A skill can appear in several groups: add its line to each one. It can only appear once per group (a test checks it).

### Add, reorder or remove a group

```ts
	{
		id: 'data', // unique, lowercase-with-dashes
		icon: ICONS.server, // from icons.ts
		title: { en: 'Data', fr: 'Données' },
		description: { en: 'One line under the title.', fr: 'Une ligne sous le titre.' },
		skills: [{ name: 'PostgreSQL', icon: siPostgresql }]
	},
```

Move a whole `{ … }` block to reorder; delete it to remove the group. A group needs at least one skill.

---

## Experience

In `src/lib/data/experience.ts`. Entries are sorted by the page (newest first).

### Add a job

```ts
	{
		company: 'Company name',
		role: { en: 'Backend developer', fr: 'Développeur backend' },
		roleShort: { en: 'Backend dev', fr: 'Dév backend' }, // optional, for the hero's "Latest role"
		companyShort: 'Company', // optional, for the hero's "Latest role"
		start: '2026-02', // 'YYYY-MM'
		end: '2026-08', // omit while it's ongoing: shows "Present"
		internship: false,
		points: [{ en: 'What you did, one line each.', fr: 'Ce que tu as fait.' }],
		tech: ['Rust', 'PostgreSQL'],
		quote: {
			// optional recommendation
			text: { en: 'The recommendation…', fr: 'La recommandation…' },
			author: 'Name',
			role: { en: 'CTO, Company', fr: 'CTO, Company' },
			original: 'fr' // language it was written in; the other one is marked "translated"
		}
	},
```

The hero's "Latest role" shows the newest job as "roleShort - companyShort" (or the full `role` and `company` when the short ones are missing).

### Add a school or a certificate

```ts
	{
		school: 'Harvard',
		title: { en: 'CS50’s Introduction to Computer Science', fr: 'CS50’s Introduction to Computer Science' },
		start: '2023', // optional, 'YYYY'
		end: '2024',
		points: [], // optional lines under the title
		link: 'https://…' // optional: makes the title a link (certificate)
	},
```

### Add a hackathon result

```ts
	{ medal: 1, event: 'Paris Blockchain Week', date: '2026-04', project: 'KAYP' },
```

- `medal`: 1 (winner), 2 or 3.
- `fullName`: optional, shown as a tooltip when `event` is an acronym.
- `project`: a name, or `{ en, fr }` when it's a description.

The "Hackathons - N podiums" heading and the hero's "2 wins, 5 podiums" count themselves.

---

## Profile, About and "At a glance"

In `src/lib/data/profile.ts`.

- `role`: the line under your name.
- `pitch`: the first sentence of the hero (phones show only this one); `pitchMore`: the rest (desktop only).
- `bio`: the About paragraphs, in order. Phones show the first one, then a "Read more" button for the others (no button when there's only one).
- `glance`: the "At a glance" rows, in order. A hand-written row:

  ```ts
  	{
  		label: { en: 'Stack', fr: 'Stack' },
  		value: { en: 'Python, Rust, C', fr: 'Python, Rust, C' },
  		short: { en: 'Python, Rust', fr: 'Python, Rust' }, // optional, shorter text for phones
  		wide: true // optional, full-width tile on phones (one row at most)
  	},
  ```

  or a row computed from the data: `{ label: { en: 'Latest role', fr: 'Dernier poste' }, auto: 'latestRole' }` or `{ label: { en: 'Hackathons', fr: 'Hackathons' }, auto: 'hackathons' }`.

- `available: true` shows the green "Available for work" pill in the hero.
- `email`, `linkedin`, `github`, `malt`: contact links.
- **CV:** replace `static/cv-en.pdf` and `static/cv-fr.pdf`, keeping the names.
- **Photo:** replace `static/photo.jpg`, keeping the name. It's shown cropped to portrait 4:5 (240×300 on screen), so use at least 480px wide with your face near the centre.

---

## Interface text

Buttons, headings and labels live in `src/lib/i18n/en.ts` and `fr.ts`. Both files must have exactly the same keys (a test checks it). `{name}` parts are filled in by the code: keep them as they are. Unlike content, `fr.ts` is not fixed automatically: type the no-break space (` `) before `:` `;` `!` `?` `%` and use `’`.

---

## Check your edit

From the repo root:

1. `npm run format`: tidies the files (and turns `'l\'IA'` into `"l'IA"`).
2. `npm test`: checks the data. A failure names the project or field. Common messages:
   - `"projects/x/cover.webp": missing from static/`: wrong path or file name (case included).
   - `my-project en: short enough for a tile`: the summary is over 100 characters.
   - `my-project fr: one sentence ending with a full stop`: the summary needs exactly one sentence, ending with `.`.
   - `"the-id": no project has this id` / `is hidden`: fix `PRIORITY`.
   - `light label` / `dark body` / `desc` … `expected … to be greater than or equal to 4.5`: a domain colour is too light; darken it.
   - `export const X: … = typeset(`: write `typeset<Type>(…)` instead (it keeps the check of misspelled field names).
3. `npm run check`: catches typos in field names (`hiden: true` → "Did you mean to write 'hidden'?") and in category keys.
4. `npm run dev`: look at the site (http://localhost:5173), on a narrow window too.
5. Before publishing: `npm run audit` (accessibility and Lighthouse; reports in `reports/`).
