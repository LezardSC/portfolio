import { newestFirst, type Hackathon, type Job } from '$lib/experience';
import { fill, plural, type Plural } from '$lib/i18n/format';
import type { Lang, Localized } from '$lib/i18n/lang';

/** A hand-written row of the hero's "At a glance" card. */
export type GlanceRow = {
	label: Localized;
	value: Localized;
	/** Shorter value for the phone tiles. */
	short?: Localized;
	/** Full-width tile on phones. */
	wide?: true;
};

/**
 * A row computed from the data: `latestRole` = the newest job ("role - company", short =
 * company; `roleShort` / `companyShort` win when set), `hackathons` = "2 wins, 5 podiums".
 * Left out when there is no job / no hackathon.
 */
export type GlanceAuto = { label: Localized; auto: 'latestRole' | 'hackathons'; wide?: true };

export type GlanceEntry = GlanceRow | GlanceAuto;

/** A row ready to render. */
export type GlanceItem = { label: string; value: string; short?: string; wide: boolean };

export type GlanceText = { tally: string; wins: Plural; podiums: Plural };

export function glanceRows(
	entries: readonly GlanceEntry[],
	data: { jobs: readonly Job[]; hackathons: readonly Hackathon[] },
	lang: Lang,
	t: GlanceText
): GlanceItem[] {
	return entries.flatMap((e): GlanceItem[] => {
		const label = e.label[lang];
		const wide = e.wide === true;
		if (!('auto' in e)) return [{ label, value: e.value[lang], short: e.short?.[lang], wide }];
		if (e.auto === 'latestRole') {
			const job = newestFirst(data.jobs)[0];
			if (!job) return [];
			const company = job.companyShort ?? job.company;
			const role = (job.roleShort ?? job.role)[lang];
			return [{ label, value: `${role} | ${company}`, short: company, wide }];
		}
		const podiums = data.hackathons.length;
		if (podiums === 0) return [];
		const wins = data.hackathons.filter((h) => h.medal === 1).length;
		const p = plural(podiums, t.podiums, lang);
		const value = wins === 0 ? p : fill(t.tally, { wins: plural(wins, t.wins, lang), podiums: p });
		return [{ label, value, wide }];
	});
}
