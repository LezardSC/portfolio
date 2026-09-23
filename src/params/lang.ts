import type { ParamMatcher } from '@sveltejs/kit';
import { isLang, type Lang } from '$lib/i18n/lang';

export const match = ((param: string): param is Lang => isLang(param)) satisfies ParamMatcher;
