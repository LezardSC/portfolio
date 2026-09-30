import { describe, expect, it } from 'vitest';
import { PROFILE } from '$lib/data/profile';
import { LANGS } from '$lib/i18n/lang';
import { contactLinks, profileHandle, type ContactLink } from './contact';

const byId = (links: ContactLink[]) => Object.fromEntries(links.map((l) => [l.id, l]));

describe('profileHandle', () => {
	it('returns the last path segment, ignoring a trailing slash', () => {
		expect(profileHandle('https://www.linkedin.com/in/jocelyn-renault/')).toBe('jocelyn-renault');
		expect(profileHandle('https://github.com/LezardSC')).toBe('LezardSC');
	});
});

describe('contactLinks', () => {
	it('lists the tiles in order', () => {
		expect(contactLinks('en', '', 'CV (PDF)').map((l) => l.id)).toEqual([
			'email',
			'linkedin',
			'github',
			'malt',
			'cv'
		]);
	});

	it('shows the email address and links it with mailto:', () => {
		const email = byId(contactLinks('en', '', 'CV'))['email'];
		expect(email.label).toBe('jocelynrenaultpro@gmail.com');
		expect(email.href).toBe('mailto:jocelynrenaultpro@gmail.com');
	});

	it('labels profiles with their handle and links them', () => {
		const links = byId(contactLinks('en', '', 'CV'));
		expect(links['linkedin']).toMatchObject({ label: 'jocelyn-renault', href: PROFILE.linkedin });
		expect(links['github']).toMatchObject({ label: 'LezardSC', href: PROFILE.github });
		expect(links['malt']).toMatchObject({ label: 'Malt', href: PROFILE.malt });
	});

	it('opens everything but email in a new tab', () => {
		const external = contactLinks('en', '', 'CV').map((l) => [l.id, l.external]);
		expect(external).toEqual([
			['email', false],
			['linkedin', true],
			['github', true],
			['malt', true],
			['cv', true]
		]);
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
