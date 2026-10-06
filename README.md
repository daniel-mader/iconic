# Iconic

Turn any image into a clean logo, entirely in your browser: add padding, a black or white background, square it, resize it, and download it as PNG or JPEG.

See [`TASK.md`](./TASK.md) for the product brief.

## Development

Requires Node.js (24 LTS recommended) and pnpm.

```sh
pnpm install
pnpm dev
```

| Command              | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `pnpm dev`           | Start the dev server                                     |
| `pnpm build`         | Static build to `./build`                                |
| `pnpm format`        | Format with Prettier                                     |
| `pnpm lint`          | Lint with ESLint                                         |
| `pnpm check`         | Type-check (svelte-check)                                |
| `pnpm test`          | Run unit tests (Vitest)                                  |
| `pnpm test:coverage` | Run unit tests with coverage thresholds                  |
| `pnpm validate`      | Run every CI check: format, lint, types, coverage, build |
| `pnpm audit`         | Check dependencies for known vulnerabilities             |

## Features

- Drop, choose, or paste an image, load one from an https link, or pick a [Dashboard Icon](https://dashboardicons.com).
- Trim empty margins, add padding, choose a transparent, white or black background, and square the logo.
- Pick a size preset (256, 512, 1024 px) or any size from 16 to 4096 px.
- Live proof preview and PNG or JPEG download, with the file size shown up front.
- Light and dark mode, following the device setting by default.

## Deployment

`pnpm build` writes a static site to `./build` that any static host can serve. The Content Security Policy ships as a `<meta>` tag, which can't express every protection, so configure the host to also send these headers:

```
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

## AI agents

This repo is set up for Claude Code and Codex. Read [`AGENTS.md`](./AGENTS.md) for project instructions, MCP servers, and the installed agent skills.
