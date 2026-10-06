/**
 * The user's theme choice. `system` follows the device setting.
 *
 * `static/theme-init.js` applies the stored preference before first paint and must stay in sync
 * with this module (covered by `theme.spec.ts`).
 */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'iconic-theme';

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isPreference = (value: unknown): value is ThemePreference =>
	(THEME_PREFERENCES as readonly unknown[]).includes(value);

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
	if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
	return preference;
}

/** Reads the stored preference; storage can be missing or throw (e.g. in private browsing). */
export function readThemePreference(storage: PreferenceStorage | undefined): ThemePreference {
	try {
		const value = storage?.getItem(THEME_STORAGE_KEY);
		return isPreference(value) ? value : 'system';
	} catch {
		return 'system';
	}
}

/** Stores an explicit preference, or forgets it for `system`. Failures are ignored. */
export function writeThemePreference(
	storage: PreferenceStorage | undefined,
	preference: ThemePreference
): void {
	try {
		if (preference === 'system') storage?.removeItem(THEME_STORAGE_KEY);
		else storage?.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// The choice still applies for this visit.
	}
}
