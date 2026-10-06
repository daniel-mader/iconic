import { describe, expect, it, vi } from 'vitest';
import {
	fetchDashboardIcon,
	fetchIconIndex,
	iconCandidates,
	parseIconIndex,
	searchIcons,
	type DashboardIcon
} from './dashboard-icons.ts';

const CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';

const icon = (name: string, overrides: Partial<DashboardIcon> = {}): DashboardIcon => ({
	name,
	base: 'svg',
	aliases: [],
	fallbacks: [],
	...overrides
});

describe('parseIconIndex', () => {
	it('lists every icon with its source format and aliases, sorted by name', () => {
		const index = parseIconIndex({
			rabbitmq: { base: 'svg', aliases: ['Message Broker'], categories: [] },
			'3xui': { base: 'png', aliases: [], categories: [] }
		});

		expect(index).toEqual([
			{ name: '3xui', base: 'png', aliases: [], fallbacks: [] },
			{ name: 'rabbitmq', base: 'svg', aliases: ['Message Broker'], fallbacks: [] }
		]);
	});

	it('lists color and wordmark variants as icons of their own', () => {
		const index = parseIconIndex({
			shelly: {
				base: 'svg',
				aliases: ['Smart Home'],
				colors: { light: 'shelly-light', dark: 'shelly-dark' },
				wordmark: { light: 'shelly-wordmark-light' }
			}
		});

		expect(index.map((i) => i.name)).toEqual([
			'shelly',
			'shelly-dark',
			'shelly-light',
			'shelly-wordmark-light'
		]);
		expect(index[1]).toEqual({
			name: 'shelly-dark',
			base: 'svg',
			aliases: ['Smart Home'],
			fallbacks: []
		});
	});

	it('falls back to color variants for icons that may lack a plain file', () => {
		const [dagster] = parseIconIndex({
			dagster: {
				base: 'svg',
				aliases: [],
				colors: { dark: 'dagster-dark', light: 'dagster-light' }
			}
		});

		expect(dagster.fallbacks).toEqual(['dagster-light', 'dagster-dark']);
	});

	it('does not list a variant twice when it shares the plain name', () => {
		const index = parseIconIndex({
			traccar: { base: 'svg', aliases: [], colors: { dark: 'traccar-dark', light: 'traccar' } }
		});

		expect(index.map((i) => i.name)).toEqual(['traccar', 'traccar-dark']);
		expect(index[0].fallbacks).toEqual(['traccar-dark']);
	});

	it('skips names that are unsafe to put into a URL', () => {
		const index = parseIconIndex({
			'../secret': { base: 'svg', aliases: [] },
			'a/b': { base: 'svg', aliases: [] },
			Upper: { base: 'svg', aliases: [] },
			ok: { base: 'svg', aliases: [], colors: { dark: '../evil', light: 'ok-light' } }
		});

		expect(index.map((i) => i.name)).toEqual(['ok', 'ok-light']);
		expect(index[0].fallbacks).toEqual(['ok-light']);
	});

	it('defaults unknown formats to SVG and ignores malformed aliases', () => {
		const [entry] = parseIconIndex({ odd: { base: 'gif', aliases: ['Fine', 42, null] } });

		expect(entry).toEqual({ name: 'odd', base: 'svg', aliases: ['Fine'], fallbacks: [] });
	});

	it.each([null, 'metadata', [], { icon: 'not an object' }])(
		'treats malformed index %j as empty',
		(json) => {
			expect(parseIconIndex(json)).toEqual([]);
		}
	);
});

describe('searchIcons', () => {
	const icons = [
		icon('home-assistant'),
		icon('assistant'),
		icon('github'),
		icon('github-dark'),
		icon('gitea'),
		icon('my-github-mirror'),
		icon('rabbitmq', { aliases: ['Message Broker'] })
	];
	const names = (results: DashboardIcon[]) => results.map((i) => i.name);

	it('ranks exact matches, then prefix matches, then other matches', () => {
		expect(names(searchIcons(icons, 'github'))).toEqual([
			'github',
			'github-dark',
			'my-github-mirror'
		]);
	});

	it('ignores case, spaces and punctuation', () => {
		expect(names(searchIcons(icons, '  Home Assistant '))).toEqual(['home-assistant']);
	});

	it('finds icons by alias, after name matches', () => {
		expect(names(searchIcons(icons, 'message broker'))).toEqual(['rabbitmq']);
		expect(names(searchIcons([...icons, icon('brokerage')], 'broker'))).toEqual([
			'brokerage',
			'rabbitmq'
		]);
	});

	it('limits the number of results', () => {
		expect(searchIcons(icons, 'git', 2)).toHaveLength(2);
	});

	it('returns nothing for an empty query', () => {
		expect(searchIcons(icons, ' - ')).toEqual([]);
	});
});

describe('iconCandidates', () => {
	it('tries the source format first, then the other one', () => {
		expect(iconCandidates(icon('github')).map(String)).toEqual([
			`${CDN}/svg/github.svg`,
			`${CDN}/png/github.png`
		]);
		expect(iconCandidates(icon('3xui', { base: 'png' })).map(String)).toEqual([
			`${CDN}/png/3xui.png`,
			`${CDN}/svg/3xui.svg`
		]);
	});

	it('tries fallback variants after the plain name', () => {
		const dagster = icon('dagster', { fallbacks: ['dagster-light'] });

		expect(iconCandidates(dagster).map(String)).toEqual([
			`${CDN}/svg/dagster.svg`,
			`${CDN}/png/dagster.png`,
			`${CDN}/svg/dagster-light.svg`,
			`${CDN}/png/dagster-light.png`
		]);
	});
});

describe('fetchDashboardIcon', () => {
	const svg = () =>
		new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', {
			headers: { 'content-type': 'image/svg+xml' }
		});
	const missing = () => new Response('Not found', { status: 404 });

	it('loads the first candidate that exists', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>((url) =>
			Promise.resolve(String(url).endsWith('/svg/dagster-light.svg') ? svg() : missing())
		);

		const result = await fetchDashboardIcon(icon('dagster', { fallbacks: ['dagster-light'] }), {
			fetch
		});

		expect(result.ok && result.value.type).toBe('image/svg+xml');
		expect(fetch).toHaveBeenCalledTimes(3);
	});

	it('reports a failure when no candidate exists', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(missing()));

		expect(await fetchDashboardIcon(icon('gone'), { fetch })).toMatchObject({ ok: false });
	});

	it('lets aborts propagate without trying further candidates', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() =>
			Promise.reject(new DOMException('aborted', 'AbortError'))
		);

		await expect(fetchDashboardIcon(icon('github'), { fetch })).rejects.toThrow('aborted');
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});

describe('fetchIconIndex', () => {
	it('loads and parses the metadata index from the CDN', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() =>
			Promise.resolve(Response.json({ github: { base: 'svg', aliases: [] } }))
		);

		const result = await fetchIconIndex({ fetch });

		expect(result).toEqual({
			ok: true,
			value: [{ name: 'github', base: 'svg', aliases: [], fallbacks: [] }]
		});
		expect(fetch).toHaveBeenCalledWith(
			new URL(`${CDN}/metadata.json`),
			expect.objectContaining({ credentials: 'omit' })
		);
	});

	it('reports HTTP errors', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() =>
			Promise.resolve(new Response('', { status: 503 }))
		);

		expect(await fetchIconIndex({ fetch })).toMatchObject({ ok: false });
	});

	it('reports network errors and invalid JSON', async () => {
		const offline = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError('offline')));
		const garbage = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(new Response('{')));

		expect(await fetchIconIndex({ fetch: offline })).toMatchObject({ ok: false });
		expect(await fetchIconIndex({ fetch: garbage })).toMatchObject({ ok: false });
	});

	it('lets aborts propagate', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() =>
			Promise.reject(new DOMException('aborted', 'AbortError'))
		);

		await expect(fetchIconIndex({ fetch })).rejects.toThrow('aborted');
	});
});
