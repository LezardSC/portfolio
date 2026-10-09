# Milestone 8 - Layout & Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the phone page much shorter (overlay project cards, compact rows, one-row filters, tighter sections and skill chips, clamped quotes), give projects real image/video media that never costs phones a video byte, and add desktop card hover.

**Architecture:** One set of markup per component at every width; CSS media queries restyle it for phones (`width < 48rem`). The only new runtime rules are pure, unit-tested functions: `shouldPlayVideo` and `mediaIssues` in `src/lib/projects.ts`, `quoteView` in `src/lib/experience.ts`, `straightApostrophes` in `src/lib/i18n/typography.ts`. Components wire them to `MediaQuery`, `IntersectionObserver` and `ResizeObserver`.

**Tech Stack:** SvelteKit + Svelte 5 runes (`MediaQuery` from `svelte/reactivity`, `prefersReducedMotion` from `svelte/motion`, `$props.id()`), TypeScript, Vitest, `adapter-static`; Playwright (already a dev dependency) for visual checks; system `ffmpeg` only to make temporary test videos (never committed).

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 8 - Layout & media". Read it before starting any task.

## Global Constraints

- Runes only (`$props`, `$state`, `$derived`, `$effect`). No `export let`, no `$:`, no stores.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`; `fr` is typed `Dict`, so every key exists in both (`dicts.spec.ts` enforces it).
- "Phone" = `@media (width < 48rem)` in CSS. "Desktop" = `DESKTOP_QUERY = '(min-width: 48rem)'` in JS. Never `max-width: 48rem` (it overlaps `min-width: 48rem` at exactly 768px).
- Experience is one column below `56.25rem`; the quote clamp only exists there: `(width < 56.25rem)`.
- Hover effects only under `@media (hover: hover) and (pointer: fine)`, mirrored on `:focus-within`; under `prefers-reduced-motion: reduce` no transform (no lift, no zoom), only the border colour.
- Phones, `prefers-reduced-motion` and the prerendered HTML never contain or download a video: the `<video>` element is only inserted when `shouldPlayVideo` is true.
- Media files live in `static/projects/`, paths relative to `static/` (no leading slash). Images `.jpg`/`.jpeg`/`.png`/`.webp`; videos `.mp4` with a required image `poster`.
- Overlay text is white-ish on a dark gradient in **both** themes: the phone overlay redefines `--text`, `--muted`, `--accent`, `--border` locally.
- French: ’ (U+2019), never `'`, in French text; U+00A0 before `: ; ! ? %` and `»`, after `«` (existing rule).
- Tap targets on touch: at least `var(--tap)`.
- Audit targets unchanged from M7: axe **0 violations**; no horizontal scroll at 360px; Lighthouse Accessibility and Best Practices **= 100**, Performance **≥ 95**, SEO 92 accepted as "pending domain" (M10).
- Node 24: in every shell, `source ~/.nvm/nvm.sh && nvm use 24` before `npm` (the Mac's default may be 23.10, which `npm ci` rejects).
- Commands run from the worktree root `/Users/lezard/Documents/portfolio/.claude/worktrees/milestone-8-layout-media`: `npm test`, `npm run check`, `npm run lint`, `npm run build`, `npm run audit`.
- Never commit anything from `tmp/` or the temporary test media (`static/projects/test-*`). Never `git add -A`; add files by name.
- `<scratchpad>` below = the session's scratchpad directory (from the environment notes). Throwaway scripts and screenshots go there, never in the repo.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A project with a video, opened on a phone, with reduced motion, or before hydration**: no `.mp4` request at all. Pinned in Task 1 (`shouldPlayVideo` tests) and Task 8 Step 4 (request counter at 360/390px, at 1440px with `reducedMotion: 'reduce'`, and `grep` of the prerendered HTML for `<video`).
2. **Longest award and title on a 360px overlay card** (KAYP: "Winner - Paris Blockchain Week 2024 (XRPL track)"): the card must grow, never clip or spill text. Pinned in Task 8 Step 4 (`overflowing` must be empty at every width).
3. **Media data mistakes** (missing poster file, a `.gif`, a leading `/`, a typo in a path): the data test fails naming the file. Pinned in Task 1 (`mediaIssues` tests).
4. **Quote shorter than 3 lines, or window widened past 56.25rem while expanded**: no button that expands nothing, no clamp on the wide layout, and no-JS visitors read the whole quote. Pinned in Task 6 (`quoteView` tests) and Task 6 Step 7 (built HTML has no `clamp` class and no button).
5. **Keyboard user tabbing through the one-row filter chips on a phone**: the focused chip scrolls into view with its outline visible. Pinned in Task 4 Step 4 (Playwright: focus the last chip, check it is inside the row's box).

---

### Task 1: Media type, `shouldPlayVideo`, `mediaIssues`

**Files:**
- Modify: `src/lib/projects.ts`
- Modify: `src/lib/projects.spec.ts`
- Modify: `src/lib/data/projects.spec.ts` (replace the last test)

**Interfaces:**
- Consumes: nothing new.
- Produces (all exported from `src/lib/projects.ts`):
  - `type Media = { kind: 'image'; src: string } | { kind: 'video'; src: string; poster: string }`
  - `Project.media?: Media`
  - `DESKTOP_QUERY = '(min-width: 48rem)'`
  - `shouldPlayVideo(s: { desktop: boolean; reducedMotion: boolean; inView: boolean }): boolean`
  - `mediaFiles(media: Media): string[]`
  - `mediaIssues(media: Media, exists: (src: string) => boolean): string[]`

- [ ] **Step 1: Set up the worktree and retire the handoff branch**

```bash
source ~/.nvm/nvm.sh && nvm use 24
npm ci
npm test
# The main checkout sits on the handoff branch; move it to master, then delete the branch.
git -C /Users/lezard/Documents/portfolio status --short   # must print nothing
git -C /Users/lezard/Documents/portfolio checkout master
git -C /Users/lezard/Documents/portfolio pull --ff-only
git branch -D wip-m8-handoff
git push origin --delete wip-m8-handoff
```

Expected: 177 tests pass; the branch is gone locally and on GitHub. `tmp/` in the main checkout is git-ignored and survives the checkout.

- [ ] **Step 2: Write the failing tests** - append to `src/lib/projects.spec.ts` (and add `mediaIssues`, `shouldPlayVideo` to its import list)

```ts
describe('shouldPlayVideo', () => {
	const on = { desktop: true, reducedMotion: false, inView: true };
	it('plays on desktop, in view, without reduced motion', () => {
		expect(shouldPlayVideo(on)).toBe(true);
	});
	it('never plays on a phone-width screen', () => {
		expect(shouldPlayVideo({ ...on, desktop: false })).toBe(false);
	});
	it('never plays under prefers-reduced-motion', () => {
		expect(shouldPlayVideo({ ...on, reducedMotion: true })).toBe(false);
	});
	it('does not play off-screen', () => {
		expect(shouldPlayVideo({ ...on, inView: false })).toBe(false);
	});
});

describe('mediaIssues', () => {
	const all = () => true;
	it('accepts an existing image and a video with an image poster', () => {
		expect(mediaIssues({ kind: 'image', src: 'projects/a.webp' }, all)).toEqual([]);
		expect(
			mediaIssues({ kind: 'video', src: 'projects/a.mp4', poster: 'projects/a.jpg' }, all)
		).toEqual([]);
	});
	it('rejects image formats it does not know, GIFs included', () => {
		expect(mediaIssues({ kind: 'image', src: 'projects/a.gif' }, all)).toHaveLength(1);
	});
	it('rejects a video that is not MP4 and a poster that is not an image', () => {
		const issues = mediaIssues(
			{ kind: 'video', src: 'projects/a.webm', poster: 'projects/a.mp4' },
			all
		);
		expect(issues).toHaveLength(2);
	});
	it('rejects an empty poster', () => {
		expect(
			mediaIssues({ kind: 'video', src: 'projects/a.mp4', poster: '' }, all).length
		).toBeGreaterThan(0);
	});
	it('rejects absolute paths and names missing files', () => {
		const exists = (src: string) => src !== 'projects/missing.jpg';
		expect(mediaIssues({ kind: 'image', src: '/projects/a.jpg' }, exists)[0]).toContain(
			'relative'
		);
		expect(
			mediaIssues(
				{ kind: 'video', src: 'projects/a.mp4', poster: 'projects/missing.jpg' },
				exists
			)[0]
		).toContain('projects/missing.jpg');
	});
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run src/lib/projects.spec.ts`
Expected: FAIL, `shouldPlayVideo` / `mediaIssues` are not exported.

- [ ] **Step 4: Implement** - in `src/lib/projects.ts`, replace the `media` field of `Project` and add the helpers

Replace:

```ts
	/** `src`/`poster` are relative to `static/`, without a leading slash. */
	media?: { kind: 'image' | 'video'; src: string; poster?: string };
```

with:

```ts
	media?: Media;
```

and add above `export type Project`:

```ts
/**
 * Card media. Paths are relative to `static/`, without a leading slash. A video always has a
 * still `poster`: phones and reduced-motion visitors only ever get the poster.
 */
export type Media = { kind: 'image'; src: string } | { kind: 'video'; src: string; poster: string };

/** At and above this width cards keep media on top and videos may play; below it is "phone". */
export const DESKTOP_QUERY = '(min-width: 48rem)';
```

and at the end of the file:

```ts
/** A video plays only on a desktop-width screen, while in view, and never under reduced motion. */
export function shouldPlayVideo(s: {
	desktop: boolean;
	reducedMotion: boolean;
	inView: boolean;
}): boolean {
	return s.desktop && s.inView && !s.reducedMotion;
}

/** Every `static/` file a media entry needs, the poster included. */
export function mediaFiles(media: Media): string[] {
	return media.kind === 'video' ? [media.src, media.poster] : [media.src];
}

const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;
const VIDEO_FILE = /\.mp4$/i;

/** What is wrong with a media entry (formats, paths, missing files). Empty when it is fine. */
export function mediaIssues(media: Media, exists: (src: string) => boolean): string[] {
	const issues: string[] = [];
	const image = media.kind === 'image' ? media.src : media.poster;
	if (!IMAGE_FILE.test(image)) issues.push(`"${image}": not a .jpg, .jpeg, .png or .webp image`);
	if (media.kind === 'video' && !VIDEO_FILE.test(media.src))
		issues.push(`"${media.src}": not an .mp4 video`);
	for (const src of mediaFiles(media)) {
		if (!src) continue;
		if (src.startsWith('/')) issues.push(`"${src}": must be relative to static/`);
		else if (!exists(src)) issues.push(`"${src}": missing from static/`);
	}
	return issues;
}
```

- [ ] **Step 5: Use it in the data test** - in `src/lib/data/projects.spec.ts`, import `mediaIssues` from `$lib/projects` and replace the test `'points media at relative paths that exist in static/'` with:

```ts
	it('has valid media files that exist in static/', () => {
		const exists = (src: string) => existsSync(staticFile(src));
		const issues = PROJECTS.flatMap((p) =>
			p.media ? mediaIssues(p.media, exists).map((issue) => `${p.id}: ${issue}`) : []
		);
		expect(issues).toEqual([]);
	});
```

- [ ] **Step 6: Run everything**

Run: `npm test && npm run check && npm run lint`
Expected: all pass, `npm run check` reports 0 errors (the current `ProjectMedia.svelte` only reads `poster` inside its `kind === 'video'` branch, so the union narrows; if it does report an error there, do Task 2 first and commit both together).

- [ ] **Step 7: Commit**

```bash
git add src/lib/projects.ts src/lib/projects.spec.ts src/lib/data/projects.spec.ts
git commit -m "feat: type project media as image or MP4 video with a poster

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `ProjectMedia` - poster first, video only when it should play

**Files:**
- Modify: `src/lib/components/projects/ProjectMedia.svelte` (full rewrite below)

**Interfaces:**
- Consumes: `DESKTOP_QUERY`, `shouldPlayVideo`, `primaryLink`, `Domain`, `Project` from Task 1.
- Produces: component props unchanged (`{ project: Project }`). Root element keeps class `media` (an `<a>` or a `<div>`); it contains one `div.frame` (the element cards scale on hover) holding an `<img>` (+ a `<video>` once started) or a `div.placeholder` with a `<span>` title.

- [ ] **Step 1: Rewrite the component**

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		DESKTOP_QUERY,
		primaryLink,
		shouldPlayVideo,
		type Domain,
		type Project
	} from '$lib/projects';

	let { project }: { project: Project } = $props();

	/** Placeholder gradient hue per (first) domain. */
	const HUE: Record<Domain, number> = {
		web: 210,
		blockchain: 265,
		ai: 150,
		'low-level': 25,
		games: 330
	};

	const href = $derived(primaryLink(project));
	const media = $derived(project.media);
	/** False on the server, so the prerendered HTML never contains a video. */
	const desktop = new MediaQuery(DESKTOP_QUERY, false);

	let frame = $state<HTMLElement>();
	let video = $state<HTMLVideoElement>();
	let inView = $state(false);
	/** Set the first time the video should play; it then stays (paused off-screen) so scrolling back doesn't reload it. */
	let started = $state(false);
	/** The video failed to load: keep showing the poster. */
	let failed = $state(false);

	const play = $derived(
		shouldPlayVideo({
			desktop: desktop.current,
			reducedMotion: prefersReducedMotion.current,
			inView
		})
	);

	$effect(() => {
		if (play) started = true;
	});

	$effect(() => {
		const el = frame;
		if (!el || media?.kind !== 'video') return;
		const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting), {
			threshold: 0.25
		});
		io.observe(el);
		return () => io.disconnect();
	});

	$effect(() => {
		const v = video;
		if (!v) return;
		if (play) v.play().catch(() => {});
		else v.pause();
	});
</script>

{#snippet content()}
	<div class="frame" bind:this={frame}>
		{#if media}
			<img
				src="{base}/{media.kind === 'video' ? media.poster : media.src}"
				alt=""
				loading="lazy"
				decoding="async"
			/>
			{#if media.kind === 'video' && started && !failed}
				<video
					bind:this={video}
					src="{base}/{media.src}"
					poster="{base}/{media.poster}"
					muted
					loop
					playsinline
					preload="auto"
					onerror={() => (failed = true)}
				></video>
			{/if}
		{:else}
			<div class="placeholder" style:--hue={HUE[project.domains[0]]}>
				<span>{project.title}</span>
			</div>
		{/if}
	</div>
{/snippet}

{#if href}
	<a
		class="media"
		{href}
		target="_blank"
		rel="noopener noreferrer"
		tabindex="-1"
		aria-hidden="true"
		aria-label={project.title}
	>
		{@render content()}
	</a>
{:else}
	<div class="media">{@render content()}</div>
{/if}

<style>
	.media {
		display: block;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--border);
		/* The placeholder title inside the link must not be underlined. */
		text-decoration: none;
	}
	/* Cards scale this on hover (see ProjectCardLarge). */
	.frame {
		position: relative;
		height: 100%;
		transition: transform 0.3s;
	}
	img,
	video {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.placeholder {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 1rem;
		background: linear-gradient(
			135deg,
			hsl(var(--hue) 65% 45%),
			hsl(calc(var(--hue) + 40) 65% 28%)
		);
	}
	.placeholder span {
		color: #fff;
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 700;
		text-align: center;
		text-shadow: 0 2px 12px rgb(0 0 0 / 0.35);
	}
	@media (prefers-reduced-motion: reduce) {
		.frame {
			transition: none;
		}
	}
</style>
```

Note: the old media-hover zoom is gone on purpose; Task 3 moves the zoom to the whole large card.

- [ ] **Step 2: Check, test, build**

Run: `npm run check && npm test && npm run lint && npm run build`
Expected: 0 errors/warnings, tests pass, build succeeds. Then confirm no video in the prerendered pages:
Run: `grep -c '<video' build/en/index.html build/fr/index.html`
Expected: `0` for both.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/projects/ProjectMedia.svelte
git commit -m "feat: show the poster first and add the video only when it should play

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Large cards - phone overlay, desktop hover

**Files:**
- Modify: `src/lib/components/projects/ProjectCardLarge.svelte` (`<style>` block only)
- Modify: `src/lib/components/sections/Projects.svelte` (one media query)

**Interfaces:**
- Consumes: `ProjectMedia` root `.media` and its `.frame`, `.placeholder span` (Task 2).
- Produces: nothing new for other tasks.

- [ ] **Step 1: Align the grid breakpoint** - in `src/lib/components/sections/Projects.svelte` replace `@media (max-width: 48rem) {` with `@media (width < 48rem) {`.

- [ ] **Step 2: Replace the `<style>` block of `ProjectCardLarge.svelte`**

```svelte
<style>
	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem 1.5rem;
	}
	.meta {
		margin: 0;
		font-size: 0.85rem;
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.4rem;
	}
	.award {
		align-self: flex-start;
		margin: 0;
		padding: 0.15rem 0.7rem;
		border-radius: var(--pill);
		font-size: 0.8rem;
		font-weight: 600;
		background: color-mix(in srgb, #e3b341 18%, transparent);
		color: var(--text);
	}
	.desc {
		flex: 1;
		margin: 0;
		color: var(--muted);
	}
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	/* Phone: the media fills the card and the text sits on a dark gradient over it. */
	@media (width < 48rem) {
		.card {
			position: relative;
			justify-content: flex-end;
			height: auto;
			/* At least 4:3; grows with its text (needs overflow visible). */
			aspect-ratio: 4 / 3;
			overflow: visible;
		}
		.card > :global(.media) {
			position: absolute;
			inset: 0;
			aspect-ratio: auto;
			border-radius: calc(var(--radius) - 1px);
		}
		/* The card title is already on the card; the big placeholder title would be repeated. */
		.card :global(.placeholder span) {
			display: none;
		}
		.body {
			/* Light-on-dark in both themes: the gradient is dark whatever the theme. */
			--text: #fff;
			--muted: #d0d7de;
			--accent: #79c0ff;
			--border: rgb(255 255 255 / 0.35);
			position: relative;
			flex: none;
			gap: 0.35rem;
			padding: 2.5rem 1rem 1rem;
			border-radius: 0 0 calc(var(--radius) - 1px) calc(var(--radius) - 1px);
			background: linear-gradient(
				to bottom,
				transparent,
				rgb(0 0 0 / 0.78) 2.5rem,
				rgb(0 0 0 / 0.9)
			);
			color: var(--text);
		}
		h3 {
			font-size: 1.2rem;
		}
		.desc {
			flex: none;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			overflow: hidden;
		}
		.footer {
			margin-top: 0.25rem;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.card {
			transition:
				transform 0.2s,
				box-shadow 0.2s,
				border-color 0.2s;
		}
		.card:hover,
		.card:focus-within {
			transform: translateY(-4px);
			border-color: var(--accent);
			box-shadow: 0 12px 28px rgb(0 0 0 / 0.25);
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: scale(1.03);
		}
	}
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		.card:hover,
		.card:focus-within {
			transform: none;
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: none;
		}
	}
</style>
```

- [ ] **Step 3: Check, test, build**

Run: `npm run check && npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 4: Look at it** - start `npx vite preview --port 4181 --strictPort` (background), then with a throwaway Playwright script in the session scratchpad (resolve `playwright` with `createRequire(process.cwd() + '/')` and run it from the worktree root) screenshot `#projects` at 360px and 390px, dark and light, and at 1280px with the mouse over the first card. Expected: phone cards about 260–300px tall with the placeholder gradient behind white text, nothing cut off; desktop card lifted with an accent border. Stop the preview server afterwards (kill it by PID, not `pkill -f`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/projects/ProjectCardLarge.svelte src/lib/components/sections/Projects.svelte
git commit -m "feat: overlay large project cards on phones, lift them on hover

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Small cards as compact rows, one-row filters

**Files:**
- Modify: `src/lib/components/projects/ProjectCardSmall.svelte` (markup: one `<p class="meta">`; full `<style>` block)
- Modify: `src/lib/components/projects/ProjectFilters.svelte` (`<style>` block: add one media query)

**Interfaces:**
- Consumes: `ProjectLinks` root `.links`, `TechTags` root `ul`, global `.sr-only` (`src/app.css`).
- Produces: nothing new.

- [ ] **Step 1: Small card markup** - in `ProjectCardSmall.svelte` replace

```svelte
	<p class="meta">{project.date.slice(0, 4)} · {t.contexts[project.context]}</p>
```

with

```svelte
	<p class="meta">
		{project.date.slice(0, 4)} · {t.contexts[project.context]}
		{#if project.award}
			<!-- Phone only (the award line is hidden there); display: none elsewhere, so it is never read twice. -->
			<span class="trophy"
				><span aria-hidden="true">🏆</span><span class="sr-only">{project.award[lang]}</span></span
			>
		{/if}
	</p>
```

- [ ] **Step 2: Replace the small card `<style>` block**

```svelte
<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.icon {
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.15rem;
	}
	h3 a {
		color: inherit;
		text-decoration: none;
	}
	h3 a:hover {
		color: var(--accent);
	}
	.meta,
	.award {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.trophy {
		display: none;
	}
	.desc {
		flex: 1;
		margin: 0;
		color: var(--muted);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}

	/* Phone: one compact row - icon | title over year · context | links, then two lines of text. */
	@media (width < 48rem) {
		.card {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			grid-template-areas:
				'icon title links'
				'icon meta links'
				'desc desc desc';
			align-items: center;
			gap: 0 0.75rem;
			height: auto;
			padding: 0.9rem 1rem;
		}
		.top {
			display: contents;
		}
		.icon {
			grid-area: icon;
			align-self: start;
		}
		.card :global(.links) {
			grid-area: links;
		}
		h3 {
			grid-area: title;
			font-size: 1.05rem;
		}
		.meta {
			grid-area: meta;
		}
		.trophy {
			display: inline;
		}
		.award,
		.card > :global(ul) {
			display: none;
		}
		.desc {
			grid-area: desc;
			margin-top: 0.5rem;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.card {
			transition:
				transform 0.2s,
				border-color 0.2s;
		}
		.card:hover,
		.card:focus-within {
			transform: translateY(-2px);
			border-color: var(--accent);
		}
	}
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		.card:hover,
		.card:focus-within {
			transform: none;
		}
	}
</style>
```

- [ ] **Step 3: One-row filters** - append inside the `<style>` of `ProjectFilters.svelte`:

```css
	/* Phone: each group is one row of chips that scrolls sideways; the label stays put. */
	@media (width < 48rem) {
		.group {
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
			/* Room for the focus outline, and for the last chip to leave the faded edge. */
			padding: 4px 2rem 4px 2px;
			mask-image: linear-gradient(to right, #000 calc(100% - 2rem), transparent);
		}
		.group::-webkit-scrollbar {
			display: none;
		}
		.label {
			position: sticky;
			left: 0;
			z-index: 1;
			flex-shrink: 0;
			min-width: auto;
			padding-right: 0.5rem;
			background: var(--bg);
		}
		.chip {
			flex-shrink: 0;
			white-space: nowrap;
		}
	}
```

- [ ] **Step 4: Check and look**

Run: `npm run check && npm test && npm run lint && npm run build`
Expected: all pass.

With `npx vite preview --port 4181 --strictPort` running, a scratchpad Playwright script at 360px:
- screenshots `#projects` (dark and light, EN and FR): small cards are ~120–140px rows; filters are two single rows;
- `document.documentElement.scrollWidth <= 360` (no page overflow);
- presses Tab until `document.activeElement` is the last chip of the Domain group, then checks `chip.getBoundingClientRect()` is inside `group.getBoundingClientRect()` (left ≥ group left, right ≤ group right).
Expected: all true. Stop the server by PID.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/projects/ProjectCardSmall.svelte src/lib/components/projects/ProjectFilters.svelte
git commit -m "feat: compact project rows and one-row filters on phones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Tighter sections and skill chips on phones

**Files:**
- Modify: `src/lib/components/Section.svelte` (`<style>` block)
- Modify: `src/lib/components/sections/Skills.svelte` (`<style>` block: add one media query)

**Interfaces:** none.

- [ ] **Step 1: Section** - replace the `<style>` block of `Section.svelte` with:

```svelte
<style>
	section {
		max-width: 72rem;
		margin: 0 auto;
		padding: 4rem 1rem;
	}
	h2 {
		font-size: 2rem;
		margin: 0 0 1.5rem;
	}
	@media (width < 48rem) {
		section {
			padding: 2.5rem 1rem;
		}
		h2 {
			font-size: 1.6rem;
			margin-bottom: 1.25rem;
		}
	}
</style>
```

- [ ] **Step 2: Skills** - append inside the `<style>` of `Skills.svelte` (after the existing media queries):

```css
	@media (width < 48rem) {
		.groups {
			gap: 1.75rem;
		}
		h3 {
			margin-bottom: 0.75rem;
		}
		ul {
			gap: 0.4rem;
		}
		li {
			gap: 0.4rem;
			padding: 0.3rem 0.65rem;
			font-size: 0.9rem;
		}
		li svg {
			width: 18px;
			height: 18px;
		}
	}
```

- [ ] **Step 3: Check and look**

Run: `npm run check && npm test && npm run lint && npm run build`
Expected: all pass. Screenshot `#skills` and `#contact` + footer at 390px and 1440px: phone chips smaller, desktop unchanged; no empty gap above the footer at 1440px.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Section.svelte src/lib/components/sections/Skills.svelte
git commit -m "feat: tighter sections and skill chips on phones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Clamp long recommendation quotes on one-column layouts

**Files:**
- Modify: `src/lib/experience.ts` (add `quoteView`)
- Modify: `src/lib/experience.spec.ts`
- Modify: `src/lib/components/experience/JobItem.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (keys `experience.readMore`, `experience.showLess`)

**Interfaces:**
- Consumes: `Dict['experience']`.
- Produces:
  - `quoteView(s: { narrow: boolean; overflows: boolean; expanded: boolean }): { clamp: boolean; button: boolean }` in `src/lib/experience.ts`
  - `ONE_COLUMN_QUERY = '(width < 56.25rem)'` in `src/lib/experience.ts`
  - dict keys `experience.readMore`, `experience.showLess`

- [ ] **Step 1: Write the failing test** - append to `src/lib/experience.spec.ts` (add `quoteView` to its import from `./experience`):

```ts
describe('quoteView', () => {
	it('clamps a long quote on one column and offers to expand it', () => {
		expect(quoteView({ narrow: true, overflows: true, expanded: false })).toEqual({
			clamp: true,
			button: true
		});
	});
	it('keeps the button to collapse an expanded quote', () => {
		expect(quoteView({ narrow: true, overflows: true, expanded: true })).toEqual({
			clamp: false,
			button: true
		});
	});
	it('shows no button when the quote fits in 3 lines', () => {
		expect(quoteView({ narrow: true, overflows: false, expanded: false }).button).toBe(false);
	});
	it('neither clamps nor shows a button on the two-column layout, even if expanded before', () => {
		for (const expanded of [false, true])
			expect(quoteView({ narrow: false, overflows: true, expanded })).toEqual({
				clamp: false,
				button: false
			});
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/experience.spec.ts`
Expected: FAIL, `quoteView` is not exported.

- [ ] **Step 3: Implement** - append to `src/lib/experience.ts`:

```ts
/** Below this width Experience is one column, and long quotes get clamped. */
export const ONE_COLUMN_QUERY = '(width < 56.25rem)';

/**
 * Whether a recommendation quote is clamped to 3 lines and whether its Read more / Show less
 * button shows. `overflows` = the clamped quote is longer than 3 lines (measured in the browser).
 */
export function quoteView(s: { narrow: boolean; overflows: boolean; expanded: boolean }): {
	clamp: boolean;
	button: boolean;
} {
	return {
		clamp: s.narrow && !s.expanded,
		button: s.narrow && (s.expanded || s.overflows)
	};
}
```

Run: `npx vitest run src/lib/experience.spec.ts` → PASS.

- [ ] **Step 4: Dict keys** - in `src/lib/i18n/en.ts`, inside `experience`, after `translated`:

```ts
		readMore: 'Read more',
		showLess: 'Show less',
```

and in `src/lib/i18n/fr.ts`, inside `experience`, after `translated`:

```ts
		readMore: 'Lire la suite',
		showLess: 'Réduire',
```

- [ ] **Step 5: Wire it in `JobItem.svelte`** - replace the `<script>` block with:

```svelte
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import type { Dict, Lang } from '$lib/i18n';
	import { ONE_COLUMN_QUERY, periodPoints, quoted, quoteView, type Job } from '$lib/experience';
	import TechTags from '../projects/TechTags.svelte';
	import Period from './Period.svelte';

	let { job, lang, t }: { job: Job; lang: Lang; t: Dict['experience'] } = $props();

	const quoteId = `${$props.id()}-quote`;
	const narrow = new MediaQuery(ONE_COLUMN_QUERY, false);
	/** False in the prerendered HTML: without JS the whole quote shows and there is no button. */
	let ready = $state(false);
	let expanded = $state(false);
	let overflows = $state(false);
	let quoteEl = $state<HTMLElement>();

	const view = $derived(quoteView({ narrow: narrow.current, overflows, expanded }));
	const clamp = $derived(ready && view.clamp);

	$effect(() => {
		ready = true;
	});

	// Measure while clamped (on first clamp and on every resize): does the quote need the button?
	$effect(() => {
		const el = quoteEl;
		if (!el || !clamp) return;
		const measure = () => (overflows = el.scrollHeight > el.clientHeight + 1);
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});
</script>
```

and replace the `{#if job.quote}` … `{/if}` block with:

```svelte
	{#if job.quote}
		<blockquote>
			<p id={quoteId} class:clamp bind:this={quoteEl}>{quoted(job.quote.text[lang], lang)}</p>
			<footer>
				- {job.quote.author}, {job.quote.role[lang]}
				{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
			</footer>
		</blockquote>
		{#if ready && view.button}
			<button
				type="button"
				class="more"
				aria-expanded={expanded}
				aria-controls={quoteId}
				onclick={() => (expanded = !expanded)}
			>
				{expanded ? t.showLess : t.readMore}
			</button>
		{/if}
	{/if}
```

The button sits after `</blockquote>`, not inside it: a blockquote holds only quoted content.

and add to the `<style>` block:

```css
	.clamp {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}
	.more {
		min-height: var(--tap);
		margin-left: calc(1rem + 3px);
		padding: 0;
		border: none;
		background: none;
		color: var(--accent);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.more:hover {
		text-decoration: underline;
	}
```

- [ ] **Step 6: Run everything**

Run: `npm test && npm run check && npm run lint`
Expected: all pass (`dicts.spec.ts` sees the new keys in both dicts).

- [ ] **Step 7: Check the built HTML and look**

Run: `npm run build && grep -c 'class="more"\|class="clamp' build/en/index.html`
Expected: `0` (no clamp, no button before hydration).

With the preview running, a scratchpad Playwright script:
- at 390px, both languages: each quote shows 3 lines + "Read more"/« Lire la suite »; clicking expands it and the label flips; `aria-expanded` flips;
- at 1440px: no `.more` button, full quotes;
- at 390px with JavaScript disabled (`browser.newContext({ javaScriptEnabled: false })`): full quotes, no button.
Stop the server by PID.

- [ ] **Step 8: Commit**

```bash
git add src/lib/experience.ts src/lib/experience.spec.ts src/lib/components/experience/JobItem.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: clamp long recommendation quotes on one-column layouts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Curly apostrophes in French text

**Files:**
- Modify: `src/lib/i18n/typography.ts` (add `straightApostrophes`)
- Modify: `src/lib/i18n/typography.spec.ts`
- Modify: `src/lib/data/profile.ts` and any other file the new test points at

**Interfaces:**
- Produces: `straightApostrophes(text: string): string[]` in `src/lib/i18n/typography.ts`.

- [ ] **Step 1: Write the failing tests** - in `typography.spec.ts`, import `straightApostrophes` too, add:

```ts
describe('straightApostrophes', () => {
	it('flags a straight apostrophe with some context', () => {
		expect(straightApostrophes("pour l'argent")).toEqual(["pour l'argent"]);
	});
	it('accepts the typographic apostrophe', () => {
		expect(straightApostrophes('pour l’argent')).toEqual([]);
	});
});
```

and inside `describe('French content', …)`, after the existing `it.each`, add:

```ts
	it.each(Object.entries(sources))('%s uses ’ rather than a straight apostrophe', (_, texts) => {
		expect(texts.flatMap(straightApostrophes)).toEqual([]);
	});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/i18n/typography.spec.ts`
Expected: FAIL: `straightApostrophes` not exported.

- [ ] **Step 3: Implement** - append to `src/lib/i18n/typography.ts`:

```ts
/** Each straight apostrophe (U+0027) in a French text, with a little context; French uses ’ (U+2019). */
export function straightApostrophes(text: string): string[] {
	return [...text.matchAll(/'/g)].map((m) =>
		text.slice(Math.max(0, m.index - 12), m.index + 12)
	);
}
```

Run: `npx vitest run src/lib/i18n/typography.spec.ts`
Expected: the unit tests pass; the "profile uses ’" test FAILS and lists the spots (`c'est`, `l'interface`, `l'argent`, `J'y`, `j'ai`, `Aujourd'hui`, `l'aise`, `l'IA`, …). Other sources may also be listed.

- [ ] **Step 4: Fix the content** - in every `fr` string the test lists, replace each `'` with `’`. In `src/lib/data/profile.ts` these strings are double-quoted only because of the apostrophes; after the replacement run `npx prettier --write` on each edited file so they become single-quoted like the rest.

Run: `npm test && npm run lint && npm run check`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/typography.ts src/lib/i18n/typography.spec.ts src/lib/data/profile.ts
# plus any other data/dict file you fixed, by name
git commit -m "fix: use typographic apostrophes in French text

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Check with real media at every width, then the audit

Nothing from this task's temporary media is committed.

**Files:**
- Temporary only: `static/projects/test-*`, edits to `src/lib/data/projects.ts` (reverted in Step 6)
- Create (scratchpad, not the repo): `m8-check.cjs`

- [ ] **Step 1: Make temporary media from the test files**

```bash
T=/Users/lezard/Documents/portfolio/tmp
cp "$T/pexels-photo-378442-2055502109.jpg" static/projects/test-a.jpg
cp "$T/negative-space-sunflowers-field-sunset-1536x1023-3463019637.jpg" static/projects/test-d.jpg
for x in "b:icegif-886-1656924910.gif" "c:c3162775635d404d6462187ea4b5941f-508932986.gif"; do
	n=${x%%:*}; f=${x#*:}
	ffmpeg -y -loglevel error -i "$T/$f" -movflags +faststart -pix_fmt yuv420p \
		-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 26 -an "static/projects/test-$n.mp4"
	ffmpeg -y -loglevel error -i "static/projects/test-$n.mp4" -frames:v 1 -q:v 3 "static/projects/test-$n.jpg"
done
ls -la static/projects
```

Expected: `test-a.jpg`, `test-b.mp4`, `test-b.jpg`, `test-c.mp4`, `test-c.jpg`, `test-d.jpg`; each MP4 a few hundred KB.

- [ ] **Step 2: Point four projects at it (temporary edit of `src/lib/data/projects.ts`)** - add a `media` line to these entries (after `links`):
  - `kayp-pbw-2024`: `media: { kind: 'image', src: 'projects/test-a.jpg' },`
  - `kayp-h-web3-paris`: `media: { kind: 'video', src: 'projects/test-b.mp4', poster: 'projects/test-b.jpg' },`
  - `ft-transcendence`: `media: { kind: 'video', src: 'projects/test-c.mp4', poster: 'projects/test-c.jpg' },`
  - `microcode`: `media: { kind: 'image', src: 'projects/test-d.jpg' },`

`bahapad` and `goldeneye-data-augmentation` (private, no link) keep the placeholder, so both cases are checked. Run `npm test` (the media data test must pass) and `npm run build`.

- [ ] **Step 3: Write the check script** - `<scratchpad>/m8-check.cjs`:

```js
// node <scratchpad>/m8-check.cjs <origin> <out-dir>   (run from the worktree root)
const { createRequire } = require('node:module');
const { chromium } = createRequire(process.cwd() + '/')('playwright');
const [origin, out] = process.argv.slice(2);

async function visit(browser, { lang, theme, width, reducedMotion = 'no-preference', shot = true }) {
	const ctx = await browser.newContext({
		viewport: { width, height: 800 },
		colorScheme: theme,
		reducedMotion
	});
	const page = await ctx.newPage();
	let videoRequests = 0;
	page.on('request', (r) => {
		if (r.url().endsWith('.mp4')) videoRequests++;
	});
	await page.goto(`${origin}/${lang}/`, { waitUntil: 'networkidle' });
	const total = await page.evaluate(() => document.documentElement.scrollHeight);
	for (let y = 0; y < total; y += 500) {
		await page.evaluate((y) => window.scrollTo(0, y), y);
		await page.waitForTimeout(120);
	}
	await page.evaluate(() => window.scrollTo(0, 0));
	const heights = await page.evaluate(() => ({
		page: document.documentElement.scrollHeight,
		...Object.fromEntries(
			[...document.querySelectorAll('main section[id]')].map((s) => [
				s.id,
				Math.round(s.getBoundingClientRect().height)
			])
		)
	}));
	// Any project card whose content sticks out of it (clipped or spilling text).
	const overflowing = await page.evaluate(() =>
		[...document.querySelectorAll('#projects article')]
			.filter((card) => {
				const box = card.getBoundingClientRect();
				return [...card.querySelectorAll('h3, p, ul, a, span')].some((el) => {
					const r = el.getBoundingClientRect();
					return r.width > 0 && (r.bottom > box.bottom + 1 || r.right > box.right + 1);
				});
			})
			.map((card) => card.querySelector('h3')?.textContent?.trim())
	);
	const pageOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth
	);
	if (shot)
		await page.screenshot({ path: `${out}/${lang}-${theme}-${width}.png`, fullPage: true });
	await ctx.close();
	return { lang, theme, width, reducedMotion, videoRequests, heights, overflowing, pageOverflow };
}

(async () => {
	const browser = await chromium.launch();
	const results = [];
	for (const lang of ['en', 'fr'])
		for (const theme of ['dark', 'light'])
			for (const width of [360, 390, 768, 1024, 1440])
				results.push(await visit(browser, { lang, theme, width }));
	results.push(
		await visit(browser, { lang: 'en', theme: 'dark', width: 1440, reducedMotion: 'reduce', shot: false })
	);
	await browser.close();
	console.log(JSON.stringify(results, null, 1));
})();
```

- [ ] **Step 4: Run it and read the results**

```bash
grep -c '<video' build/en/index.html build/fr/index.html     # expect 0 and 0
npx vite preview --port 4181 --strictPort &                   # note the PID
mkdir -p <scratchpad>/m8-shots
node <scratchpad>/m8-check.cjs http://localhost:4181 <scratchpad>/m8-shots > <scratchpad>/m8-results.json
```

Expected, for every result:
- `videoRequests` = 0 at 360 and 390px, and 0 for the `reducedMotion: 'reduce'` run; > 0 at 768, 1024 and 1440px;
- `overflowing` = `[]` (no clipped or spilling card text, including KAYP's long award at 360px);
- `pageOverflow` = `false`.

Open the screenshots (Read tool) for EN dark 390, EN light 390, FR dark 360 and EN dark 1440 and check: overlay text readable in both themes, image visible at the top of each phone card, compact rows, one-row filters, smaller chips, clamped quotes. Note `heights.page` and per-section heights at 390 and 1440 for the review guide (before: phone 13,600px - Projects 7,263, Experience 2,248, Skills 1,609, About 899; desktop 7,450px - Projects 3,479, Experience 1,097, Skills 817, About 540). Fix anything wrong in the owning task's file and commit it as `fix: …` before going on.

Stop the preview server by PID.

- [ ] **Step 5: Audit with media in place**

Run: `npm run audit -- --screens`
Expected: all PASS (25/25). Copy the screenshots you want in the review guide from `reports/screens/` to `docs/reviews/milestone-8/` (create it): at least EN dark 390, EN light 390 and EN dark 1440 of the projects section. These show test media; the guide must say so.

- [ ] **Step 6: Remove the temporary media**

```bash
git checkout -- src/lib/data/projects.ts
rm static/projects/test-*
git status --short    # only docs/reviews/milestone-8/*.png may show
```

- [ ] **Step 7: Final run without media**

Run: `npm test && npm run check && npm run lint && npm run audit`
Expected: all pass, audit 25/25.

---

### Task 9: Review guide and PR

**Files:**
- Create: `docs/reviews/milestone-8-review-guide.md`
- Add: `docs/reviews/milestone-8/*.png` (from Task 8)

- [ ] **Step 1: Write the review guide**, same structure as `docs/reviews/milestone-7-review-guide.md`:
  - Header: branch `milestone-8-layout-media` → `master`; source of truth = spec section "Milestone 8 - Layout & media" + this plan; M9 is Finishing touches & SEO, M10 Deployment.
  - **0. Get the code:** `cd /Users/lezard/Documents/portfolio/.claude/worktrees/milestone-8-layout-media && source ~/.nvm/nvm.sh && nvm use 24 && npm ci` (or `gh pr checkout <n>`); commit → task table from `git log --oneline master..`.
  - **1. Automated checks:** `npm run check && npm test && npm run lint && npm run build`, `npm run audit`; expected test count (read it from the last run) and the audit table.
  - **Heights before/after** table (page + Projects, Experience, Skills, About at 390 and 1440px) from Task 8.
  - **Screenshots** from `docs/reviews/milestone-8/`, stating they use temporary test media that is not committed.
  - **How to add real media:** drop `name.mp4` (and/or an image) in `static/projects/`, extract a poster with
    `ffmpeg -i static/projects/name.mp4 -frames:v 1 -q:v 3 static/projects/name.jpg`,
    then add `media: { kind: 'video', src: 'projects/name.mp4', poster: 'projects/name.jpg' }` (or `{ kind: 'image', src: 'projects/name.jpg' }`) to the project in `src/lib/data/projects.ts`; `npm test` checks formats and paths.
  - **2. Manual checks on a real phone and browser:** overlay readability on your own screenshots (bright images); scrolling filter rows with a thumb; "Read more" on a phone; hover on a desktop with a mouse; turning on "reduce motion" in macOS settings stops videos; a video in Safari.
  - **3. Code review:** where each pure function lives and what to look at (`shouldPlayVideo`, `mediaIssues`, `quoteView`, `straightApostrophes`; `ProjectMedia` effects; CSS breakpoints `width < 48rem` / `56.25rem`).

- [ ] **Step 2: Commit, push, open the PR**

```bash
git add docs/reviews/milestone-8-review-guide.md docs/reviews/milestone-8/
git commit -m "docs: add Milestone 8 review guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin worktree-milestone-8-layout-media:milestone-8-layout-media
gh pr create --base master --head milestone-8-layout-media \
	--title "Milestone 8: layout & media" \
	--body-file <scratchpad>/m8-pr-body.md
```

Write `<scratchpad>/m8-pr-body.md` first: one paragraph on what changed (phone layout, media, hover), the before/after phone height, the audit result (25/25), a link to `docs/reviews/milestone-8-review-guide.md`, and as its last line:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 3: Stop.** Give the user the PR link and the review guide path. Nothing is merged until they have reviewed it.
