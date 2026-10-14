import { describe, expect, it } from 'vitest';
import { savePendingSection, takePendingSection } from './sections';

describe('pending section hand-off', () => {
	const memory = () => {
		const data = new Map<string, string>();
		return {
			getItem: (k: string) => data.get(k) ?? null,
			setItem: (k: string, v: string) => void data.set(k, v),
			removeItem: (k: string) => void data.delete(k)
		};
	};
	const fail = () => {
		throw new Error('blocked');
	};
	const broken = { getItem: fail, setItem: fail, removeItem: fail };

	it('returns the saved section once, then nothing', () => {
		const s = memory();
		savePendingSection(() => s, 'projects');
		expect(takePendingSection(() => s)).toBe('projects');
		expect(takePendingSection(() => s)).toBeNull();
	});

	it('saves nothing for the hero (null)', () => {
		const s = memory();
		savePendingSection(() => s, 'projects');
		savePendingSection(() => s, null);
		expect(takePendingSection(() => s)).toBeNull();
	});

	it('ignores a value that is not a section id', () => {
		const s = memory();
		s.setItem('pending-section', 'nope');
		expect(takePendingSection(() => s)).toBeNull();
	});

	it('never throws when storage is blocked', () => {
		expect(() => savePendingSection(() => broken, 'about')).not.toThrow();
		expect(takePendingSection(() => broken)).toBeNull();
	});

	it('never throws when merely accessing storage throws', () => {
		expect(() => savePendingSection(fail, 'about')).not.toThrow();
		expect(takePendingSection(fail)).toBeNull();
	});
});
