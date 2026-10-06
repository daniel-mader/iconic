import { fail, ok, type Result } from '#lib/result.ts';

/**
 * Dashboard Icons (https://dashboardicons.com) has no public API. Its icons live in the
 * homarr-labs/dashboard-icons GitHub repository (Apache-2.0), which jsDelivr serves with
 * permissive CORS headers, including a `tree.json` index of every file.
 */
export const DASHBOARD_ICONS_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';

/** Ordered by preference: SVG scales without loss. */
const ICON_FORMATS = ['svg', 'png', 'webp'] as const;

export type IconFormat = (typeof ICON_FORMATS)[number];

export interface DashboardIcon {
	name: string;
	formats: IconFormat[];
}

/** Icon names are interpolated into CDN URLs, so only allow plain file-name characters. */
const SAFE_NAME = /^[a-z\d][a-z\d._-]*$/;

/** Turns the untrusted `tree.json` index into icons, sorted by name. */
export function parseIconIndex(json: unknown): DashboardIcon[] {
	if (typeof json !== 'object' || json === null) return [];

	const icons = new Map<string, Set<IconFormat>>();

	for (const format of ICON_FORMATS) {
		const files: unknown = (json as Record<string, unknown>)[format];
		if (!Array.isArray(files)) continue;

		for (const file of files) {
			if (typeof file !== 'string' || !file.endsWith(`.${format}`)) continue;
			const name = file.slice(0, -(format.length + 1));
			if (!SAFE_NAME.test(name)) continue;
			icons.set(name, (icons.get(name) ?? new Set()).add(format));
		}
	}

	return [...icons]
		.map(([name, formats]) => ({ name, formats: ICON_FORMATS.filter((f) => formats.has(f)) }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z\d]/g, '');

/** Finds icons whose name contains the query, best matches first. */
export function searchIcons(icons: DashboardIcon[], query: string, limit = 48): DashboardIcon[] {
	const needle = normalize(query);
	if (!needle) return [];

	const rank = (name: string) => {
		const haystack = normalize(name);
		if (haystack === needle) return 0;
		if (haystack.startsWith(needle)) return 1;
		return haystack.includes(needle) ? 2 : -1;
	};

	return icons
		.map((icon) => ({ icon, rank: rank(icon.name) }))
		.filter((match) => match.rank >= 0)
		.sort(
			(a, b) =>
				a.rank - b.rank ||
				a.icon.name.length - b.icon.name.length ||
				a.icon.name.localeCompare(b.icon.name)
		)
		.slice(0, limit)
		.map((match) => match.icon);
}

/** The CDN URL of an icon, in the given format or the best one available. */
export function iconUrl(icon: DashboardIcon, format?: IconFormat): URL {
	const chosen = format ?? ICON_FORMATS.find((f) => icon.formats.includes(f)) ?? 'png';
	return new URL(`${DASHBOARD_ICONS_CDN}/${chosen}/${icon.name}.${chosen}`);
}

/** Loads the list of all icons from the CDN. Aborts are rethrown. */
export async function fetchIconIndex({
	fetch,
	signal
}: {
	fetch: typeof globalThis.fetch;
	signal?: AbortSignal;
}): Promise<Result<DashboardIcon[]>> {
	try {
		const response = await fetch(new URL(`${DASHBOARD_ICONS_CDN}/tree.json`), {
			credentials: 'omit',
			referrerPolicy: 'no-referrer',
			signal
		});
		if (!response.ok) return fail(`Dashboard Icons are unavailable (${response.status}).`);
		return ok(parseIconIndex(await response.json()));
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') throw error;
		return fail('Could not load Dashboard Icons. Check your connection and try again.');
	}
}
