import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
	THEME_PREFERENCES,
	readThemePreference,
	resolveTheme,
	writeThemePreference,
	type ThemePreference
} from './theme.ts';

function memoryStorage(initial: Record<string, string> = {}) {
	const items = new Map(Object.entries(initial));
	return {
		items,
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value),
		removeItem: (key: string) => void items.delete(key)
	};
}

const throwingStorage = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('QuotaExceededError');
	},
	removeItem: () => {
		throw new Error('SecurityError');
	}
};

describe('resolveTheme', () => {
	it('follows the device setting for the system preference', () => {
		expect(resolveTheme('system', true)).toBe('dark');
		expect(resolveTheme('system', false)).toBe('light');
	});

	it('overrides the device setting for explicit preferences', () => {
		expect(resolveTheme('light', true)).toBe('light');
		expect(resolveTheme('dark', false)).toBe('dark');
	});
});

describe('theme preference persistence', () => {
	it.each(THEME_PREFERENCES)('round-trips "%s"', (preference) => {
		const storage = memoryStorage();

		writeThemePreference(storage, preference);

		expect(readThemePreference(storage)).toBe(preference);
	});

	it('forgets the stored value when switching back to system', () => {
		const storage = memoryStorage();
		writeThemePreference(storage, 'dark');

		writeThemePreference(storage, 'system');

		expect(storage.items.size).toBe(0);
	});

	it('defaults to system for missing, unknown or unreadable values', () => {
		expect(readThemePreference(memoryStorage())).toBe('system');
		expect(readThemePreference(memoryStorage({ 'iconic-theme': 'sepia' }))).toBe('system');
		expect(readThemePreference(throwingStorage)).toBe('system');
		expect(readThemePreference(undefined)).toBe('system');
	});

	it('ignores storage that cannot be written', () => {
		expect(() => writeThemePreference(throwingStorage, 'dark')).not.toThrow();
		expect(() => writeThemePreference(throwingStorage, 'system')).not.toThrow();
		expect(() => writeThemePreference(undefined, 'dark')).not.toThrow();
	});
});

describe('pre-paint theme script (static/theme-init.js)', () => {
	const script = readFileSync(new URL('../../../static/theme-init.js', import.meta.url), 'utf8');

	function runScript(preference: ThemePreference, prefersDark: boolean) {
		const storage = memoryStorage();
		const root = { dataset: {} as Record<string, string> };
		writeThemePreference(storage, preference);
		runInNewContext(script, {
			localStorage: storage,
			matchMedia: () => ({ matches: prefersDark }),
			document: { documentElement: root }
		});
		return root.dataset.theme;
	}

	it.each([
		['system', true],
		['system', false],
		['light', true],
		['dark', false]
	] as const)(
		'applies the same theme as resolveTheme for %s (prefers dark: %s)',
		(preference, dark) => {
			expect(runScript(preference, dark)).toBe(resolveTheme(preference, dark));
		}
	);

	it('falls back to the device setting when storage is unavailable', () => {
		const root = { dataset: {} as Record<string, string> };
		runInNewContext(script, {
			get localStorage() {
				throw new Error('SecurityError');
			},
			matchMedia: () => ({ matches: true }),
			document: { documentElement: root }
		});

		expect(root.dataset.theme).toBe('dark');
	});
});
