import { onMount } from 'svelte';

/**
 * False in the prerendered HTML and until the component mounts, then true: lets a component
 * show everything without JS and add its toggles once hydrated. Call during component init.
 */
export function hydrated(): { readonly current: boolean } {
	let current = $state(false);
	onMount(() => {
		current = true;
	});
	return {
		get current() {
			return current;
		}
	};
}
