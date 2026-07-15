# Prompt de revisión para Gemini Antigravity

## Contexto

Necesito que revises paso a paso la implementación actual del PR contra el documento de requisitos:

`docs/superpowers/specs/2026-07-14-rutinas-adjuntos-asistencia-design.md`

El objetivo no es hacer una revisión superficial. Necesito una revisión cruzada completa: requisitos del MD versus código implementado versus comportamiento verificable.

La implementación toca principalmente:

- Dashboard web: formulario de rutinas, detalle de rutina, agenda/asistencia mock.
- API: rutinas, ejercicios de rutina, DTOs, migración `rest_seconds`.
- Mobile: detalle de rutina, descanso entre series y material de apoyo mock.

No asumas que algo está correcto solo porque compila. Verifica cada requisito importante del MD y marca cualquier brecha.

## Archivos principales a revisar

### Documento base

- `docs/superpowers/specs/2026-07-14-rutinas-adjuntos-asistencia-design.md`

### Dashboard

- `apps/dashboard/src/src/features/dashboard/routines/components/routine-form.tsx`
- `apps/dashboard/src/src/features/dashboard/routines/types.ts`
- `apps/dashboard/src/src/features/dashboard/routines/hooks.ts`
- `apps/dashboard/src/src/features/dashboard/routines/mock-attachments.ts`
- `apps/dashboard/src/routes/dashboard/routines/$id.tsx`
- `apps/dashboard/src/src/features/dashboard/classes/components/TrainerAgendaTab.tsx`

### API / Base de datos

- `apps/restapi/src/modules/routines/dto/routine-exercise.dto.ts`
- `apps/restapi/src/modules/routines/dto/create-routine.dto.ts`
- `apps/restapi/src/modules/routines/dto/update-routine.dto.ts`
- `apps/restapi/src/modules/routines/routines.service.ts`
- `apps/restapi/src/infra/database/pg/schemas/schema.ts`
- `apps/restapi/drizzle/0003_rest_seconds.sql`
- `apps/restapi/drizzle/meta/_journal.json`
- `apps/restapi/sql/mab.sql`

### Mobile

- `apps/mobile/app/(tabs)/routines/[id].tsx`
- `apps/mobile/lib/api/types/training.ts`
- `apps/mobile/lib/mock-routine-materials.ts`

## Forma de trabajo esperada

Haz la revisión en este orden:

1. Lee completo el documento de requisitos.
2. Identifica los requisitos verificables y conviértelos mentalmente en checklist.
3. Revisa el diff actual del repo.
4. Revisa cada archivo tocado.
5. Ejecuta los comandos de validación posibles.
6. Reporta hallazgos por severidad.
7. Si no hay bloqueantes, indica explícitamente `APROBADO`.

No edites archivos todavía. Primero entrega el reporte.

## Checklist funcional

### 1. Stepper de crear/editar rutinas

Verifica que `routine-form.tsx` cumpla:

- Crear y editar usan el mismo componente.
- Hay tres pasos: datos generales, ejercicios, material/revisión.
- El usuario no envía la rutina antes del último paso.
- Los datos se conservan al moverse entre pasos.
- El diálogo no crece indefinidamente con más de cinco ejercicios.
- La lista de ejercicios tiene scroll interno o altura controlada.
- Se puede agregar, eliminar, seleccionar y reordenar ejercicios.
- Hay validaciones por paso.
- Se selecciona o identifica el ejercicio inválido cuando hay errores.
- `restSeconds` existe por ejercicio.
- `restSeconds` acepta enteros entre 0 y 600.
- `0` se representa como “Sin descanso”.
- El valor por defecto es 60.
- Crear/editar preservan `routineExerciseId` cuando existe.
- Los adjuntos mock aparecen en el paso de material/revisión.
- Los adjuntos validan formato, tamaño, cantidad y duplicados.
- Los adjuntos no se envían al payload real del API.

### 2. API y persistencia de descanso

Verifica que la API cumpla:

- La tabla `routine_exercises` tiene columna `rest_seconds`.
- La migración agrega `rest_seconds` con default 60 y `NOT NULL`.
- Hay constraint para `0 <= rest_seconds <= 600`.
- El schema Drizzle contiene `restSeconds`.
- Los DTOs reciben `restSeconds` / `rest_seconds`.
- La validación rechaza valores negativos, mayores a 600, decimales, strings y ausentes cuando corresponda.
- Ojo especial: `"90"` como string no debe convertirse silenciosamente a número.
- Crear rutina guarda `restSeconds`.
- Editar rutina guarda `restSeconds`.
- El snapshot de versiones incluye `rest_seconds`.
- El detalle de rutina devuelve `restSeconds`.
- El historial o diff detecta cambios de descanso.

### 3. Identidad de ejercicios y orden

Verifica que la edición de rutinas no reconcilie por `exerciseId` cuando hay ejercicios repetidos.

Debe cumplir:

- En edición, los ejercicios existentes se identifican por `routineExerciseId`.
- Dos ocurrencias del mismo `exerciseId` pueden coexistir con valores distintos.
- Cambiar series/reps/notas/descanso/orden conserva el `routineExerciseId`.
- Si un ejercicio tiene logs, no debe poder eliminarse.
- Si un ejercicio tiene logs, no debe poder sustituirse por otro `exerciseId`.
- El orden se valida como consecutivo desde 1.
- El update evita colisiones con `uq_routine_exercise_order`.
- Si el payload tiene orden ausente, duplicado o con saltos, debe fallar.

### 4. Adjuntos mock en dashboard

Verifica que HU-ENT-002 en dashboard esté cubierto como frontend mock:

- Existe sección “Archivos adjuntos” en el formulario de rutina.
- Permite seleccionar/subir archivos en la UI.
- Muestra lista de adjuntos seleccionados.
- Permite abrir/quitar adjuntos.
- Muestra error por formato inválido.
- Muestra error por tamaño mayor a 10 MiB.
- Respeta máximo 5 adjuntos.
- Detecta duplicados.
- El mock es local/sesión y no finge persistencia real.
- El payload real de crear/editar rutina no incluye archivos ni metadata mock.

### 5. Material de apoyo en mobile

Verifica que HU-ENT-002 en mobile esté cubierto como frontend mock:

- El detalle móvil de rutina muestra “Material de apoyo”.
- Usa fixtures o mock compatible con futura API.
- Muestra archivos descargables/abribles.
- Maneja estado sin material.
- No permite carga/eliminación desde mobile.
- El descanso entre series también se muestra en cada ejercicio.

### 6. Asistencia a clases grupales

Verifica que HU-ENT-004 esté cubierto en dashboard como mock:

- La agenda del entrenador tiene acción “Tomar asistencia”.
- Se abre una pantalla/panel/dialog de asistencia por clase.
- Muestra lista de miembros con reserva.
- Permite marcar presente.
- Permite marcar ausente.
- Muestra conteos de presentes, ausentes y pendientes.
- Si un miembro no tiene reserva, muestra alerta/confirmación antes de registro manual.
- El registro manual queda marcado como “Sin reserva”.
- No permite duplicar un miembro en el roster.
- El reporte final muestra asistentes y ausentes.
- Finalizar asistencia solo se permite cuando no quedan pendientes.
- La funcionalidad queda explícitamente como mock frontend.
- Mobile no implementa asistencia, porque el MD dice que no aplica.

### 7. Regresiones

Verifica que no se haya roto:

- Crear rutina básica.
- Editar rutina básica.
- Listar rutinas.
- Ver detalle de rutina.
- Asignar rutina.
- Ver sesiones/historial.
- Validar sesión.
- Agenda de clases existente.
- Mobile rutina/detalle/sesiones.

## Comandos sugeridos

Ejecuta, como mínimo:

```bash
pnpm --filter @mab/dashboard typecheck
pnpm --filter @mab/dashboard lint
pnpm --filter @mab/dashboard build
pnpm --filter @mab/mobile typecheck
pnpm --filter @mab/mobile lint
pnpm --filter @mab/restapi typecheck
pnpm --filter @mab/restapi lint
pnpm --filter @mab/restapi build
pnpm --filter @mab/restapi test
```

Si `pnpm --filter @mab/restapi test` falla por `spawn grep ENOENT` en Windows, sepáralo del resultado de esta implementación. Ese fallo pertenece al entorno/test existente de `PadronService`, no necesariamente a rutinas. Aun así, repórtalo como bloqueo de verificación completa.

## Formato del reporte

Entrega el reporte con esta estructura:

```md
# Revisión Gemini Antigravity

## Resultado

APROBADO / REQUIERE CAMBIOS

## Hallazgos bloqueantes

- [P0/P1] Archivo:línea aproximada — descripción, impacto y corrección sugerida.

## Hallazgos no bloqueantes

- [P2/P3] Archivo:línea aproximada — descripción, impacto y corrección sugerida.

## Cobertura contra el MD

| Área | Estado | Notas |
| --- | --- | --- |
| Stepper rutinas | Completo/Parcial/Falta | ... |
| Descanso E2E | Completo/Parcial/Falta | ... |
| Adjuntos dashboard | Completo/Parcial/Falta | ... |
| Material mobile | Completo/Parcial/Falta | ... |
| Asistencia dashboard | Completo/Parcial/Falta | ... |
| Regresiones | Completo/Parcial/Falta | ... |

## Comandos ejecutados

- comando — resultado

## Decisión final

Explica si se puede entregar el PR o qué falta antes de entregarlo.
```

## Criterio de aprobación

Solo responde `APROBADO` si:

- No encuentras P0/P1.
- El código cumple el alcance mock versus real definido en el MD.
- `restSeconds` persiste de extremo a extremo.
- Los adjuntos y asistencia no fingen backend real.
- Las validaciones principales están implementadas.
- Los comandos críticos pasan, o cualquier fallo está claramente demostrado como ajeno al cambio.

Si hay brechas importantes, responde `REQUIERE CAMBIOS` y enumera exactamente qué corregir.
