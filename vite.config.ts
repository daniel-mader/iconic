import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

/** Dashboard Icons are served from jsDelivr (see src/lib/dashboard-icons). */
const ICON_CDN = 'https://cdn.jsdelivr.net';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Prerendered pages get this policy as a <meta> tag; SvelteKit adds hashes for its own
			// inline scripts. Image links can point anywhere, hence `connect-src https:`. Inline
			// style attributes (from app.html and `style:` directives in prerendered HTML) are allowed,
			// inline <style> elements are not.
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self'],
					'style-src-attr': ['unsafe-inline'],
					'img-src': ['self', 'blob:', 'data:', ICON_CDN],
					'font-src': ['self'],
					'connect-src': ['self', 'https:'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['none'],
					'worker-src': ['none'],
					'upgrade-insecure-requests': true
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/lib/**/*.ts'],
			exclude: [
				'src/lib/**/*.spec.ts',
				// Browser-only glue (canvas, image decoding, runes state) needs a real browser.
				'src/lib/browser/**',
				'src/lib/**/*.svelte.ts'
			],
			reporter: ['text', 'html', 'json-summary'],
			thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 }
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
