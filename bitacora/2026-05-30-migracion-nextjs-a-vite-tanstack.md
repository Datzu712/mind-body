# Bitácora — Migración del dashboard: Next.js → Vite + TanStack Router

- **Fecha:** 2026-05-30
- **Autor:** Aarón (mayorgazamoraaaron@gmail.com)
- **Ámbito:** `apps/dashboard`
- **Commit de la migración:** `360c475`

## Objetivo

Cambiar el framework de la app `apps/dashboard` de **Next.js (App Router, `output: export`)**
a **Vite + TanStack Router** con enrutado file-based, manteniendo las mismas URLs y la
integración con Tauri.

## Cambios realizados

### Configuración
- Nuevo `vite.config.ts` con los plugins `@vitejs/plugin-react` y
  `@tanstack/router-plugin` (file-based routing, `autoCodeSplitting`).
- Servidor de desarrollo en el puerto **3000** (`strictPort`) para Tauri.
- Salida de build en `dist/`.
- Nuevo `index.html` en la raíz de la app como punto de entrada.
- `postcss.config.mjs` se mantiene (Tailwind v4).
- `tsr.config.json` para el generador de rutas de TanStack.
- `tsconfig.json`: se elimina `next-env.d.ts`/`next.config.mjs` del `include`.
- Nuevo `src/vite-env.d.ts`.

### Enrutado
- Se reemplaza `src/app/` (App Router) por `src/routes/` (file-based):
  - `src/routes/index.tsx` → landing (`/`)
  - `src/routes/dashboard/route.tsx` → layout del dashboard (sidebar)
  - `src/routes/dashboard/index.tsx` → `/dashboard`
  - `audit`, `backups`, `catalog`, `reports`, `settings`, `users` → `/dashboard/*`
  - `src/routes/__root.tsx` → raíz (Outlet + Toaster de sonner)
- `src/routeTree.gen.ts` generado por el CLI de TanStack Router.

### APIs de Next reemplazadas
- `next/link` → `Link` de `@tanstack/react-router` (`href` → `to`).
- `usePathname` (next/navigation) → `useLocation()` de TanStack Router.
- Breadcrumbs del header ahora navegan client-side (sin recarga).
- Se quita el tipo `Metadata`; título e iconos pasan a `index.html`.

### Dependencias
- Se eliminan: `next`, `@vercel/analytics` y `next.config.mjs`.
- Se conserva `next-themes` (es agnóstico al framework).
- Se agregan: `@tanstack/react-router`, `@tanstack/router-plugin`,
  `@vitejs/plugin-react`, `vite`.

### Tauri
- `src-tauri/tauri.conf.json`: `frontendDist` `../out` → `../dist`.
- `turbo.json`: se añaden `dist/**` y `out/**` a los outputs de build.
- `.gitignore`: se ignora `/dist`.

## Verificación
- Se generó y validó `routeTree.gen.ts` (todas las rutas anidan bajo `/dashboard`).
- Se confirmó que no queda ninguna referencia a `next/` en el código fuente.

## Pendiente / pasos para correr el proyecto
1. Ejecutar `pnpm install` en la raíz (cambiaron dependencias; el `pnpm-lock.yaml`
   debe regenerarse).
2. `pnpm dev` para desarrollo web, o `pnpm dev:tauri` para la app de escritorio.
3. Verificar el build con `pnpm build` (no se completó un build real en el entorno
   de migración por límites de red al instalar paquetes).
