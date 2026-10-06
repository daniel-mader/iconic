# Iconic

A small, fully client-side web app that turns an image into a logo: padding, black/white background, squaring, resizing, live preview, PNG/JPEG download. The product brief lives in `TASK.md`.

This file is the single source of agent instructions. Claude Code loads it via `.claude/CLAUDE.md`; Codex reads it directly.

## Stack

- SvelteKit 3 + Svelte 5 (runes mode enforced in `vite.config.ts`), TypeScript
- `@sveltejs/adapter-static`, every route prerendered (`src/routes/+layout.ts`). There is no server: all image processing happens in the browser.
- Tailwind CSS v4. Design tokens (prepress palette, light/dark) live in `src/routes/layout.css`.
- Vitest with V8 coverage, ESLint, Prettier, svelte-check
- Package manager: **pnpm** (version pinned in `package.json#packageManager`), Node from `.node-version`

SvelteKit 3 differs from older docs and training data:

- Kit options (adapter, CSP, …) go into `sveltekit({ … })` in `vite.config.ts`. There is no `svelte.config.js`.
- `$app/environment` is now `$app/env`.
- Imports through `#lib/*` (package.json `imports`) need the file extension: `#lib/logo/plan.ts`, `#lib/editor.svelte.ts`.

## Architecture

```
src/lib/
  logo/             pure logic: options, planLogo (layout), findContentBounds (trim), drawLogo
  source/           image-source.ts: file/URL validation, fetchImage; svg.ts: SVG sizing
  dashboard-icons/  icon index parsing, search, jsDelivr URLs
  export/           formats, background rules, file names, byte formatting
  theme/            theme preference (mirrored by static/theme-init.js)
  browser/          DOM/canvas glue: decodeImage, renderLogo, encodeLogo, downloadBlob
  editor.svelte.ts  Editor: runes state tying the modules together
  components/       thin Svelte components
```

The vocabulary is defined in `GLOSSARY.md`, and decisions are recorded in `docs/adr/`.

## Commands

```sh
pnpm dev            # dev server
pnpm format         # prettier --write
pnpm format:check   # prettier --check
pnpm lint           # eslint
pnpm check          # svelte-check + types
pnpm test           # vitest, single run
pnpm test:coverage  # vitest with coverage thresholds (see vite.config.ts)
pnpm build          # static build to ./build
pnpm validate       # everything CI runs, in order
pnpm audit          # known vulnerabilities in dependencies
```

Before calling work done, run `pnpm format && pnpm validate`. CI (`.github/workflows/`) runs the same checks on every PR, plus a dependency audit, which also runs weekly.

## Rules

- **No new dependencies without asking.** Every additional library (runtime or dev) must be discussed with the developer first. Prefer platform APIs (Canvas, `fetch`, `Blob`, File API).
- **Security matters.** Treat every user-supplied image and URL as untrusted. No `{@html}` with untrusted content, and no `eval`. Validate MIME types and sizes. A strict CSP is configured in `vite.config.ts`. Extend it only deliberately, and never with inline scripts (see `static/theme-init.js` for the pattern).
- Import from `src/lib` via the `#lib/*` subpath import.
- Keep logic in plain TS modules under `src/lib`, tested with Vitest in Node. `src/lib/browser/` and `*.svelte.ts` are thin glue, excluded from coverage. Keep components thin.
- Write tests at the public interface of a module (see the `tdd` skill). Inject `fetch` instead of mocking globals.

## Svelte tooling

The Svelte MCP server is configured for Claude Code (`.mcp.json`) and Codex (`.codex/config.toml`). It exposes `list-sections`, `get-documentation`, `svelte-autofixer`, and `playground-link`.

- Look up Svelte/SvelteKit docs with `list-sections` → `get-documentation` rather than relying on memory.
- Run `svelte-autofixer` on every `.svelte` / `.svelte.ts` file you write until it reports no issues.
- Don't use `playground-link` for code that was written to project files.
- If MCP is unavailable, the `svelte-code-writer` skill explains the equivalent `npx @sveltejs/mcp` CLI.

## Agent skills

Skills live in `.agents/skills/` (symlinked into `.claude/skills/`) and are managed with `npx skills` (pinned in `skills-lock.json`; update with `npx skills update`). They come from [mattpocock/skills](https://github.com/mattpocock/skills) and [sveltejs/ai-tools](https://github.com/sveltejs/ai-tools). Don't edit them in place unless you mean to fork them.

### Issue tracker

Issues and specs are local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles are used as-is (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
