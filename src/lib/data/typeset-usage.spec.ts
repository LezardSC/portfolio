import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const DIR = fileURLToPath(new URL('.', import.meta.url));
const dataFiles = readdirSync(DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));

describe('typeset() in data files', () => {
	// `const X: Project[] = typeset([...])` infers the type from the literal, so TypeScript stops
	// flagging misspelled fields (`hiden: true` would compile). Write `typeset<Project[]>([...])`.
	it.each(dataFiles)('%s gives every typeset() call its type', (file) => {
		const src = readFileSync(DIR + file, 'utf8');
		const untyped = [...src.matchAll(/^export const \w+: [^=]+= typeset\(/gm)];
		expect(untyped.map((m) => m[0])).toEqual([]);
	});
});
