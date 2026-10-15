import { base } from '$app/paths';
import { sitemapXml } from '$lib/seo';

export const prerender = true;

export const GET = () =>
	new Response(sitemapXml(base), { headers: { 'Content-Type': 'application/xml' } });
