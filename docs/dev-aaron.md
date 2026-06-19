# Dev — Aarón · Pantallas de Clientes/Miembros (Dashboard)

Documentación de desarrollo de las historias de usuario de **clientes/miembros** implementadas en
`apps/dashboard`. Todas son **solo interfaz (UI)** con datos mock: no hay backend, API, persistencia
ni validaciones funcionales. La interactividad es local con `useState`.

> Autor: Aarón · App: `@mab/dashboard`

---

## 1. Stack y contexto

- **Vite + TanStack Router** (file-based routing). El dashboard se migró desde Next.js
  (commit `a6d8f6b`), por lo que las páginas viven en `src/routes/...` y la navegación usa
  `@tanstack/react-router` (`Link to=...`, `useLocation`, `createFileRoute`).
- **UI**: shadcn/Radix (`src/components/ui/*`), **Tailwind v4** con tokens semánticos, iconos **Lucide**.
- **Tema oscuro** oficial. No usar hex sueltos: usar tokens (`success`, `warning`, `destructive`,
  `muted`, `primary`, etc.) definidos en `src/app/globals.css`.

## 2. Estructura de archivos relevante

```
apps/dashboard/src/
├── routes/dashboard/                 # Páginas (TanStack file-based routing)
│   ├── profile.tsx                   # HU-CLI-004 · Mi perfil
│   ├── memberships/
│   │   ├── index.tsx                 # HU-CLI-005 · Gestión de membresías
│   │   └── approval.tsx              # HU-CLI-003 · Aprobación de membresías
│   └── trainer/members.tsx           # HU-CLI-006 · Mis miembros asignados
├── src/features/dashboard/           # Componentes por feature
│   ├── components/
│   │   ├── app-sidebar.tsx           # Navegación lateral
│   │   └── dashboard-header.tsx      # Header + breadcrumbs
│   ├── memberships/components/memberships-table.tsx
│   └── trainer/components/assigned-members-table.tsx
├── src/shared/
│   ├── components/page-header.tsx    # Encabezado de página (title/description/actions)
│   ├── components/confirm-dialog.tsx # AlertDialog reutilizable de confirmación
│   └── lib/mock-data.ts              # Tipos + datos mock
└── components/ui/                    # Primitivos shadcn
```

## 3. Convenciones aplicadas

- **Estructura de página**: `<DashboardHeader breadcrumbs={...} />` → `<div className="flex-1 overflow-auto p-6">`
  → `<PageHeader title description actions />` → contenido.
- **Badges de estado locales**: el `StatusBadge` compartido usa etiquetas masculinas
  (`active` = "Activo"). Para membresías se necesitan etiquetas **femeninas** ("Activa", "Vencida",
  "Congelada"…), así que **cada tabla define un badge local** (`statusClasses` + labels) con tokens,
  sin tocar el `StatusBadge` global. No reutilizar las claves del badge global para esto.
- **Mock**: toda acción es visual. Nada de `fetch`, server actions, mutations ni submit real.
- **Datos**: en `mock-data.ts` (ver §6). Datos puntuales (medidas/metas/notas del perfil) van inline
  en la página cuando solo aplican a un caso de ejemplo.

## 4. Pantallas

### HU-CLI-004 · Mi perfil — `routes/dashboard/profile.tsx`

- Ruta `/dashboard/profile` · Breadcrumb `Inicio / Mi perfil` · Badge **Miembro** · Icono `UserRound`.
- Layout `grid lg:grid-cols-[320px_1fr_360px]`: resumen del perfil · formulario "Información personal"
  · 3 estados simulados (éxito / formato inválido con `aria-invalid` / cambio de correo con verificación).
- Inputs visuales con `defaultValue` (editables, sin estado/red). Botones `Guardar cambios` / `Cancelar`
  (`type="button"`).

### HU-CLI-005 · Gestión de membresías — `routes/dashboard/memberships/index.tsx`

- Ruta `/dashboard/memberships` · Breadcrumb `Inicio / Membresías / Gestión de membresías` ·
  Badge **Administrador** · Icono `IdCard`.
- **4 KPIs** (activas/vencidas/próximas a vencer/inactivas) con tokens `success`/`destructive`/`warning`/`muted`.
- **Card "Listado de membresías"**: búsqueda + botón **Filtros** (panel lateral `Sheet`) + **Exportar**.
- **Tabla** (`memberships-table.tsx`): acciones **Desactivar** (con confirmación) y **Ver historial**.
- **2 cards de criterios** (visualización activas, desactivación vencida).
- `ConfirmDialog` para desactivar.

### HU-CLI-006 · Mis miembros asignados — `routes/dashboard/trainer/members.tsx`

- Ruta `/dashboard/trainer/members` · Breadcrumb `Inicio / Entrenadores / Mis miembros asignados` ·
  Badge **Entrenador** · Icono `UsersRound`.
- Layout `grid xl:grid-cols-[520px_1fr]`: lista de miembros asignados · perfil completo del seleccionado.
- **Tabla** (`assigned-members-table.tsx`): **filas clicables** para seleccionar (sin botón); columnas
  Miembro (avatar+nombre+ID) y Estado; scroll horizontal habilitado.
- Perfil: resumen personal, historial de entrenamientos, medidas corporales, metas (`Progress`),
  notas del entrenador. Botón **Exportar perfil en PDF** muestra alert mock (sin descarga real).

## 5. Sidebar (`app-sidebar.tsx`)

- Grupo **Principal**: `Dashboard`, `Usuarios` (Usuarios se elevó a módulo principal de administración).
- Grupo **Administración**: `Miembros`, `Registrar miembro`, `Mi perfil`, `Membresías`,
  `Aprobación de membresías`, `Mis miembros`, `Catálogo`, `Configuración`.
- **Ocultados**: `Respaldos`, `Reportes`, `Auditoría` (removidos de la navegación).
- El header del sidebar usa `h-16` para que su separador **alinee** con el borde inferior del
  `DashboardHeader` (también `h-16`).
- `exact: true` en ítems cuya ruta es prefijo de otra (p. ej. `Membresías` vs `.../approval`).

## 6. Datos mock (`src/shared/lib/mock-data.ts`)

| Export                                                                                        | Tipo   | Uso                                                            |
| --------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| `Membership`, `MembershipStatus`, `mockMemberships`, `membershipStatusLabels`                 | HU-005 | 8 filas; estados `active`/`expired`/`expiring-soon`/`inactive` |
| `AssignedMember`, `AssignedMemberStatus`, `mockAssignedMembers`, `assignedMemberStatusLabels` | HU-006 | 5 miembros; estados `active`/`frozen`/`expired`                |
| `mockTrainingHistory`                                                                         | HU-006 | 3 sesiones de ejemplo                                          |

> Para integrar backend: sustituir estos mocks por fetch real (ver §9).

## 7. Ajustes recientes (revisión de UI)

| Pedido                              | Cambio                                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| La línea no calzaba                 | Header del sidebar a `h-16` → alinea con el `DashboardHeader`.                                                                    |
| Filtros laterales                   | El botón **Filtros** de membresías abre un `Sheet` (derecha) con Nombre, Nº de miembro, Estado y fechas + Aplicar/Limpiar (mock). |
| Ocultar módulos                     | Removidos `Respaldos`, `Reportes`, `Auditoría` del sidebar.                                                                       |
| Mis miembros: quitar cards de abajo | Eliminadas las 3 cards de criterios y la nota inferior en HU-006.                                                                 |
| Tabla mejor                         | `assigned-members-table`: scroll horizontal, fila clicable (sin botón "Ver perfil"), solo columnas **Miembro** y **Estado**.      |
| Confirm al desactivar               | "Desactivar" en membresías usa `ConfirmDialog` (destructivo).                                                                     |
| Tipo de membresía                   | Columna fija en **"Premium"** para todas las filas.                                                                               |
| Eliminar renovar                    | Quitada la acción **Renovar**, su diálogo y su card de criterio.                                                                  |
| Enfocar usuarios                    | **Usuarios** movido al grupo **Principal** del sidebar.                                                                           |

## 8. Comandos

```bash
# Verificación
pnpm --filter @mab/dashboard typecheck
pnpm --filter @mab/dashboard lint

# Desarrollo
pnpm --filter @mab/dashboard dev
```

Notas de entorno:

- Windows usa **autocrlf** (git guarda LF, hace checkout CRLF). Si prettier marca `Delete ␍`,
  correr `pnpm --filter @mab/dashboard exec prettier --write <archivo>`.
- Hooks de **husky**: `pre-commit` (lint-staged: eslint --fix + prettier) y `commit-msg`
  (**commitlint / Conventional Commits**). El mensaje debe ser `tipo(scope): descripción`
  (header y líneas del body ≤ 100 chars). Ej.: `feat(dashboard): agregar pantalla de membresías`.

## 9. Pendiente para integración backend

- Reemplazar `mockMemberships` / `mockAssignedMembers` / `mockTrainingHistory` por datos reales.
- Endpoints y servicios (conectar con `apps/restapi` + Drizzle).
- Renovación/desactivación reales, cálculo de días restantes, restricción de acceso real.
- Perfil/medidas/metas/notas reales, historial real, exportación real de PDF.
- Permisos por rol/entrenador y validaciones funcionales (correo/teléfono).
