# Iconic

A small, fully client-side web app that turns an image into a logo: padding, black/white background, squaring, resizing, live preview, PNG/JPEG download. The product brief lives in `TASK.md`.

This file is the single source of agent instructions. Claude Code loads it via `.claude/CLAUDE.md`; Codex reads it directly.

## Stack

- SvelteKit + Svelte 5 (runes mode enforced in `vite.config.ts`), TypeScript
- `@sveltejs/adapter-static`, every route prerendered (`src/routes/+layout.ts`). There is no server: all image processing happens in the browser.
- Tailwind CSS v4 (`src/routes/layout.css`)
- Vitest (unit), ESLint, Prettier, svelte-check
- Package manager: **pnpm**

## Commands

```sh
pnpm dev          # dev server
pnpm check        # svelte-check + types
pnpm lint         # prettier --check + eslint
pnpm format       # prettier --write
pnpm test         # vitest, single run
pnpm build        # static build to ./build
```

Before calling work done, run `pnpm format && pnpm lint && pnpm check && pnpm test && pnpm build`.

## Rules

- **No new dependencies without asking.** Every additional library (runtime or dev) must be discussed with the developer first. Prefer platform APIs (Canvas, `fetch`, `Blob`, File API).
- **Security matters.** Treat every user-supplied image and URL as untrusted. No `{@html}` with untrusted content, and no `eval`. Validate MIME types and sizes, and keep a strict CSP in mind.
- Import from `src/lib` via the `#lib/*` subpath import.
- Keep image-processing logic in plain TS modules under `src/lib` so it can be unit-tested without the DOM. Keep components thin.

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
