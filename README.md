# Iconic

Turn any image into a clean logo, entirely in your browser: add padding, a black or white background, square it, resize it, and download it as PNG or JPEG.

See [`TASK.md`](./TASK.md) for the product brief.

## Development

Requires Node.js (24 LTS recommended) and pnpm.

```sh
pnpm install
pnpm dev
```

| Command       | Purpose                   |
| ------------- | ------------------------- |
| `pnpm dev`    | Start the dev server      |
| `pnpm build`  | Static build to `./build` |
| `pnpm check`  | Type-check (svelte-check) |
| `pnpm lint`   | Prettier check + ESLint   |
| `pnpm format` | Format with Prettier      |
| `pnpm test`   | Run unit tests (Vitest)   |

## AI agents

This repo is set up for Claude Code and Codex. Read [`AGENTS.md`](./AGENTS.md) for project instructions, MCP servers, and the installed agent skills.
