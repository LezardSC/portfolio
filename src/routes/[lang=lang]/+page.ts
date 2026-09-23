import { error } from '@sveltejs/kit';
import { isLang } from '$lib/i18n/lang';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => [{ lang: 'en' }, { lang: 'fr' }];

export const load: PageLoad = ({ params }) => {
	if (!isLang(params.lang)) error(404);
	return { lang: params.lang };
};
