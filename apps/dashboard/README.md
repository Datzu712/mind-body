# Mind & Body Dashboard

![alt text](src/public/preview.png)

A gym and fitness center management desktop application built with Vite, TanStack Router and Tauri.

## Stack

- **Frontend:** Vite, React 19, TanStack Router, TypeScript
- **UI:** Tailwind CSS, Radix UI, Shadcn UI
- **Desktop:** Tauri 2.0 (Rust)

## Requirements

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (for Tauri)

## Installation

```bash
pnpm install
```

## Environment variables

Copy `.env.example` to `.env`:

```env
# Base URL of the REST API. The Vite dev server proxies `/api` to this target,
# so use your machine's LAN IP (not localhost) when testing from another device.
VITE_API_BASE_URL=http://localhost:3000
```

The dev server runs on a fixed port (`3000`, required by Tauri) and proxies
`/api` requests to `VITE_API_BASE_URL`.

## Development

Start the web server:

```bash
pnpm dev
```

Start the desktop app (Tauri):

```bash
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

Outputs the desktop installer to `src-tauri/target/release/bundle/`.

## Project Structure

```
src/                # Frontend (Vite + TanStack Router)
  routes/           # Routes
  components/       # UI components
  features/         # Feature modules
  hooks/            # Custom hooks
  lib/              # Utilities
src-tauri/          # Desktop backend (Rust)
```
