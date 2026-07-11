# ENT - Entrenamientos (Workouts/Training)

## Objetivo

Implementar el módulo de entrenamientos para Mind & Body:
- **Fase 1 (F1)**: Mobile member-side (ver rutinas, ejecutar, confirmar, validar) + backend member endpoints + seed SQL
- **Fase 2 (F2)**: Backend trainer CRUD (crear/editar rutinas) + Dashboard UI

**HUs en scope**: HU-ENT-001, HU-ENT-003, HU-ENT-005, HU-ENT-006  
**HUs fuera de scope**: HU-ENT-002 (archivos adjuntos), HU-ENT-004 (asistencia a clases grupales)

## Decisiones clave

| Decisión | Valor |
|----------|-------|
| Roles | Solo `TRAINER` crea/edita rutinas (v1) |
| Ownership | Trainer edita solo sus rutinas (`trainer_id = currentUser.trainer.id`) |
| Rutinas genéricas | Fuera de v1 (schema lo admite para futuro) |
| Tablas nuevas | `training_sessions` + `exercise_logs` + `routine_versions` + `notifications` |
| Creación de sesión | On-demand (botón "INICIAR ENTRENAMIENTO") |
| Vencimiento | 24h si PENDING, lazy al leer (no scheduler) |
| Firma del trainer | Botón "Validar" (approval con credenciales, no trazo canvas) |
| Historial de versiones | Tabla `routine_versions` con snapshot JSONB |
| Duplicados | Constraint unique `(trainer_id, name)` + 409 Conflict |
| Notificaciones | Sistema in-app (tabla `notifications` + endpoint GET /notifications) |

## Modelo de datos

### Tablas existentes (no modificar)
- `routines` (template de rutina)
- `routine_exercises` (ejercicios de la rutina)
- `member_routines` (asignación trainer→member)
- `exercises` (catálogo de ejercicios)

### Tablas nuevas

**training_sessions**
```sql
id: uuid PK
member_routine_id: uuid FK → member_routines(id)
date: date NOT NULL
status: enum('PENDING', 'CONFIRMED', 'VALIDATED', 'EXPIRED') DEFAULT 'PENDING'
confirmed_at: timestamptz
confirmed_by: uuid FK → users(id)
validated_by_trainer_id: uuid FK → trainers(id)
validated_at: timestamptz
notes: text
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
```

**exercise_logs**
```sql
id: uuid PK
session_id: uuid FK → training_sessions(id)
routine_exercise_id: uuid FK → routine_exercises(id)
target_sets: integer (snapshot del template al momento del log)
target_reps: varchar(40) (snapshot)
target_weight_kg: numeric(5,2) (snapshot)
completed_sets: integer
completed_reps_log: text (ej: "10,8,8")
weight_kg_actual: numeric(5,2)
notes: text
completed: boolean DEFAULT false
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
```

**routine_versions**
```sql
id: uuid PK
routine_id: uuid FK → routines(id)
version_number: integer NOT NULL
snapshot: jsonb NOT NULL (estructura completa de routine + routine_exercises)
changed_by: uuid FK → trainers(id)
change_reason: text
created_at: timestamptz DEFAULT now()
```
Constraint: `UNIQUE (routine_id, version_number)`

**notifications**
```sql
id: uuid PK
user_id: uuid FK → users(id)
type: enum('ROUTINE_ASSIGNED', 'ROUTINE_UPDATED', 'SESSION_VALIDATED')
title: varchar(200) NOT NULL
body: text
payload: jsonb (ej: {routine_id: "...", session_id: "..."})
read: boolean DEFAULT false
created_at: timestamptz DEFAULT now()
```

## Definition of Done

### F1 — Mobile member-side

**Backend endpoints:**

1. `GET /api/v1/routines` — Lista rutinas asignadas al member autenticado (`member_routines` con `status='ACTIVE'`), incluyendo `routine_exercises` ordenados por `display_order`.

2. `GET /api/v1/routines/:id` — Detalle de una rutina con sus ejercicios.

3. `POST /api/v1/sessions` — Crea `training_session` con `status=PENDING` ligada a un `member_routine_id`.
   - **Validación**: Verifica que `member_routine` exista y tenga `status='ACTIVE'`. Si no → 422 "No tenés una rutina activa asignada".

4. `POST /api/v1/sessions/:id/exercise-logs` — Upsert de `exercise_log` (peso, reps, obs, completed) por `routine_exercise_id`.

5. `POST /api/v1/sessions/:id/confirm` — Flipa `training_session.status` a `CONFIRMED`, registra `confirmed_at` + `confirmed_by`. Funciona con parcial (no requiere todos los ejercicios completados).

6. `POST /api/v1/sessions/:id/validate` — (rol TRAINER) Setea `validated_by_trainer_id` + `validated_at`.
   - **Validación**: Solo si `session.status === 'CONFIRMED'` y `validated_at IS NULL`. Si ya validada → 409 "Sesión ya validada".

7. `GET /api/v1/sessions` — Lista historial de sesiones del member (`orderBy date desc`).
   - **Lazy expiry**: Si `status='PENDING'` y `created_at + 24h < now` → flipa a `EXPIRED` antes de retornar.

8. `GET /api/v1/sessions/:id` — Detalle de sesión con `exercise_logs`.
   - **Lazy expiry**: Mismo check que item 7.

9. `GET /api/v1/notifications` — Lista notificaciones del usuario autenticado (`orderBy created_at desc`).

10. `POST /api/v1/notifications/:id/read` — Marca notificación como leída.

11. **Seed SQL**: `apps/restapi/sql/seed-ent.sql` con:
    - 2 rutinas (PECHO & TRÍCEPS, FULL BODY HIIT)
    - 6-8 ejercicios del catálogo
    - 1 asignación al member `admin@mab.com`
    - Corre limpio contra DB remota

12. **Auth**: Todos los endpoints privados (`@CurrentUser`), ningún `@Public` salvo health.

**Mobile (Expo):**

13. `app/(tabs)/routines.tsx` — Reemplaza `ROUTINES` mock por `GET /routines` via TanStack Query.
    - Empty state: "No tenés rutinas asignadas" si lista vacía.

14. `app/(tabs)/routines/[id].tsx` — Nueva ruta con:
    - Detalle de rutina + lista de ejercicios
    - Inputs por ejercicio: peso (numeric), reps (numeric), obs (text), checkbox completed
    - Botón "INICIAR ENTRENAMIENTO" → `POST /sessions` → habilita inputs
    - Botón "Confirmar" → `POST /sessions/:id/confirm` (funciona con parcial)
    - Sección historial: lista sesiones pasadas (`GET /sessions`) con fecha + estado (PENDING/CONFIRMED/VALIDATED/EXPIRED) + target snapshots
    - Si `role === TRAINER` y sesión `CONFIRMED` sin `validated_at` → botón "Validar" visible

15. **Estados UI**:
    - Loading: Skeleton en cada query
    - Error: Retry button en cada query
    - Empty: Mensajes contextuales ("No tenés rutinas asignadas", "No hay sesiones registradas")

16. **Notificaciones**: Badge en tab bar con count de notificaciones no leídas. Al tap → lista de notificaciones.

### F2 — Dashboard trainer-side

**Backend endpoints:**

17. `POST /api/v1/routines` — Crea rutina (rol TRAINER).
    - **DTO validation** (class-validator):
      - `name`: string, required, maxLength 120
      - `objective`: text, optional
      - `exercises`: array de `{exercise_id, display_order, sets, reps, notes}`, required, minLength 1
    - **Duplicados**: Constraint unique `(trainer_id, name)`. Si viola → 409 Conflict con mensaje "Ya existe una rutina con ese nombre. ¿Confirmar o renombrar?"
    - **Versionado**: Inserta `routine_versions` con `version_number=1` y snapshot JSONB.
    - **Notificación**: Crea `notification` para cada member asignado (type='ROUTINE_ASSIGNED').

18. `PUT /api/v1/routines/:id` — Actualiza rutina (rol TRAINER, solo si `trainer_id = currentUser.trainer.id`).
    - **DTO validation**: Mismos campos que POST.
    - **Versionado**: Inserta `routine_versions` con `version_number = max + 1` y snapshot JSONB.
    - **Notificación**: Crea `notification` para cada member asignado (type='ROUTINE_UPDATED').

19. `DELETE /api/v1/routines/:id` — Soft delete (setea `deleted_at`). Solo si `trainer_id = currentUser.trainer.id`.

20. `GET /api/v1/routines/:id/versions` — Lista versiones de la rutina (`orderBy version_number desc`).
    - Response: `[{version_number, snapshot, changed_by, change_reason, created_at}]`

21. `POST /api/v1/routines/:id/assign` — Asigna rutina a member (rol TRAINER).
    - Body: `{member_id: uuid}`
    - Crea `member_routines` con `assigned_by_trainer_id = currentUser.trainer.id`.
    - **Notificación**: Crea `notification` para el member (type='ROUTINE_ASSIGNED').

22. `GET /api/v1/routines` — Lista rutinas del trainer autenticado (`trainer_id = currentUser.trainer.id`).

**Dashboard (Vite + React):**

23. `/dashboard/routines` — Lista rutinas del trainer (`GET /routines`).
    - Botón "Crear" → modal con form (nombre, objetivo, ejercicios con display_order, series, reps, notes)
    - Validación client-side: nombre required, al menos 1 ejercicio

24. `/dashboard/routines/$id` — Detalle con 3 tabs:
    - **Tab Detalles**: Ejercicios de la rutina + botón "Editar" (PUT /routines/:id)
    - **Tab Members**: Lista members asignados + botón "Asignar" (selector de member)
    - **Tab Sesiones**: Lista `training_sessions` de esa rutina → botón "Validar" si `status='CONFIRMED'` y `validated_at IS NULL`
    - **Tab Historial**: Lista `routine_versions` con fecha + diff vs versión anterior

25. **Notificaciones**: Badge en header con count de notificaciones no leídas. Al click → dropdown con lista.

## Edge cases

| Caso | Manejo |
|------|--------|
| Rutina duplicada | 409 Conflict + mensaje "Ya existe una rutina con ese nombre" |
| Datos incompletos en POST/PUT | 422 Unprocessable Entity (class-validator) |
| Sesión sin rutina activa | 422 "No tenés una rutina activa asignada" |
| Sesión ya validada | 409 "Sesión ya validada" |
| Sesión expirada (24h) | Lazy flip a EXPIRED al leer |
| Confirmación parcial | Permitido (no requiere todos los ejercicios completados) |
| Trainer edita rutina de otro | 403 Forbidden (check `trainer_id = currentUser.trainer.id`) |
| Member intenta validar sesión | 403 Forbidden (check `role === TRAINER`) |

## Success metrics

- F1: Member puede ver rutinas asignadas, iniciar sesión, ejecutar ejercicios (parcial o completo), confirmar, y ver historial. Trainer puede validar sesiones desde mobile.
- F2: Trainer puede crear/editar/eliminar rutinas, asignar a members, ver historial de versiones, y validar sesiones desde dashboard.
- Todos los criterios de aceptación del Excel (HU-ENT-001, 003, 005, 006) cubiertos.
