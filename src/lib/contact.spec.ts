import { describe, expect, it } from 'vitest';
import { PROFILE } from '$lib/data/profile';
import { LANGS } from '$lib/i18n/lang';
import { contactLinks, type ContactLink } from './contact';

const byId = (links: ContactLink[]) => Object.fromEntries(links.map((l) => [l.id, l]));

describe('contactLinks', () => {
	it('labels profiles with their brand name and links them', () => {
		const links = byId(contactLinks('en', '', 'CV'));
		expect(links['linkedin']).toMatchObject({ label: 'LinkedIn', href: PROFILE.linkedin });
		expect(links['github']).toMatchObject({ label: 'GitHub', href: PROFILE.github });
	});

	it('points the CV tile at the file for the language, under base', () => {
		expect(byId(contactLinks('en', '', 'CV (PDF)'))['cv']).toMatchObject({
			label: 'CV (PDF)',
			href: '/cv-en.pdf'
		});
		expect(byId(contactLinks('fr', '/portfolio', 'CV'))['cv'].href).toBe('/portfolio/cv-fr.pdf');
		expect(byId(contactLinks('en', '/portfolio/', 'CV'))['cv'].href).toBe('/portfolio/cv-en.pdf');
	});

	it.each(LANGS)('%s: never has an empty label or href', (lang) => {
		for (const l of contactLinks(lang, '', 'CV')) {
			expect(l.label.trim(), l.id).not.toBe('');
			expect(l.href.trim(), l.id).not.toBe('');
		}
	});
});
