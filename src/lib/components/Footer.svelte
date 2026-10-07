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
		background: var(--footer-bg);
		color: var(--footer-text);
	}
	.inner {
		max-width: 77.5rem;
		min-height: 5.5rem;
		margin: 0 auto;
		padding: 0 2.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	p {
		margin: 0;
		font-weight: 700;
	}
	a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
		color: var(--footer-text);
		font-weight: 600;
	}
	a:hover {
		opacity: 0.8;
	}
	@media (max-width: 40rem) {
		.inner {
			flex-direction: column;
			justify-content: center;
			padding: 1.5rem 1rem;
			text-align: center;
		}
	}
</style>
