import { en, type Dict } from './en';
import { fr } from './fr';
import type { Lang } from './lang';

export type { Dict };
export * from './lang';

export const dicts: Record<Lang, Dict> = { en, fr };
