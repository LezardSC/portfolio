import { SLIDE_MS, slideKeyframes } from './slide';

const running = new WeakMap<HTMLElement, Animation>();

/**
 * Slides `el` open (it must already be shown) or closed (hide it once this resolves). Stops a
 * slide still running on it first, starting from its current height. Resolves right away under
 * prefers-reduced-motion; false when a later slide interrupted this one.
 */
export async function slide(el: HTMLElement, opening: boolean): Promise<boolean> {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
	const from = opening && !running.has(el) ? 0 : el.getBoundingClientRect().height;
	running.get(el)?.cancel();
	const style = getComputedStyle(el);
	const full = {
		height: el.getBoundingClientRect().height,
		paddingTop: parseFloat(style.paddingTop),
		paddingBottom: parseFloat(style.paddingBottom)
	};
	el.style.overflow = 'hidden';
	const animation = el.animate(slideKeyframes(full, from, opening), {
		duration: SLIDE_MS,
		easing: 'ease-out'
	});
	running.set(el, animation);
	try {
		await animation.finished;
		return true;
	} catch {
		return false; // cancelled by a later slide
	} finally {
		if (running.get(el) === animation) {
			running.delete(el);
			el.style.overflow = '';
		}
	}
}
