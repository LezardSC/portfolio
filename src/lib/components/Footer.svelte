<script lang="ts">
	import { PROFILE } from '$lib/data/profile';
	import type { Dict } from '$lib/i18n';

	let { t }: { t: Dict['footer'] } = $props();

	/** Build year: the page is prerendered, so it updates on each rebuild. */
	const year = new Date().getFullYear();
</script>

<footer>
	<div class="inner">
		<p>© {year} {PROFILE.name}</p>
		<a href="#hero">{t.backToTop} <span aria-hidden="true">↑</span></a>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--border);
	}
	.inner {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem 1rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	p {
		margin: 0;
	}
	a {
		color: var(--muted);
		text-decoration: none;
	}
	a:hover {
		color: var(--accent);
	}
	@media (max-width: 40rem) {
		.inner {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
