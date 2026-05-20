# Mind & Body

[![CI](https://github.com/Datzu712/mind-body/actions/workflows/ci.yml/badge.svg)](https://github.com/Datzu712/mind-body/actions/workflows/ci.yml)

Monorepo for the Mind & Body gym management platform, built with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/).

## Apps

_`mab` stands for Mind & Body btw_

| App              | Description                 | Stack                                    |
| ---------------- | --------------------------- | ---------------------------------------- |
| `@mab/dashboard` | Admin dashboard desktop app | Next.js 16, Tauri 2, Tailwind, shadcn/ui |
| `@mab/mobile`    | Mobile app for gym members  | Expo 55, React Native 0.85, Expo Router  |

## Requirements

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 11.X.X
- [Rust](https://rustup.rs/) >= 1.8X (for Tauri desktop builds)

## Getting started

```sh
pnpm install
```

## Development

Run all apps in parallel (at the moment only the dashboard with nextjs dev server):

```sh
pnpm dev
```

Run a specific app:

```sh
pnpm --filter=@mab/dashboard dev
pnpm --filter=@mab/mobile start
```

Run the dashboard as a Tauri desktop app:

```sh
pnpm --filter=@mab/dashboard exec tauri dev
```

## Common tasks

```sh
pnpm lint          # ESLint across all apps
pnpm check-types   # TypeScript check across all apps
pnpm format        # Prettier format
pnpm format:check  # Prettier check
pnpm build         # Build all apps
```

## Remote caching

Turborepo remote cache is configured via Vercel. Set `TURBO_TOKEN` and `TURBO_TEAM` in your environment or CI secrets to enable it.

```sh
pnpm exec turbo login
pnpm exec turbo link
```

## TODO

- [ ] Separating Tauri from Next in different apps
- [ ] Change nextj.js to vite + tanstack router
- [ ] Add CD for mobile (EAS)
