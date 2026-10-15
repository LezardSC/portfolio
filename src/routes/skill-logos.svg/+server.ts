import { SKILL_GROUPS } from '$lib/data/skills';
import { logoSprite } from '$lib/skills';

export const prerender = true;

export const GET = () =>
	new Response(logoSprite(SKILL_GROUPS), { headers: { 'Content-Type': 'image/svg+xml' } });
