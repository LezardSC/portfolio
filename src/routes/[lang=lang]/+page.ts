import { error } from '@sveltejs/kit';
import { dicts, isLang, LANGS } from '$lib/i18n';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params, data }) => {
	if (!isLang(params.lang)) error(404);
	return { ...data, lang: params.lang, t: dicts[params.lang] };
};
