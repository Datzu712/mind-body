# Mind & Body Dashboard (prototype)

![alt text](src/public/preview.png)

A gym and fitness center management desktop application built with Next.js and Tauri.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript
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

## Development

Start the web server:

```bash
pnpm dev
```

Start the desktop app (Tauri):

```bash
pnpm tauri dev
```

## Notes

### Tiling window managers (Hyprland, i3, etc.)

If the app renders as a black screen, disable GPU compositing:

```bash
WEBKIT_DISABLE_COMPOSITING_MODE=1 pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

Outputs the desktop installer to `src-tauri/target/release/bundle/`.

## Project Structure

```
src/                # Frontend (Next.js)
  app/              # Routes (App Router)
  components/       # UI components
  features/         # Feature modules
  hooks/            # Custom hooks
  lib/              # Utilities
src-tauri/          # Desktop backend (Rust)
```
