import { describe, expect, it, vi } from 'vitest';
import {
	fetchIconIndex,
	iconUrl,
	parseIconIndex,
	searchIcons,
	type DashboardIcon
} from './dashboard-icons.ts';

const icon = (name: string, formats: DashboardIcon['formats'] = ['svg', 'png']) => ({
	name,
	formats
});

describe('parseIconIndex', () => {
	it('groups files by icon name, listing the formats each icon is available in', () => {
		const index = parseIconIndex({
			png: ['github.png', 'caldera.png'],
			svg: ['github.svg'],
			webp: ['github.webp', 'caldera.webp']
		});

		expect(index).toEqual([
			{ name: 'caldera', formats: ['png', 'webp'] },
			{ name: 'github', formats: ['svg', 'png', 'webp'] }
		]);
	});

	it('skips files whose extension does not match their format', () => {
		expect(parseIconIndex({ svg: ['assetgrid.png'], png: [] })).toEqual([]);
	});

	it('skips names that are unsafe to put into a URL', () => {
		const index = parseIconIndex({
			png: ['../secret.png', 'a/b.png', 'Upper.png', '%2e%2e.png', '.hidden.png', 'ok-1.2_x.png']
		});

		expect(index.map((i) => i.name)).toEqual(['ok-1.2_x']);
	});

	it.each([null, 'tree', [], { png: 'github.png' }, { png: [42] }])(
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
		icon('my-github-mirror')
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

	it('limits the number of results', () => {
		expect(searchIcons(icons, 'git', 2)).toHaveLength(2);
	});

	it('returns nothing for an empty query', () => {
		expect(searchIcons(icons, ' - ')).toEqual([]);
	});
});

describe('iconUrl', () => {
	it('prefers SVG because it scales without loss', () => {
		expect(iconUrl(icon('github')).href).toBe(
			'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg'
		);
	});

	it('falls back to PNG, then WebP', () => {
		expect(iconUrl(icon('caldera', ['webp', 'png'])).pathname).toMatch(/\/png\/caldera\.png$/);
		expect(iconUrl(icon('only-webp', ['webp'])).pathname).toMatch(/\/webp\/only-webp\.webp$/);
	});

	it('builds a URL for a requested format', () => {
		expect(iconUrl(icon('github'), 'png').pathname).toMatch(/\/png\/github\.png$/);
	});
});

describe('fetchIconIndex', () => {
	it('loads and parses the index from the CDN', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() =>
			Promise.resolve(Response.json({ png: ['github.png'] }))
		);

		const result = await fetchIconIndex({ fetch });

		expect(result).toEqual({ ok: true, value: [{ name: 'github', formats: ['png'] }] });
		expect(fetch).toHaveBeenCalledWith(
			new URL('https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/tree.json'),
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
