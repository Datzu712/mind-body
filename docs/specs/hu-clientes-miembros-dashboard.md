# Spec: Gestión de Usuarios — Dashboard

## Objective

Unificar la gestión de personas (members, trainers, staff) en una vista principal `/dashboard/users` con sub-rutas de detalle por tipo de perfil. El componente de detalle se reutiliza en `/dashboard/profile` (perfil propio del usuario logueado).

**Usuario objetivo:** Administrador del gimnasio que necesita ver todos los usuarios registrados, identificar qué perfiles de dominio tiene cada uno (Member/Trainer/Staff), detectar inconsistencias (rol de KC sin perfil en DB), y navegar al detalle de cada perfil.

**Alcance actual:** Solo UI con datos mock. Sin backend, sin auth real, sin persistencia.

---

## Tech Stack

- Vite + React 19 + TanStack Router (file-based routing)
- TanStack Table (paginacion, sorting, filtering client-side)
- TanStack Query v5 (data fetching — mock con queryFn que resuelve datos locales por ahora)
- Tailwind CSS v4 (tokens semanticos en globals.css)
- Radix UI + shadcn/ui (components/ui/\*)
- Lucide icons
- TypeScript strict
- Datos: mock inline o en `mock-data.ts`

---

## Dependencies to Add

```bash
pnpm --filter @mab/dashboard add @tanstack/react-table @tanstack/react-query
```

Estas no existen actualmente en el proyecto. Se necesitan para:

- `@tanstack/react-table`: paginacion, sorting, filtering client-side en la tabla de usuarios
- `@tanstack/react-query`: capa de data fetching (por ahora queryFn devuelve mock data; cuando haya backend se cambia el queryFn sin tocar la UI)

---

## Commands

```bash
# Dev
pnpm --filter @mab/dashboard dev

# Type check
pnpm --filter @mab/dashboard typecheck

# Lint
pnpm --filter @mab/dashboard lint
```

---

## Project Structure (relevante)

```
apps/dashboard/src/
├── routes/dashboard/
│   ├── users.tsx                          # Tabla general (existe, se refactoriza)
│   ├── users/
│   │   ├── members.$id.tsx                # Detalle perfil member
│   │   ├── trainers.$id.tsx               # Detalle perfil trainer
│   │   └── staff.$id.tsx                  # Detalle perfil staff
│   └── profile.tsx                        # Mi perfil (reutiliza componente detalle)
├── src/features/dashboard/users/
│   ├── components/
│   │   ├── users-table.tsx                # Tabla general refactorizada
│   │   ├── user-profile-detail.tsx        # Layout compartido de detalle
│   │   ├── member-detail-section.tsx      # Sección específica member
│   │   ├── trainer-detail-section.tsx     # Sección específica trainer
│   │   └── staff-detail-section.tsx       # Sección específica staff
│   └── types.ts                           # Tipos alineados al DDL
├── src/shared/lib/mock-data.ts            # Datos mock (se extiende)
└── components/ui/                         # Primitivos shadcn
```

---

## Modelo de Datos (alineado al DDL)

```typescript
// types.ts — refleja app.users + perfiles

type RecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
type ProfileType = 'MEMBER' | 'TRAINER' | 'STAFF';

// Roles vienen de Keycloak (mocked por ahora)
type KCRole = 'admin' | 'trainer' | 'member';

interface UserBase {
    id: string; // users.id (UUID)
    keycloakSubject: string; // users.keycloak_subject
    fullName: string; // users.full_name
    email: string; // mock — futuro: sync desde KC
    phone?: string; // users.phone
    status: RecordStatus; // users.status
    createdAt: string; // users.created_at
    // Derivados de KC (mock)
    roles: KCRole[];
    // Perfiles existentes en DB
    profiles: ProfileType[];
}

interface MemberProfile {
    id: string; // members.id
    userId: string; // members.user_id
    birthDate?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    joinedAt: string;
    notes?: string;
    status: RecordStatus;
    // Membresía activa (join)
    activeMembership?: {
        id: string;
        planName: string;
        startDate: string;
        endDate: string;
        status: MembershipStatus;
    };
}

interface TrainerProfile {
    id: string; // trainers.id
    userId: string;
    specialty?: string;
    biography?: string;
    status: RecordStatus;
}

interface StaffProfile {
    id: string; // staff.id
    userId: string;
    hiredAt: string;
    status: RecordStatus;
}
```

---

## Routing & Navigation

### Rutas

| Ruta                            | Componente          | Descripcion                                   |
| ------------------------------- | ------------------- | --------------------------------------------- |
| `/dashboard/users`              | `UsersPage`         | Tabla general de todos los `app.users`        |
| `/dashboard/users/members/$id`  | `MemberDetailPage`  | Detalle perfil member por `members.id`        |
| `/dashboard/users/trainers/$id` | `TrainerDetailPage` | Detalle perfil trainer por `trainers.id`      |
| `/dashboard/users/staff/$id`    | `StaffDetailPage`   | Detalle perfil staff por `staff.id`           |
| `/dashboard/profile`            | `ProfilePage`       | Perfil propio (reutiliza `UserProfileDetail`) |

### Breadcrumbs

- `/dashboard/users` -> `Mind & Body / Usuarios`
- `/dashboard/users/members/$id` -> `Mind & Body / Usuarios / [Nombre] / Miembro`
- `/dashboard/users/trainers/$id` -> `Mind & Body / Usuarios / [Nombre] / Entrenador`
- `/dashboard/users/staff/$id` -> `Mind & Body / Usuarios / [Nombre] / Staff`
- `/dashboard/profile` -> `Inicio / Mi perfil`

### Sidebar

- Grupo **Principal**: `Dashboard`, `Usuarios` (ya existe)
- `/dashboard/users` se mantiene con highlight activo tambien para sub-rutas (`/dashboard/users/*`)
- `Mi perfil` se mantiene en grupo Administracion

---

## Vista: Tabla General (`/dashboard/users`)

Implementada con **TanStack Table** (columnDefs, pagination, sorting, globalFilter) + **TanStack Query** (`useQuery` con queryFn que resuelve mock data).

### Columnas

| Columna       | Fuente                | Notas                                                                           |
| ------------- | --------------------- | ------------------------------------------------------------------------------- |
| Nombre        | `users.full_name`     | Con avatar (iniciales)                                                          |
| Email         | mock (futuro KC sync) | —                                                                               |
| Telefono      | `users.phone`         | —                                                                               |
| Roles (KC)    | Token mock            | Badges: `Admin`, `Trainer`, `Member`                                            |
| Perfiles (DB) | JOIN profiles         | Badges con check o warning si falta                                             |
| Estado        | `users.status`        | `StatusBadge` existente                                                         |
| Creado        | `users.created_at`    | Fecha formateada                                                                |
| Acciones      | —                     | Dropdown: "Ver miembro", "Ver trainer", "Ver staff" (segun perfiles existentes) |

### Filtros (Off-canvas / Sheet)

La barra superior de la tabla solo tiene: **input de busqueda global** + boton **"Filtros"** (icono `SlidersHorizontal`).

Al tocar "Filtros" se abre un `Sheet` (Radix) desde la **derecha** con:

- Filtro por perfil: `Todos` | `Miembros` | `Entrenadores` | `Staff`
- Filtro por estado: `Todos` | `Activo` | `Inactivo` | `Archivado`
- Boton **"Aplicar"** (cierra el sheet y aplica los filtros a la tabla)
- Boton **"Limpiar"** (resetea filtros a valores por defecto)

Los filtros no se aplican en tiempo real: solo al presionar "Aplicar". Esto mantiene la tabla limpia y evita re-renders innecesarios.

### Paginacion

- Client-side con TanStack Table (`getPaginationRowModel`)
- Page size selector: 10 / 20 / 50
- Controles: Anterior / Siguiente + indicador "Pagina X de Y"

### Indicador de mismatch

Si un usuario tiene un rol de KC pero **no** tiene el perfil correspondiente en la DB, mostrar un badge de warning (icono `AlertTriangle` + tooltip "Rol sin perfil asociado"). La accion de ese row es "Crear perfil" que abre un **modal** con formulario generico de creacion de perfil.

### Modal "Crear Perfil"

- Se abre desde la accion de mismatch o desde un boton general "Nuevo perfil"
- Campos: tipo de perfil (select), datos basicos segun tipo seleccionado
- Submit mock (agrega al estado local)

---

## Vista: Detalle de Perfil (compartido)

### Componente `UserProfileDetail`

```typescript
interface UserProfileDetailProps {
    user: UserBase;
    profileType: ProfileType;
    profile: MemberProfile | TrainerProfile | StaffProfile;
    isOwnProfile?: boolean; // true en /dashboard/profile
}
```

### Layout (reutiliza estructura de profile.tsx actual)

```
grid lg:grid-cols-[320px_1fr]
  ├── Columna izquierda: Resumen (avatar, nombre, estado, roles, info rapida)
  └── Columna derecha: Seccion especifica del tipo de perfil
```

### Seccion Member

- Informacion personal: birth_date, emergency_contact_name/phone, joined_at, notes
- Membresia activa: plan, fechas, estado, dias restantes
- (Futuro: rutinas asignadas, mediciones)

### Seccion Trainer

- Especialidad, biografia
- (Futuro: miembros asignados, rutinas creadas)

### Seccion Staff

- Fecha de contratacion (hired_at)
- (Futuro: permisos, actividad)

### Diferencia `isOwnProfile`

- `true`: campos editables (inputs), boton "Guardar cambios" (mock)
- `false`: campos read-only (texto), sin boton de guardado

---

## Code Style

```tsx
// Ejemplo de pagina con TanStack Router
import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';

export const Route = createFileRoute('/dashboard/users/members/$id')({
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { id } = Route.useParams();
  // ...
  return (
    <>
      <DashboardHeader breadcrumbs={[...]} />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader title="..." />
        {/* contenido */}
      </div>
    </>
  );
}
```

Convenciones:

- Tokens semanticos de Tailwind (nunca hex directos)
- Componentes en PascalCase, archivos en kebab-case
- Props interfaces con sufijo `Props`
- Mock data como constantes exportadas en mock-data.ts

---

## Testing Strategy

No aplica en esta fase (solo UI mock). Verificacion mediante:

- `pnpm --filter @mab/dashboard typecheck` pasa sin errores
- `pnpm --filter @mab/dashboard lint` pasa sin errores
- Navegacion manual: tabla -> click detalle -> breadcrumb vuelve

---

## Boundaries

### Always

- Usar tokens semanticos del tema (no hex)
- Seguir la estructura de pagina: DashboardHeader -> div.flex-1 -> PageHeader -> contenido
- Tipar todo (no `any`)
- Datos mock en mock-data.ts o inline si son especificos de una sola pagina

### Ask first

- Agregar dependencias nuevas
- Cambiar la estructura del sidebar
- Modificar componentes compartidos (StatusBadge, PageHeader, etc.)

### Never

- Conectar a backend real (fuera de scope)
- Implementar auth/permisos reales
- Hacer submit/fetch/mutations reales
- Eliminar paginas existentes que no se mencionan en este spec

---

## Success Criteria

1. `/dashboard/users` muestra una tabla con datos mock de usuarios, indicando roles (KC) y perfiles (DB) con badges
2. Filtros por nombre, tipo de perfil y estado funcionan correctamente
3. Usuarios con rol pero sin perfil muestran indicador visual de mismatch
4. Click en "Ver [tipo]" navega a `/dashboard/users/members|trainers|staff/$id`
5. Las paginas de detalle muestran la info del perfil correspondiente con layout compartido
6. `/dashboard/profile` reutiliza `UserProfileDetail` con `isOwnProfile=true` (editable)
7. Breadcrumbs correctos en todas las sub-rutas
8. `typecheck` y `lint` pasan sin errores
9. La sidebar resalta "Usuarios" cuando se navega a cualquier sub-ruta de users

---

## Decisiones Tomadas

1. **Email**: Se mockea en el modelo asumiendo que eventualmente se sincronizara desde Keycloak.
2. **"Crear perfil" en mismatch**: Modal reutilizable — el formulario inicial de creacion es el mismo para todos los tipos de perfil (datos basicos).
3. **Perfil propio (`/dashboard/profile`)**: El componente es generico/reutilizable. Muestra datos base del usuario + la seccion de dominio segun el tipo de perfil que tenga. Un usuario puede tener multiples perfiles, se muestran como tabs o secciones.
4. **Paginacion**: Mock con paginacion usando TanStack Table + TanStack Query (preparado para datos remotos).
