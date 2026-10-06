import { fail, ok, type Result } from '#lib/result.ts';
import { fetchImage } from '#lib/source/image-source.ts';

/**
 * Dashboard Icons (https://dashboardicons.com, Apache-2.0) has no public API. Its icons live in
 * the homarr-labs/dashboard-icons GitHub repository, which jsDelivr serves with permissive CORS
 * headers, as the project itself recommends. `metadata.json` is the complete index; the repo's
 * `tree.json` is not kept up to date.
 */
export const DASHBOARD_ICONS_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';

export const DASHBOARD_ICONS_LICENSE_URL =
	'https://github.com/homarr-labs/dashboard-icons/blob/main/LICENSE';

/** Source formats; PNG and WebP renditions are generated from SVG sources. */
type IconFormat = 'svg' | 'png';

export interface DashboardIcon {
	name: string;
	/** The format the icon was contributed in, which is the best one to load. */
	base: IconFormat;
	aliases: string[];
	/** Variant names to try if the metadata promises a file that does not exist. */
	fallbacks: string[];
}

/** Icon names are interpolated into CDN URLs, so only allow plain file-name characters. */
const SAFE_NAME = /^[a-z\d][a-z\d._-]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Safe variant names from a `{ light, dark }` map, light first. */
function variantNames(variants: unknown): string[] {
	if (!isRecord(variants)) return [];
	return [variants.light, variants.dark].filter(
		(name): name is string => typeof name === 'string' && SAFE_NAME.test(name)
	);
}

/**
 * Turns the untrusted `metadata.json` index into icons, sorted by name. Color and wordmark
 * variants become icons of their own.
 */
export function parseIconIndex(json: unknown): DashboardIcon[] {
	if (!isRecord(json)) return [];

	const icons = new Map<string, DashboardIcon>();

	for (const [name, entry] of Object.entries(json)) {
		if (!SAFE_NAME.test(name) || !isRecord(entry)) continue;

		const base: IconFormat = entry.base === 'png' ? 'png' : 'svg';
		const aliases = Array.isArray(entry.aliases)
			? entry.aliases.filter((alias): alias is string => typeof alias === 'string')
			: [];
		const colors = variantNames(entry.colors).filter((variant) => variant !== name);
		const variants = [...colors, ...variantNames(entry.wordmark)];

		icons.set(name, { name, base, aliases, fallbacks: colors });
		for (const variant of variants) {
			if (!icons.has(variant)) icons.set(variant, { name: variant, base, aliases, fallbacks: [] });
		}
	}

	return [...icons.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z\d]/g, '');

/** Finds icons whose name or an alias contains the query, best matches first. */
export function searchIcons(icons: DashboardIcon[], query: string, limit = 48): DashboardIcon[] {
	const needle = normalize(query);
	if (!needle) return [];

	const rank = (icon: DashboardIcon) => {
		const name = normalize(icon.name);
		if (name === needle) return 0;
		if (name.startsWith(needle)) return 1;
		if (name.includes(needle)) return 2;
		return icon.aliases.some((alias) => normalize(alias).includes(needle)) ? 3 : -1;
	};

	return icons
		.map((icon) => ({ icon, rank: rank(icon) }))
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

/** CDN URLs to try for an icon, best first. */
export function iconCandidates(icon: DashboardIcon): URL[] {
	const formats: IconFormat[] = icon.base === 'png' ? ['png', 'svg'] : ['svg', 'png'];
	return [icon.name, ...icon.fallbacks].flatMap((name) =>
		formats.map((format) => new URL(`${DASHBOARD_ICONS_CDN}/${format}/${name}.${format}`))
	);
}

interface FetchOptions {
	fetch: typeof globalThis.fetch;
	signal?: AbortSignal;
}

/** Downloads an icon, trying each candidate URL until one works. Aborts are rethrown. */
export async function fetchDashboardIcon(
	icon: DashboardIcon,
	options: FetchOptions
): Promise<Result<Blob>> {
	let result: Result<Blob> = fail('That icon is not available.');
	for (const url of iconCandidates(icon)) {
		result = await fetchImage(url, options);
		if (result.ok) return result;
	}
	return result;
}

/** Loads the list of all icons from the CDN. Aborts are rethrown. */
export async function fetchIconIndex({
	fetch,
	signal
}: FetchOptions): Promise<Result<DashboardIcon[]>> {
	try {
		const response = await fetch(new URL(`${DASHBOARD_ICONS_CDN}/metadata.json`), {
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
