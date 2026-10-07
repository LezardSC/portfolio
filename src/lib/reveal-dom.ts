import type { Action } from 'svelte/action';
import { shouldReveal } from './reveal';

/** Fades a section in once, the first time it scrolls into view (see shouldReveal). */
export const reveal: Action<HTMLElement> = (node) => {
	const rect = node.getBoundingClientRect();
	const animate = shouldReveal({
		supported: 'IntersectionObserver' in window,
		reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
		inViewAtStart: rect.top < innerHeight && rect.bottom > 0
	});
	if (!animate) return;
	node.classList.add('reveal', 'reveal-pending');
	const observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((e) => e.isIntersecting)) return;
			node.classList.remove('reveal-pending');
			observer.disconnect();
		},
		{ rootMargin: '0px 0px -10% 0px' }
	);
	observer.observe(node);
	return {
		destroy() {
			observer.disconnect();
		}
	};
};
