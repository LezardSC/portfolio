import { SKILL_GROUPS } from '$lib/data/skills';
import { shownGroups, spriteVersion } from '$lib/skills';
import type { PageServerLoad } from './$types';

// Server-only (prerendered): the skill logo drawings stay out of the page's JS; they are in
// skill-logos.svg, and the page gets each logo's id and colour.
export const load: PageServerLoad = () => ({
	skills: shownGroups(SKILL_GROUPS),
	logoSprite: `skill-logos.svg?v=${spriteVersion(SKILL_GROUPS)}`
});
