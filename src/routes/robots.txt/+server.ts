import { base } from '$app/paths';
import { robotsTxt } from '$lib/seo';

export const prerender = true;

export const GET = () =>
	new Response(robotsTxt(base), { headers: { 'Content-Type': 'text/plain' } });
