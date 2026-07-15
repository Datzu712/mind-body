# Especificación de requisitos y diseño: rutinas escalables, adjuntos y asistencia

**Fecha:** 2026-07-14
**Estado:** Revisión interna aprobada; pendiente de aprobación del solicitante
**Enfoque aprobado:** Opción 1 — conservar el diálogo actual y convertirlo en un stepper de tres pasos
**Producto:** Mind & Body
**Superficies involucradas:** Dashboard web, API de rutinas, base de datos y aplicación móvil

## 1. Propósito

Este documento define, con nivel suficiente para preparar un plan de implementación y pruebas, los cambios solicitados después de la revisión del pull request:

1. Convertir el formulario de creación y actualización de rutinas en un stepper interactivo que siga siendo usable cuando una rutina contenga más de cinco ejercicios.
2. Añadir un campo de descanso entre series para cada ejercicio y conservarlo en todo el flujo real de rutinas.
3. Cubrir el frontend pendiente de HU-ENT-002, “Adjuntos en rutinas”.
4. Cubrir el frontend pendiente de HU-ENT-004, “Asistencia a clases grupales”.

La especificación separa deliberadamente dos clases de alcance:

- El descanso entre series pertenece al flujo real de rutinas y debe persistirse de extremo a extremo.
- Los adjuntos y la asistencia se implementarán como experiencia frontend simulada porque el repositorio actual no contiene APIs, tablas ni almacenamiento para esas funciones. Sus tipos se diseñarán como contratos intercambiables para una integración posterior.

No debe afirmarse que HU-ENT-002 o HU-ENT-004 están completas de extremo a extremo mientras continúen dependiendo de mocks.

## 2. Fuentes y evidencia revisada

### 2.1 Solicitud de cambio

- El formulario actual crece verticalmente por cada ejercicio y puede deteriorarse visualmente al superar cinco elementos.
- Crear y actualizar deben compartir el mismo stepper.
- Cada ejercicio necesita un valor de descanso entre series.
- La imagen de revisión identifica como pendientes de frontend HU-ENT-002 y HU-ENT-004.

### 2.2 Historias de usuario

Se contrastó la hoja `ENT - Entrenamientos` del archivo `AN02 Historias de UsuarioV02 (1) (1) (1).xlsx`.

| Historia   | Escenario                 | Resultado exigido por la historia                                                                              |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| HU-ENT-002 | 1. Adjunto válido         | El archivo se almacena y vincula a la rutina. En este PR solo se simula la capa visual y el estado local.      |
| HU-ENT-002 | 2. Formato no permitido   | Se informa el error y se indican los formatos aceptados.                                                       |
| HU-ENT-002 | 3. Acceso del miembro     | El detalle móvil muestra material descargable. En este PR se usan adjuntos de muestra, no sincronización real. |
| HU-ENT-004 | 1. Asistencia con reserva | El entrenador marca presente o ausente a un miembro reservado.                                                 |
| HU-ENT-004 | 2. Miembro sin reserva    | Se advierte la falta de reserva y se permite un registro manual confirmado.                                    |
| HU-ENT-004 | 3. Reporte por clase      | Al finalizar se muestra el listado y los totales de asistentes y ausentes.                                     |

También se preservan los comportamientos de HU-ENT-001, creación de rutina, y HU-ENT-005, actualización de rutina.

### 2.3 Estado técnico observado

- `routine-form.tsx` contiene actualmente datos generales y una lista completa de ejercicios dentro de un solo diálogo desplazable.
- `RoutineExerciseDto`, `routine_exercises`, los tipos del dashboard y los tipos móviles no contienen descanso entre series.
- Las rutinas sí usan API y base de datos reales. Un campo añadido únicamente al formulario se perdería, por lo que no sería una solución válida.
- `TrainerAgendaTab.tsx` y `mock-classes.ts` declaran explícitamente que agenda y clases son mocks de frontend.
- No se encontraron controladores, servicios, tablas ni endpoints de adjuntos o asistencia.
- El detalle móvil de rutina ya tiene una ubicación natural para mostrar descanso y material de apoyo.

## 3. Resultado esperado

Al terminar la implementación derivada de esta especificación:

- Un entrenador podrá crear o editar rutinas mediante tres pasos claros sin que una lista larga expanda indefinidamente el diálogo.
- Podrá agregar, seleccionar, editar, ordenar y eliminar ejercicios conservando el estado al moverse entre pasos.
- Cada ejercicio tendrá un descanso en segundos, persistido por la API y visible en dashboard y móvil.
- El dashboard mostrará una experiencia completa de selección y validación de adjuntos, claramente identificada como mock cuando corresponda.
- El móvil mostrará una sección “Material de apoyo” con archivos simulados descargables.
- La agenda permitirá abrir la asistencia de una ocurrencia de clase, marcar presentes y ausentes, registrar manualmente a una persona sin reserva y finalizar con un reporte.
- Los mocks quedarán aislados detrás de contratos que puedan sustituirse por hooks de API sin rediseñar las vistas.

## 4. Alcance aprobado

### 4.1 Incluido

- Rediseño del diálogo compartido de crear/editar rutina.
- Stepper accesible de tres pasos.
- Manejo visual de listas con más de cinco ejercicios.
- Reordenamiento explícito de ejercicios.
- Campo `restSeconds` por ejercicio.
- Migración, validación, lectura y escritura de `restSeconds`.
- Visualización de descanso en el detalle de rutina del dashboard y móvil.
- Selector, validaciones, listado y acciones de adjuntos en el dashboard usando estado mock.
- Sección móvil de material de apoyo usando fixtures compatibles con el contrato futuro.
- Panel de asistencia iniciado desde la agenda del entrenador.
- Estados de presente, ausente y pendiente.
- Registro manual con alerta de “sin reserva”.
- Finalización y reporte visual por clase.
- Estados vacíos, errores de validación, accesibilidad y diseño responsivo.
- Pruebas y verificaciones descritas en este documento.

### 4.2 No incluido

- Servicio real de almacenamiento de archivos.
- Persistencia de adjuntos en PostgreSQL.
- Escaneo antivirus, URL firmada, CDN o política de retención.
- Sincronización de un archivo recién seleccionado en dashboard con el móvil.
- API o persistencia real de asistencia.
- Notificaciones por asistencia, ausencia o registro manual.
- Exportación PDF/CSV del reporte de asistencia.
- Reapertura o corrección de una clase después de finalizar la asistencia.
- Control de asistencia desde móvil.
- Temporizador automático de descanso durante una sesión.
- Rediseño general de la agenda, reservas, catálogo de ejercicios o historial de versiones.
- Un límite de producto al número de ejercicios de una rutina. La interfaz debe escalar sin introducir un máximo artificial.

## 5. Actores y permisos

| Actor                         | Capacidad                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Entrenador autenticado        | Crear y editar sus rutinas, configurar descanso, gestionar adjuntos simulados y tomar asistencia de sus clases. |
| Miembro autenticado           | Consultar descanso y material de apoyo de una rutina asignada.                                                  |
| Administrador                 | No recibe nuevas capacidades específicas en este alcance.                                                       |
| Usuario sin rol de entrenador | No debe ver controles de edición, carga de adjuntos ni toma de asistencia.                                      |

Las protecciones existentes de rutas y API se mantienen. Esta especificación no reemplaza autorización del servidor con ocultamiento visual.

## 6. Línea base propuesta dentro del enfoque aprobado

| Tema                       | Decisión                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Contenedor                 | Se conserva el diálogo actual para reducir el impacto del cambio.                        |
| Cantidad de pasos          | Tres: “Datos generales”, “Ejercicios” y “Material y revisión”.                           |
| Creación y edición         | Usan el mismo componente y las mismas reglas; edición precarga la rutina.                |
| Descanso                   | Se define por ejercicio, en segundos.                                                    |
| Valor inicial              | 60 segundos para ejercicios nuevos y registros existentes migrados.                      |
| Rango de descanso          | Entero entre 0 y 600 inclusive. Cero significa “sin descanso”.                           |
| Escala de ejercicios       | La navegación/lista interna tiene scroll propio; el diálogo no crece por cada ejercicio. |
| Orden                      | Botones accesibles de subir/bajar; no se exige drag and drop.                            |
| Formatos de adjunto        | PDF, JPG/JPEG, PNG y WEBP.                                                               |
| Tamaño de adjunto          | Máximo 10 MiB por archivo.                                                               |
| Cantidad de adjuntos       | Máximo 5 por rutina en la experiencia mock.                                              |
| Persistencia de adjuntos   | Solo memoria de la sesión del dashboard y fixtures estáticos en móvil.                   |
| Acceso móvil               | Solo lectura/apertura de material; no carga ni eliminación.                              |
| Entrada a asistencia       | Acción “Tomar asistencia” en cada ocurrencia de clase programada dentro de la agenda.    |
| Registro manual            | Requiere alerta y confirmación; se registra como presente y “sin reserva”.               |
| Finalización               | Solo se permite cuando no quedan asistentes reservados en estado pendiente.              |
| Reporte                    | Resumen y listado en pantalla; no exportable.                                            |
| Persistencia de asistencia | Estado mock durante la sesión de la aplicación; se reinicia al recargar.                 |

Estos valores son la propuesta concreta que hace verificable el enfoque aprobado. Solo se convierten en línea base de planificación cuando el solicitante apruebe este documento.

## 7. Flujo 1: stepper para crear y actualizar rutinas

### 7.1 Estructura

El diálogo debe mostrar:

1. Encabezado con título “Nueva rutina” o “Editar rutina”.
2. Indicador de tres pasos con nombre, número y estado.
3. Área de contenido de altura controlada.
4. Pie fijo con las acciones “Cancelar”, “Anterior”, “Siguiente” o la acción final.

Estados visuales del indicador:

- Actual: se identifica con texto y contraste, no solo color.
- Completado: muestra marca de completado.
- Pendiente: se ve disponible pero no activo.
- Con error: se identifica cuando el usuario intenta avanzar y el paso no es válido.

### 7.2 Navegación

- “Siguiente” valida únicamente los campos necesarios para abandonar el paso actual.
- “Anterior” nunca descarta valores ni muestra validaciones nuevas.
- El usuario puede volver a un paso completado desde el indicador.
- No puede saltar directamente a un paso futuro cuya dependencia anterior no sea válida.
- El estado completo del formulario se conserva mientras el diálogo siga abierto.
- La tecla Enter dentro de un campo no debe enviar prematuramente toda la rutina.
- El envío real solo ocurre desde el último paso.
- Durante una mutación pendiente se deshabilitan navegación, cierre accidental y envío duplicado.

### 7.3 Paso 1 — Datos generales

| Campo             | Crear      | Editar     | Regla                                                          |
| ----------------- | ---------- | ---------- | -------------------------------------------------------------- |
| Nombre            | Vacío      | Precargado | Obligatorio, se recorta al guardar, máximo 120 caracteres.     |
| Objetivo          | Vacío      | Precargado | Opcional; cadena vacía se convierte en ausencia de valor.      |
| Motivo del cambio | No visible | Vacío      | Opcional, solo edición; se envía únicamente si contiene texto. |

Requisitos:

- El mensaje de nombre obligatorio aparece junto al campo.
- Al fallar la validación, el foco pasa al primer campo inválido.
- La posible respuesta de rutina duplicada del servidor se conserva y se muestra sin cerrar el diálogo.

### 7.4 Paso 2 — Ejercicios

El paso se divide conceptualmente en:

- Una lista compacta de ejercicios de la rutina.
- Un editor del ejercicio seleccionado.
- Acciones para agregar, eliminar y reordenar.

En pantallas amplias, lista y editor pueden presentarse en dos columnas. En pantallas estrechas se apilan y la lista permanece compacta.

#### 7.4.1 Lista compacta

Cada elemento muestra como mínimo:

- Número de orden.
- Nombre del ejercicio o “Ejercicio sin seleccionar”.
- Resumen de series × repeticiones.
- Descanso formateado, por ejemplo “60 s” o “Sin descanso”.
- Indicador de error si el elemento es incompleto.

Reglas:

- La lista tiene un alto máximo y scroll interno cuando supera cinco elementos.
- El ejercicio seleccionado permanece visible al navegar por la lista.
- La interfaz debe probarse con 1, 5, 6, 12 y 50 ejercicios.
- Agregar crea un elemento al final, lo selecciona y le asigna `displayOrder` consecutivo.
- Eliminar pide confirmación solo si el elemento contiene cambios respecto a su valor inicial.
- No se puede dejar la rutina sin al menos un ejercicio.
- Subir/bajar intercambia el orden y vuelve a normalizar `displayOrder` desde 1.
- El reordenamiento no cambia el contenido de los ejercicios.
- Se permite seleccionar el mismo `exerciseId` más de una vez. Cada ocurrencia es independiente gracias a `routineExerciseId`, por lo que puede tener series, repeticiones, descanso, notas y orden propios.
- En creación, cada ocurrencia repetida nace sin identificador y recibe uno distinto desde la API. En edición, nunca se reconcilia por `exerciseId`.

#### 7.4.2 Editor de ejercicio

| Campo                 | Tipo                              | Valor inicial | Validación                                                   |
| --------------------- | --------------------------------- | ------------- | ------------------------------------------------------------ |
| Ejercicio             | Selector                          | Sin selección | Obligatorio; disponible o valor legado conservado al editar. |
| Series                | Número entero                     | 3 en nuevos   | Opcional; vacío equivale a `null`; si existe, entre 1 y 99.  |
| Repeticiones          | Texto                             | Vacío         | Opcional, máximo 40 caracteres para respetar la base actual. |
| Descanso entre series | Número entero + sufijo “segundos” | 60            | Obligatorio, entre 0 y 600.                                  |
| Notas                 | Texto                             | Vacío         | Opcional, máximo 500 caracteres en frontend.                 |

Reglas de descanso:

- El control debe explicar que el valor se aplica entre las series del ejercicio.
- Cero se muestra como “Sin descanso”.
- No se aceptan decimales, números negativos, valores mayores a 600, texto, `NaN` ni campos vacíos.
- Los controles de incremento no deben producir un valor fuera del rango.
- Al editar una rutina migrada, el valor precargado es 60.

Reglas del catálogo de ejercicios:

- Mientras el catálogo carga, se muestra un estado de carga; agregar, cambiar selección y avanzar quedan deshabilitados.
- Si la consulta falla, se muestra un error con acción de reintentar y no se descarta el estado del formulario.
- Si el catálogo está vacío, se explica que no hay ejercicios disponibles y no se permite completar una rutina nueva.
- Al editar, un ejercicio original que ya no aparezca en el catálogo se conserva como opción de solo permanencia con la etiqueta “No disponible”. Puede mantenerse o eliminarse, pero no volver a seleccionarse después de reemplazarlo.
- Un ejercicio legado es válido únicamente cuando conserva el mismo `exerciseId` del elemento original. Los elementos nuevos deben proceder del catálogo disponible.

#### 7.4.3 Validación del paso

Para avanzar:

- Debe existir al menos un ejercicio.
- Todos los elementos deben tener ejercicio seleccionado.
- Series, cuando tenga valor, y descanso deben ser enteros dentro de rango.
- Repeticiones y notas deben respetar sus límites.
- Si hay varios errores, se muestra un resumen y se selecciona el primer ejercicio inválido.

#### 7.4.4 Identidad y compatibilidad con ejecuciones

- Cada elemento precargado en edición conserva `routineExerciseId`, que corresponde al `id` real de `app.routine_exercises`.
- Los elementos agregados durante la edición no tienen `routineExerciseId` hasta que la API los crea.
- Cambiar series, repeticiones, descanso, notas u orden conserva el identificador existente.
- La API rechaza un identificador que no pertenezca a la rutina editada.
- Si un ejercicio tiene registros de ejecución, no puede eliminarse ni sustituirse por otro `exerciseId` dentro de este alcance. La API responde 409 con un código de dominio y el stepper restaura/selecciona el elemento afectado sin perder otros cambios.
- Para poder restaurarlo, el formulario conserva una copia inmutable de los elementos originales hasta que el guardado finaliza; el error 409 identifica `routineExerciseId`.
- Un ejercicio sin registros puede eliminarse o sustituirse.
- El servicio aplica el cambio de orden en dos fases dentro de la transacción: primero mueve temporalmente los órdenes existentes a un rango positivo sin colisiones y después escribe la secuencia final. Esto evita violar la clave única `(routine_id, display_order)` durante intercambios.

### 7.5 Paso 3 — Material y revisión

El paso incluye:

1. Resumen de datos generales.
2. Resumen ordenado de ejercicios.
3. Zona “Archivos adjuntos”.
4. Motivo de cambio en edición, si corresponde.
5. Acción final.

Acción final:

- Crear: “Crear rutina”.
- Editar: “Guardar cambios”.
- Muestra spinner y evita doble clic mientras la mutación está pendiente.
- Si la API de rutina falla, el stepper permanece abierto, conserva los datos y muestra un error accionable.
- El callback de envío devuelve el identificador de la rutina guardada. Solo después se asocian de forma síncrona los adjuntos al repositorio mock; los adjuntos nunca entran al payload de la API.

### 7.6 Cierre y cambios sin guardar

- Si el formulario no cambió, “Cancelar”, Escape o cerrar el diálogo lo cierran directamente.
- Si cambió cualquier campo, ejercicio, orden, descanso o adjunto, se solicita confirmación antes de descartar.
- Confirmar descarte reinicia todo el estado.
- Cancelar el descarte devuelve al mismo paso y conserva los datos.
- Después de un guardado exitoso se reinicia el stepper al paso 1 para la próxima apertura.

## 8. Flujo 2: persistencia del descanso entre series

### 8.1 Modelo canónico

El nombre canónico en TypeScript será `restSeconds`. En base de datos será `rest_seconds`.

```ts
interface RoutineExercise {
    id: string;
    routineId: string;
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    restSeconds: number;
    notes: string | null;
}
```

El modelo editable usa el identificador estable:

```ts
interface RoutineFormExercise {
    routineExerciseId?: string;
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    restSeconds: number;
    notes?: string;
}
```

Invariantes:

- `restSeconds` siempre es un entero.
- `0 <= restSeconds <= 600`.
- El valor no es nulo en respuestas nuevas.
- Los registros existentes reciben 60 durante la migración.
- `sets` conserva la nulabilidad del modelo actual. Un valor `null` se presenta vacío al editar y puede guardarse sin convertirlo silenciosamente en 3.
- Un `exerciseId` puede repetirse; la identidad de cada ocurrencia es el `id` de `RoutineExercise`, que se conserva durante una actualización.

### 8.2 Base de datos

La tabla `app.routine_exercises` debe recibir:

- Columna `rest_seconds integer NOT NULL DEFAULT 60`.
- Restricción check para `rest_seconds >= 0 AND rest_seconds <= 600`.
- Migración versionada generada con el flujo Drizzle del repositorio.
- Backfill seguro de registros existentes a 60 antes o como parte de aplicar `NOT NULL`.

No se modifica la clave única de orden ni las relaciones existentes.

### 8.3 API

`RoutineExerciseDto` debe:

- Aceptar `restSeconds`.
- Normalizar también `rest_seconds` para mantener la compatibilidad camelCase/snake_case existente.
- Aceptar únicamente un número JSON finito y entero. El frontend convierte el texto del control antes de construir el payload.
- Rechazar ausente, decimal, negativo, mayor a 600 y cadenas numéricas como `"90"` con un error 400.
- Aceptar `routineExerciseId` opcional únicamente en actualizaciones: un elemento existente debe enviarlo y un elemento nuevo debe omitirlo.
- Rechazar `routineExerciseId` en creación de rutina para no aceptar identidades suministradas por el cliente.
- Exigir `displayOrder` en cada elemento sin completar ausencias con un valor por defecto.

Los normalizadores de creación y actualización deben copiar el campo. El servicio debe:

- Insertarlo al crear la rutina.
- Reemplazarlo al actualizar ejercicios.
- Incluirlo en lecturas de entrenador y miembro.
- Incluirlo en el snapshot del historial de versiones.
- En actualización, reconciliar por `routineExerciseId` y no por una búsqueda ambigua de `exerciseId`.
- Conservar el `id` al modificar objetivos u orden para no romper referencias de ejecuciones históricas.
- Rechazar con 422 un `routineExerciseId` desconocido o perteneciente a otra rutina.
- Rechazar con 409 la eliminación o sustitución de un elemento referenciado por `exercise_logs`; nunca debe conservarlo silenciosamente ni reinterpretar su historial.
- Validar que los `displayOrder` formen exactamente el conjunto entero `1..n`. Un valor ausente, repetido, cero o con salto devuelve 422 con código `INVALID_DISPLAY_ORDER`.
- Aplicar el orden final en dos fases positivas sin colisionar con `uq_routine_exercise_order`.

Ejemplo de ejercicio en solicitud:

```json
{
    "exerciseId": "00000000-0000-0000-0000-000000000000",
    "displayOrder": 1,
    "sets": 3,
    "reps": "8-12",
    "restSeconds": 90,
    "notes": "Mantener técnica controlada"
}
```

### 8.4 Dashboard

- `RoutineExercise`, `RoutineFormExercise` y el payload incluyen `restSeconds`.
- Crear y editar envían el valor de cada ejercicio.
- El detalle de rutina agrega una columna o dato “Descanso”.
- El formato visible usa segundos hasta 59 y una representación legible a partir de 60; por ejemplo, 90 se puede mostrar como “1 min 30 s”.
- La ausencia inesperada de un valor en una respuesta antigua se normaliza visualmente a 60, sin enviar `undefined`.

### 8.5 Móvil

- Los tipos de entrenamiento incluyen `restSeconds`.
- La tarjeta de cada ejercicio muestra el descanso objetivo junto con series y repeticiones.
- Cero se muestra como “Sin descanso”.
- No se agrega temporizador en este alcance.
- La aplicación continúa tolerando temporalmente respuestas antiguas sin el campo, mostrando 60 como respaldo.

### 8.6 Compatibilidad e historial

- Una actualización de rutina debe guardar `rest_seconds` en el snapshot versionado.
- Las versiones anteriores que no tengan el campo se interpretan con 60 al presentarse.
- El comparador del historial incluye descanso por ejercicio. Un cambio únicamente de descanso debe mostrarse como modificación y nunca como “Sin cambios”.
- Para comparar un snapshot legado, un `rest_seconds` ausente se normaliza a 60 antes del diff.
- El cambio no altera registros de ejecución ya guardados.

## 9. Flujo 3: archivos adjuntos en rutinas — HU-ENT-002

### 9.1 Naturaleza del mock

La UI debe ser funcional para seleccionar, validar, listar, quitar y abrir archivos durante la sesión actual, pero:

- No envía el contenido al backend.
- No incluye adjuntos dentro del payload real de rutina.
- No promete persistencia después de recargar.
- No sincroniza archivos nuevos con otro dispositivo.
- El móvil usa adjuntos predefinidos compatibles con el mismo contrato.

La interfaz o los datos de desarrollo deben dejar claro el carácter simulado sin introducir mensajes técnicos intrusivos para el usuario final.

### 9.2 Contrato de frontend

```ts
interface RoutineAttachment {
    id: string;
    routineId: string;
    fileName: string;
    mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
    sizeBytes: number;
    downloadUrl: string;
    createdAt: string;
    isMock: true;
    source: 'LOCAL_OBJECT_URL' | 'FIXTURE_URL';
}

type EditableRoutineAttachment = Omit<RoutineAttachment, 'routineId'>;

interface RoutineAttachmentsRepository {
    list(routineId: string): readonly RoutineAttachment[];
    replace(routineId: string, attachments: readonly EditableRoutineAttachment[]): void;
    dispose(): void;
}

type SubmitRoutine = (data: RoutineFormData) => Promise<{ routineId: string }>;
```

Los tipos y el repositorio deben vivir fuera de los componentes visuales para que un hook de API pueda reemplazar el mock.

Propiedad y ciclo de vida:

- El formulario es dueño de las URL locales mientras los archivos están en borrador.
- Cancelar o descartar revoca únicamente las URL locales que todavía están en borrador.
- `list` devuelve también `source`; al editar, el formulario elimina únicamente `routineId` para obtener un `EditableRoutineAttachment` que puede reenviarse sin perder metadatos de propiedad.
- `replace` transfiere al repositorio la propiedad de las URL confirmadas y asocia el conjunto completo al `routineId` devuelto por la mutación real.
- El repositorio mantiene válidas esas URL aunque el diálogo se desmonte, para que editar nuevamente durante la misma sesión precargue y abra los archivos.
- Al reemplazar o eliminar un adjunto confirmado, el repositorio revoca la URL anterior que dejó de utilizarse.
- `dispose` revoca todas las URL locales al terminar la sesión de la página. Recargar inicia un repositorio vacío.
- Las operaciones del repositorio mock son síncronas y no tienen un estado de error artificial. Los errores de una futura API quedan fuera de este mock y deberán especificarse cuando esa integración exista.

### 9.3 Selección

- La zona acepta clic, teclado y soltar archivos.
- Permite selección múltiple.
- El texto informa formatos, tamaño máximo y límite de cantidad antes de seleccionar.
- El atributo `accept` restringe el selector, pero la validación de JavaScript sigue siendo obligatoria.
- Un archivo de cero bytes se rechaza.
- Un archivo cuyo tipo MIME no coincide con los permitidos se rechaza, aunque su extensión parezca válida.
- Un archivo mayor a 10 MiB se rechaza.
- No se aceptan más de cinco adjuntos válidos en total.
- Un archivo con mismo nombre y tamaño que uno ya listado se considera duplicado y se rechaza.

Cuando una selección contiene archivos válidos e inválidos:

- Los válidos se agregan.
- Los inválidos no se agregan.
- Se muestra un resumen por archivo con la causa concreta.

### 9.4 Lista de adjuntos

Cada fila muestra:

- Icono por tipo.
- Nombre legible.
- Tamaño formateado.
- Acción “Abrir/Descargar”.
- Acción “Quitar” en dashboard.

Reglas:

- Los nombres largos se truncan visualmente, pero el nombre completo queda disponible de forma accesible.
- Quitar un archivo requiere confirmación solo si ya estaba asociado al mock de una rutina existente.
- Las URL de borrador se revocan al descartarse. Las confirmadas las administra el repositorio y solo se revocan al reemplazarse, eliminarse o ejecutar `dispose`.
- La descarga no ejecuta contenido dentro del DOM.
- Un fallo al abrir muestra “No se pudo abrir el archivo. Inténtalo nuevamente.”

### 9.5 Crear y editar

- Crear inicia sin adjuntos.
- Editar precarga los adjuntos mock asociados a la rutina.
- Al crear, primero se guarda la rutina real y después se ejecuta `replace` con el `routineId` devuelto.
- Al editar, se trabaja sobre una copia de `list(routine.id)` y solo se reemplaza el conjunto confirmado después de guardar la rutina.
- Volver entre pasos conserva archivos y errores.
- Cerrar con archivos seleccionados activa la confirmación de cambios sin guardar.
- Los adjuntos no condicionan la validez de una rutina; son opcionales.

### 9.6 Móvil — Material de apoyo

En el detalle de rutina:

- Se agrega una sección “Material de apoyo”.
- Si hay archivos, se muestra nombre, tipo/tamaño y acción de abrir o descargar.
- Si no hay archivos, se muestra un estado vacío breve.
- Se utiliza `Linking` o la capacidad equivalente ya disponible para abrir el URL.
- El error al abrir se informa sin cerrar la pantalla.
- No se muestran acciones de cargar, reemplazar o eliminar.
- Los fixtures móviles se resuelven mediante un adaptador determinista: primero por `routineId` y, para el seed dinámico actual, por la clave normalizada del nombre `PECHO & TRÍCEPS`. El test usa esa rutina realmente asignada por `seed-ent.sql`.
- Los archivos agregados en dashboard no aparecen en móvil; esa no sincronización sigue siendo una limitación explícita del mock.

## 10. Flujo 4: asistencia a clases grupales — HU-ENT-004

### 10.1 Integración con la agenda existente

La tabla actual de reservas se conserva para no degradar HU-RES-004. En la misma pestaña se agrega una sección compacta “Asistencia de clases” alimentada por ocurrencias programadas, no por la existencia de filas de reserva.

- Cada ocurrencia programada muestra clase, horario, cantidad de reservas elegibles, estado y acción “Tomar asistencia”.
- Una clase con cero reservas sigue teniendo una ocurrencia y permite abrir el panel para registrar manualmente.
- Una clase cancelada muestra su estado y deshabilita la acción.
- Todas las reservas que comparten `classOccurrenceId` alimentan un único roster central.
- Cambiar de fecha actualiza tanto ocurrencias como reservas y conserva los estados vacíos apropiados.
- La tabla de reservas mantiene sus acciones actuales; la entrada principal de asistencia vive en la lista de ocurrencias para evitar duplicados.

### 10.2 Contratos de frontend

```ts
type AttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT';
type AttendanceSource = 'RESERVATION' | 'MANUAL_NO_RESERVATION';
type ClassAttendanceStatus = 'OPEN' | 'FINALIZED';
type AgendaReservationStatus = 'CONFIRMED' | 'RESCHEDULED' | 'WAITLISTED' | 'LATE_CANCELLED' | 'CANCELLED';

interface ClassOccurrence {
    id: string;
    className: string;
    startsAt: string;
    endsAt: string;
    status: 'SCHEDULED' | 'CANCELLED';
}

interface AgendaReservation {
    id: string;
    classOccurrenceId: string;
    memberId: string;
    memberName: string;
    status: AgendaReservationStatus;
}

interface AttendanceMemberOption {
    id: string;
    name: string;
}

interface AttendanceEntry {
    id: string;
    classOccurrenceId: string;
    memberId: string;
    memberName: string;
    source: AttendanceSource;
    status: AttendanceStatus;
    markedAt: string | null;
}

interface ClassAttendance {
    classOccurrenceId: string;
    className: string;
    startsAt: string;
    endsAt: string;
    status: ClassAttendanceStatus;
    entries: AttendanceEntry[];
    finalizedAt: string | null;
}

type AttendanceErrorCode =
    | 'NOT_FOUND'
    | 'CLASS_CANCELLED'
    | 'DUPLICATE_MEMBER'
    | 'PENDING_ENTRIES'
    | 'ALREADY_FINALIZED';

type AttendanceResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: { code: AttendanceErrorCode; message: string } };

interface AttendanceRepository {
    listOccurrences(dayKey: string): readonly ClassOccurrence[];
    searchMembers(classOccurrenceId: string, query: string): readonly AttendanceMemberOption[];
    getAttendance(classOccurrenceId: string): ClassAttendance | undefined;
    setStatus(
        classOccurrenceId: string,
        entryId: string,
        status: 'PRESENT' | 'ABSENT',
    ): AttendanceResult<ClassAttendance>;
    addManual(classOccurrenceId: string, member: { id: string; name: string }): AttendanceResult<ClassAttendance>;
    finalize(classOccurrenceId: string): AttendanceResult<ClassAttendance>;
    subscribe(listener: () => void): () => void;
    reset(): void;
}
```

La vista consume el repositorio mediante hooks y no importa directamente fixtures ni reglas de mutación.

Reglas de elegibilidad:

- `CONFIRMED` es una reserva activa y entra al roster.
- `RESCHEDULED` entra al roster de su `classOccurrenceId` actual; el fixture ya representa el horario nuevo.
- `WAITLISTED`, `LATE_CANCELLED` y `CANCELLED` no entran al roster.
- `getAttendance` devuelve un roster definido para toda ocurrencia `SCHEDULED`, incluso con cero reservas; solo devuelve `undefined` para un ID inexistente.
- Las mutaciones sobre una ocurrencia cancelada devuelven `CLASS_CANCELLED`.
- Los mocks deben contener `memberId`, marcas ISO completas y al menos dos reservas que compartan una ocurrencia para probar agrupación.
- `searchMembers(classOccurrenceId, query)` consulta el catálogo mock central, excluye miembros ya presentes en ese roster y devuelve una lista vacía cuando no hay candidatos.
- `subscribe` permite que lista, panel y reporte observen una única fuente de estado.
- `reset` restaura fixtures al recargar o reiniciar la sesión mock.

### 10.3 Apertura del panel

El panel muestra:

- Nombre de clase.
- Fecha y horario.
- Conteo de reservas activas.
- Conteos actuales de presente, ausente y pendiente.
- Lista de miembros.
- Acción “Registrar miembro sin reserva”.
- Acción “Finalizar asistencia”.

El foco inicial se coloca en el título o primer control relevante. Cerrar devuelve el foco a la acción que abrió el panel.

### 10.4 Marcar presente o ausente

- Cada persona con reserva inicia en `PENDING`.
- El entrenador puede marcar `PRESENT` o `ABSENT`.
- Puede cambiar la selección mientras la asistencia esté abierta.
- El estado usa texto/icono además de color.
- Marcar actualiza el conteo de forma inmediata.
- La marca temporal mock se registra cuando se elige presente o ausente.
- No se permite cambiar entradas después de finalizar.

### 10.5 Registro manual sin reserva

Flujo:

1. El entrenador selecciona “Registrar miembro sin reserva”.
2. Busca o selecciona un miembro mediante `attendanceRepository.searchMembers(classOccurrenceId, query)`; el diálogo nunca importa fixtures directamente.
3. Si ya figura en el roster, la acción se bloquea y se informa “El miembro ya está registrado en esta clase”.
4. Si no tiene reserva, se muestra la alerta: “Este miembro no tiene una reserva activa para la clase. ¿Deseas registrar su asistencia manualmente?”
5. Cancelar no modifica el roster.
6. Confirmar agrega una entrada con fuente `MANUAL_NO_RESERVATION`, estado `PRESENT` y marca temporal.
7. La fila y el reporte muestran una insignia “Sin reserva”.

Un registro manual representa una llegada efectiva; por eso se crea como presente. Antes de finalizar puede cambiarse a ausente si el entrenador corrige la acción.

### 10.6 Finalización

- “Finalizar asistencia” está deshabilitado si existe al menos una entrada `PENDING`.
- Se indica cuántas personas faltan por marcar.
- Con cero pendientes se solicita confirmación porque el panel quedará de solo lectura.
- Confirmar cambia el estado a `FINALIZED` y guarda `finalizedAt`.
- Cancelar conserva el estado abierto.
- Una clase finalizada abre directamente el reporte de solo lectura.
- No existe reapertura en este alcance.

### 10.7 Reporte

El reporte final muestra:

- Total de registros.
- Total presentes.
- Total ausentes.
- Total de registros manuales sin reserva.
- Listado de presentes.
- Listado de ausentes.
- Identificación visual de registros manuales.
- Fecha y hora mock de finalización.

Invariantes:

- Al finalizar no hay entradas pendientes.
- `presentes + ausentes = total de registros`.
- `manuales <= presentes + ausentes`.
- Cada miembro aparece una sola vez por ocurrencia de clase.

El reporte es visual. No se requiere descarga ni impresión.

### 10.8 Estado vacío

- Clase sin reservas: se muestra “No hay miembros con reserva para esta clase” y sigue disponible el registro manual.
- Catálogo sin miembros disponibles: se explica que no hay personas elegibles para registro manual.
- Asistencia finalizada sin registros: el reporte muestra ceros y no falla.

## 11. Arquitectura propuesta y límites de componentes

### 11.1 Rutinas

| Unidad                    | Responsabilidad                                                       | Dependencias                                                     |
| ------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `RoutineForm`             | Orquestar apertura, modo crear/editar, paso actual, envío y descarte. | Mutación entregada por la ruta y estado agregado del formulario. |
| `RoutineStepper`          | Mostrar estados y navegación accesible.                               | Índice actual y validación por paso.                             |
| `RoutineGeneralStep`      | Editar nombre, objetivo y motivo de cambio.                           | Modelo de formulario y errores del paso 1.                       |
| `RoutineExercisesStep`    | Administrar lista, selección, orden y editor.                         | Catálogo de ejercicios y reglas de ejercicio.                    |
| `RoutineExerciseEditor`   | Editar un solo ejercicio.                                             | Un elemento y callback de actualización.                         |
| `RoutineReviewStep`       | Resumen, adjuntos y envío final.                                      | Modelo validado y repositorio mock de adjuntos.                  |
| `routine-form-validation` | Reglas puras por paso y normalización.                                | Sin UI ni llamadas HTTP.                                         |

`RoutineForm` no debe volver a concentrar el marcado y todas las reglas en un único archivo grande.

Interfaces mínimas:

```ts
interface RoutineFormData {
    name: string;
    objective?: string;
    exercises: RoutineFormExercise[];
    changeReason?: string;
}

interface RoutineFormProps {
    open: boolean;
    routine?: Routine | null;
    onOpenChange(open: boolean): void;
    onSubmit(data: RoutineFormData): Promise<{ routineId: string }>;
    attachmentsRepository: RoutineAttachmentsRepository;
}
```

- `RoutineStepper` recibe paso actual, estados de validación y `onStepRequest`.
- Cada paso recibe solo su fragmento de valor, errores y callbacks de cambio; no ejecuta mutaciones.
- `RoutineExercisesStep` recibe estados `loading/error/success`, catálogo, `onRetryCatalog` y operaciones puras de agregar, quitar y mover.
- `RoutineReviewStep` no conoce React Query ni la API; invoca la acción final entregada por `RoutineForm`.

### 11.2 Adjuntos

| Unidad                           | Responsabilidad                                                  |
| -------------------------------- | ---------------------------------------------------------------- |
| `RoutineAttachmentsField`        | Selector, drop zone, lista y mensajes.                           |
| `attachment-validation`          | Tipo, tamaño, cantidad, duplicados y tamaño legible.             |
| `routine-attachments-repository` | Interfaz de lectura/escritura mock y futura sustitución por API. |
| `mock-routine-attachments`       | Fixtures y estado en memoria de dashboard.                       |
| `RoutineSupportMaterial`         | Render de solo lectura en móvil.                                 |

El contrato ejecutable del repositorio se define en 9.2. El repositorio posee el mapa por `routineId`, las URL confirmadas y su limpieza; el componente posee únicamente borradores.

### 11.3 Asistencia

| Unidad                   | Responsabilidad                                  |
| ------------------------ | ------------------------------------------------ |
| `TrainerAgendaTab`       | Mantener agenda y abrir una ocurrencia de clase. |
| `ClassAttendanceDialog`  | Orquestar roster abierto/finalizado y reporte.   |
| `AttendanceRoster`       | Mostrar y modificar estados antes de finalizar.  |
| `ManualAttendanceDialog` | Selección, alerta y confirmación sin reserva.    |
| `AttendanceReport`       | Calcular y presentar el resumen final.           |
| `attendance-repository`  | Interfaz de consulta/mutación mock.              |
| `mock-attendance`        | Ocurrencias, rosters y catálogo de miembros.     |

Las métricas del reporte deben derivarse de `entries`; no se guardan como valores independientes susceptibles de desincronizarse.

- `TrainerAgendaTab` recibe la lista de ocurrencias y un callback `onOpenAttendance(classOccurrenceId)`.
- `AttendanceRoster` recibe entradas inmutables y `onStatusChange(entryId, status)`.
- `ManualAttendanceDialog` recibe resultados de `searchMembers`, muestra su estado vacío y devuelve un miembro seleccionado; la confirmación de “sin reserva” ocurre antes de llamar `addManual`.
- `ClassAttendanceDialog` traduce los códigos de `AttendanceResult` a mensajes y nunca modifica fixtures directamente.
- El repositorio recibe una función de reloj inyectable para producir `markedAt` y `finalizedAt` deterministas en pruebas.
- `subscribe` devuelve la función de desuscripción; los componentes deben ejecutarla al desmontarse.

## 12. Flujo de datos

### 12.1 Guardado de rutina

1. Se abre el diálogo y se normalizan valores iniciales.
2. El usuario completa pasos y validaciones locales.
3. El último paso produce un `RoutineFormData` normalizado.
4. `onSubmit` ejecuta la mutación real de crear o actualizar y resuelve `{ routineId }`.
5. La API valida y persiste `restSeconds`, identidades y orden.
6. La respuesta actualiza la caché de React Query.
7. `attachmentsRepository.replace(routineId, editableAttachments)` asocia el borrador fuera del payload real y conserva `source`.
8. El repositorio toma propiedad de las URL confirmadas y el diálogo se reinicia.

### 12.2 Lectura móvil

1. El móvil consulta el detalle real de rutina.
2. `restSeconds` llega desde la API.
3. El material de apoyo procede del repositorio mock móvil.
4. Ambos bloques se renderizan de forma independiente para que un fallo de URL no oculte la rutina.

### 12.3 Asistencia

1. La agenda obtiene ocurrencias y reservas mock normalizadas.
2. El repositorio deriva el roster con reservas `CONFIRMED` y `RESCHEDULED`.
3. La acción de una ocurrencia consulta su asistencia por `classOccurrenceId`, incluso con cero reservas.
4. Las marcas actualizan el repositorio mock central, no copias locales por fila.
5. Marcar guarda `markedAt` usando el reloj del repositorio.
6. Finalizar calcula invariantes, cambia a solo lectura, guarda `finalizedAt` y presenta el reporte.

## 13. Manejo de errores

| Situación                        | Comportamiento                                     |
| -------------------------------- | -------------------------------------------------- |
| Nombre vacío                     | Error inline, foco al nombre, no avanza.           |
| Ejercicio sin seleccionar        | Marca el elemento, lo selecciona y no avanza.      |
| Catálogo cargando                | Deshabilita selección/avance y muestra carga.      |
| Error al cargar catálogo         | Conserva el formulario y ofrece reintentar.        |
| Catálogo vacío                   | Estado vacío y bloqueo de nuevas rutinas.          |
| Ejercicio legado no disponible   | Permite conservarlo; no permite reseleccionarlo.   |
| Series fuera de rango            | Error inline; conserva el valor para corrección.   |
| Descanso inválido                | Explica rango 0–600 y no avanza.                   |
| API de rutina rechaza el payload | Mantiene abierto el stepper y conserva todo.       |
| Identificador ajeno a la rutina  | Error 422; no modifica la rutina.                  |
| Ejercicio con logs eliminado     | Error 409; restaura/selecciona el elemento.        |
| Rutina duplicada                 | Muestra el mensaje del servidor sin borrar campos. |
| Archivo de tipo inválido         | No lo agrega e informa formatos aceptados.         |
| Archivo demasiado grande         | No lo agrega e informa límite de 10 MiB.           |
| Sexto adjunto                    | No lo agrega e informa máximo de cinco.            |
| Archivo duplicado                | No lo agrega e identifica el nombre duplicado.     |
| URL de material no abre          | Mensaje no bloqueante y opción de reintentar.      |
| Miembro ya está en el roster     | Bloquea duplicado y conserva el panel.             |
| Miembro sin reserva              | Alerta y requiere confirmación manual.             |
| Hay pendientes al finalizar      | Botón deshabilitado y conteo visible.              |
| Clase ya finalizada              | Reporte de solo lectura.                           |
| Fixture/recurso mock ausente     | Estado vacío, nunca excepción sin controlar.       |

## 14. Accesibilidad

- Todos los pasos tienen nombres programáticos y el actual expone `aria-current="step"`.
- Los errores se asocian a sus campos y se anuncian mediante una región viva.
- La navegación completa funciona con teclado.
- Los botones de reordenamiento anuncian ejercicio y dirección.
- Los botones solo con icono tienen `aria-label`.
- Los estados presente/ausente/pendiente y válido/inválido no dependen únicamente del color.
- Los diálogos atrapan foco, restauran foco al cerrar y permiten Escape excepto durante envío pendiente.
- Las zonas de soltar archivos tienen una alternativa de botón de selección.
- El contraste conserva los tokens existentes del sistema.
- El zoom al 200 % no oculta acciones críticas ni obliga a desplazamiento horizontal de toda la página.

## 15. Diseño responsivo y rendimiento

- El diálogo ocupa como máximo el alto útil de la ventana.
- Encabezado de pasos y pie de acciones permanecen visibles; solo el contenido central se desplaza.
- En escritorio, la lista de ejercicios y su editor aprovechan dos columnas.
- Por debajo del breakpoint existente del dashboard, se apilan sin perder acciones.
- La tabla de asistencia puede desplazarse horizontalmente dentro del panel, no en la página completa.
- Ningún texto de archivo o miembro debe ensanchar el contenedor.
- Las actualizaciones de un ejercicio no deben reconstruir de forma visible toda la lista.
- El objetivo verificable es interacción fluida con 50 ejercicios y una clase de 100 asistentes mock en un equipo de desarrollo normal.

## 16. Compatibilidad con el diseño actual

- Se reutilizan `Dialog`, `Button`, `Input`, `Textarea`, `Select`, `ScrollArea`, `AlertDialog`, tablas y tokens existentes.
- Se conserva la paleta, tipografía y estilo de tarjetas del dashboard.
- Se conservan `sileo` y los patrones actuales de mensajes.
- No se añade una biblioteca de stepper o gestión de estado solo para este cambio.
- No se reemplaza React Query ni la estructura de rutas.
- La semántica funcional existente se conserva salvo los cambios explícitos de esta especificación: `restSeconds`, identidad estable por ocurrencia, orden validado/reconciliado y protección 409 de ejercicios con ejecuciones. Asignación y confirmación de sesiones no cambian.

## 17. Criterios de aceptación verificables

### AC-RUT-01 — Crear con stepper

**Dado** un entrenador en la lista de rutinas
**Cuando** abre “Nueva rutina”
**Entonces** ve tres pasos, no puede enviar antes del último y los datos se conservan al ir y volver.

### AC-RUT-02 — Editar con stepper

**Dado** una rutina existente
**Cuando** abre “Editar rutina”
**Entonces** se precargan nombre, objetivo, ejercicios, orden, descanso y adjuntos mock.

### AC-RUT-03 — Más de cinco ejercicios

**Dado** una rutina con 12 ejercicios
**Cuando** abre el paso de ejercicios
**Entonces** la lista usa scroll interno, el diálogo mantiene su alto y cualquier ejercicio puede seleccionarse y editarse.

### AC-RUT-04 — Reordenamiento

**Dado** tres ejercicios
**Cuando** intercambia posiciones, guarda y vuelve a consultar
**Entonces** la actualización no viola la clave única, conserva los identificadores y devuelve `displayOrder` 1, 2 y 3 sin duplicados.

### AC-RUT-05 — Validación de ejercicio

**Dado** uno o más ejercicios incompletos
**Cuando** intenta avanzar
**Entonces** no avanza, selecciona el primero inválido y muestra las causas.

### AC-RUT-06 — Agregar y eliminar

**Dado** una rutina editable y un ejercicio sin ejecuciones históricas
**Cuando** agrega uno nuevo, elimina el anterior, guarda y vuelve a consultar
**Entonces** el nuevo aparece una sola vez, el eliminado ya no aparece y los órdenes son consecutivos.

### AC-RUT-07 — Proteger historial

**Dado** un ejercicio referenciado por `exercise_logs`
**Cuando** intenta eliminarlo o sustituir su `exerciseId`
**Entonces** la API responde 409, la rutina no cambia y el stepper muestra el elemento afectado sin perder el resto del borrador.

### AC-RUT-08 — Repeticiones y catálogo

**Dado** dos posiciones con el mismo ejercicio y valores distintos
**Cuando** guarda y vuelve a consultar
**Entonces** ambas conservan identificadores y valores independientes; si el catálogo falla, el reintento no descarta el borrador.

### AC-RUT-09 — Orden malformado

**Dado** un payload manipulado con `displayOrder` ausente, repetido o con saltos
**Cuando** llega a crear o actualizar
**Entonces** la API responde 422 `INVALID_DISPLAY_ORDER` y no modifica la rutina.

### AC-REST-01 — Descanso válido

**Dado** un ejercicio con 90 segundos
**Cuando** guarda la rutina y vuelve a abrirla
**Entonces** dashboard y API conservan 90 y el móvil lo muestra.

### AC-REST-02 — Límites

**Dado** valores -1, 601, 1.5, `"90"`, otro texto o vacío
**Cuando** intenta avanzar o enviar
**Entonces** el frontend los rechaza y la API devuelve 400 ante el payload manipulado.

### AC-REST-03 — Migración

**Dado** un ejercicio creado antes de la migración
**Cuando** se consulta después de migrar
**Entonces** devuelve 60 segundos y puede editarse normalmente.

### AC-REST-04 — Historial de descanso

**Dado** una versión cuya única diferencia es `rest_seconds`
**Cuando** el entrenador consulta el historial
**Entonces** ve el cambio de descanso; un snapshot legado sin el campo se compara como 60.

### AC-ATTACH-01 — Carga mock válida

**Dado** un PDF menor o igual a 10 MiB
**Cuando** el entrenador lo selecciona
**Entonces** aparece en la lista con nombre, tamaño y acción de abrir/quitar.

### AC-ATTACH-02 — Formato inválido

**Dado** un archivo fuera de PDF/JPEG/PNG/WEBP
**Cuando** se selecciona
**Entonces** no se agrega y se informan los formatos aceptados.

### AC-ATTACH-03 — Tamaño y cantidad

**Dado** un archivo mayor a 10 MiB o un sexto adjunto
**Cuando** se selecciona
**Entonces** no se agrega y se indica el límite correspondiente.

### AC-ATTACH-04 — Vinculación mock después de crear

**Dado** una rutina nueva con un adjunto local válido
**Cuando** la API devuelve su `routineId` y el entrenador vuelve a editarla en la misma sesión
**Entonces** el adjunto está precargado, su URL sigue válida y nunca formó parte del payload real.

### AC-ATTACH-05 — Material móvil asignado

**Dado** la rutina asignada `PECHO & TRÍCEPS` y un fixture con URL válida
**Cuando** el miembro abre el detalle y activa el archivo
**Entonces** ve “Material de apoyo” y el sistema abre o descarga exitosamente el recurso.

### AC-ATTACH-06 — Fallo de URL móvil

**Dado** un fixture con URL no disponible
**Cuando** el miembro intenta abrirlo
**Entonces** permanece en el detalle y ve un error con opción de reintentar.

### AC-ATTACH-07 — Límite del mock

**Dado** adjuntos confirmados en dashboard
**Cuando** se inspecciona la solicitud real y luego se recarga la aplicación
**Entonces** la solicitud no contiene archivos/metadata de adjuntos y el estado local desaparece.

### AC-ATT-01 — Asistencia con reserva

**Dado** una ocurrencia con miembros reservados
**Cuando** el entrenador abre “Tomar asistencia” y marca presente/ausente
**Entonces** cada estado, `markedAt` y los conteos se actualizan inmediatamente en el roster central.

### AC-ATT-02 — Sin reserva

**Dado** un miembro no incluido en la clase
**Cuando** el entrenador intenta registrarlo
**Entonces** recibe una alerta y solo tras confirmar se agrega con insignia “Sin reserva”.

### AC-ATT-03 — Duplicado manual

**Dado** un miembro ya incluido
**Cuando** intenta agregarlo otra vez
**Entonces** no se duplica y se informa el motivo.

### AC-ATT-04 — Pendientes

**Dado** al menos un reservado en estado pendiente
**Cuando** revisa la acción final
**Entonces** “Finalizar asistencia” está deshabilitado y muestra cuántos faltan.

### AC-ATT-05 — Reporte final

**Dado** cero pendientes
**Cuando** confirma la finalización
**Entonces** ve totales y listados de presentes/ausentes, registros manuales y una vista de solo lectura.

### AC-ATT-06 — Clase sin reservas

**Dado** una ocurrencia programada con cero reservas
**Cuando** el entrenador la abre desde “Asistencia de clases”
**Entonces** ve el estado vacío, puede registrar manualmente y puede finalizar con invariantes válidos.

### AC-ATT-07 — Ocurrencia cancelada

**Dado** una ocurrencia `CANCELLED`
**Cuando** el entrenador consulta la agenda o fuerza una mutación del repositorio
**Entonces** la acción está deshabilitada y el repositorio devuelve `CLASS_CANCELLED` sin cambiar el roster.

### AC-MOCK-01 — Suscripción y reinicio

**Dado** dos consumidores suscritos al repositorio de asistencia
**Cuando** cambia un estado y luego se ejecuta `reset`
**Entonces** ambos observan el cambio, los desuscritos dejan de recibir eventos y los fixtures vuelven a su estado inicial.

### AC-REG-01 — Regresión

**Dado** las funciones existentes de rutinas y agenda
**Cuando** se completa el cambio
**Entonces** crear, editar, listar, ver detalle, asignar rutina, cambiar fecha de agenda y gestionar clases siguen funcionando.

## 18. Estrategia de pruebas

### 18.1 Pruebas unitarias

- Normalización y validación de `restSeconds`.
- Reindexación después de agregar, eliminar y mover.
- Reconciliación por `routineExerciseId`, ocurrencias repetidas y protección de ejercicios con logs.
- Validación de pasos.
- Tipo, tamaño, cantidad y duplicados de adjuntos.
- Transferencia y revocación de propiedad de URL en el repositorio mock.
- Cálculos del reporte de asistencia.
- Invariantes de finalización.
- Elegibilidad de estados de reserva y agrupación por ocurrencia.
- Suscripción, desuscripción y `reset` del repositorio de asistencia.

### 18.2 Pruebas de componentes

- Navegación completa del stepper en crear y editar.
- Persistencia de estado entre pasos.
- Manejo de 12 ejercicios y selección desde la lista desplazable.
- Estados cargando/error/vacío y ejercicio legado del catálogo.
- Confirmación de descarte.
- Error de mutación sin pérdida de estado.
- Selección mixta de archivos válidos e inválidos.
- Creación con adjunto, asociación al ID devuelto y reapertura en la misma sesión.
- Verificación de que los adjuntos no entran en la solicitud real y se limpian al recargar.
- Panel de asistencia, registro manual, bloqueo por pendiente y reporte.
- Ocurrencia sin reservas y dos reservas agrupadas en la misma clase.
- Catálogo de miembros vacío, ocurrencia cancelada y sincronización entre consumidores.
- Navegación por teclado y foco de errores.

Si el dashboard aún no dispone de un runner de componentes, las reglas puras deben quedar cubiertas y los flujos se verifican manualmente; no se añadirá una infraestructura de pruebas extensa sin un plan separado.

### 18.3 Pruebas de API

- Crear rutina con descanso 0, 60 y 600.
- Rechazar -1, 601, decimal, ausente, texto y cadena numérica.
- Actualizar y volver a leer el valor.
- Intercambiar órdenes sin violar la clave única.
- Rechazar órdenes ausentes, duplicados, cero y con saltos.
- Agregar/eliminar por `routineExerciseId`, conservar ocurrencias repetidas y bloquear eliminación con logs.
- Verificar detalle de entrenador y miembro.
- Verificar snapshot de versión.
- Verificar diff cuando solo cambia el descanso.
- Verificar backfill de migración.

### 18.4 Verificación manual visual

Matriz mínima:

| Superficie           | Tamaños/casos                                                                     |
| -------------------- | --------------------------------------------------------------------------------- |
| Dashboard rutinas    | 1, 5, 6, 12 y 50 ejercicios; crear y editar.                                      |
| Dashboard adjuntos   | vacío, 1 válido, 5 válidos, inválido por tipo, inválido por tamaño, nombre largo. |
| Dashboard asistencia | sin reservas, roster parcial, 100 personas, manual, finalizada.                   |
| Móvil rutina         | sin material, con material, URL fallida, descanso 0/60/90.                        |
| Accesibilidad        | teclado, 200 % de zoom, contraste y lector de estados.                            |

### 18.5 Comandos de calidad

La implementación debe ejecutar, como mínimo:

- Formato o `format:check` sobre archivos modificados.
- Typecheck de dashboard, móvil y API.
- Lint de los paquetes modificados.
- Pruebas de API.
- Build del dashboard y API.

Los comandos exactos se fijarán en el plan de implementación usando los scripts existentes del monorepo.

## 19. Trazabilidad

| Requisito                         | Historia/origen                               | Criterios                                  |
| --------------------------------- | --------------------------------------------- | ------------------------------------------ |
| Stepper crear/editar              | Solicitud de revisión + HU-ENT-001/HU-ENT-005 | AC-RUT-01 a AC-RUT-09                      |
| Descanso entre series             | Solicitud de revisión                         | AC-REST-01 a AC-REST-04                    |
| Selección/lista/error de adjuntos | HU-ENT-002 escenarios 1 y 2                   | AC-ATTACH-01 a AC-ATTACH-04 y AC-ATTACH-07 |
| Material móvil                    | HU-ENT-002 escenario 3                        | AC-ATTACH-05 y AC-ATTACH-06                |
| Marcar asistencia                 | HU-ENT-004 escenario 1                        | AC-ATT-01                                  |
| Sin reserva                       | HU-ENT-004 escenario 2                        | AC-ATT-02 y AC-ATT-03                      |
| Reporte final y estados de clase  | HU-ENT-004 escenario 3                        | AC-ATT-04 a AC-ATT-07                      |
| Ciclo de vida del mock            | Arquitectura de frontend                      | AC-MOCK-01                                 |
| Preservar agenda/rutinas          | Alcance de regresión                          | AC-REG-01                                  |

## 20. Riesgos y mitigaciones

| Riesgo                                                   | Mitigación                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| El mock de adjuntos se interpreta como persistencia real | Documentar la limitación, separar repositorio mock y no enviar datos falsos a la API.  |
| El descanso se añade solo en UI y se pierde              | Considerarlo obligatorio en migración, DTO, servicio, tipos, snapshot y móvil.         |
| Reordenar viola la clave única temporalmente             | Reconciliar por ID y aplicar el orden en dos fases positivas dentro de la transacción. |
| Eliminar reinterpreta ejecuciones históricas             | Bloquear eliminación/sustitución de elementos con logs mediante error 409.             |
| El stepper oculta errores en ejercicios no visibles      | Resumen de errores y selección automática del primero inválido.                        |
| La asistencia rompe la agenda existente                  | Conservar reservas y añadir una lista de ocurrencias independiente.                    |
| Conteos de asistencia se desincronizan                   | Derivarlos siempre de `entries`.                                                       |
| Objetos URL retienen memoria                             | Transferir propiedad al repositorio y revocar al quitar, reemplazar o disponer.        |
| Fixture móvil no coincide con ID dinámico                | Adaptador determinista por ID y clave normalizada del seed asignado.                   |
| Una rutina larga vuelve lento el diálogo                 | Componentes pequeños, actualizaciones localizadas y prueba con 50 ejercicios.          |
| El alcance se expande a backend de adjuntos/asistencia   | Mantener esos endpoints como no incluidos y preparar únicamente contratos.             |

## 21. Superficie probable de cambio

La lista orienta el plan; no autoriza refactorizaciones ajenas.

### Dashboard

- `apps/dashboard/src/src/features/dashboard/routines/components/routine-form.tsx`
- Nuevos componentes enfocados bajo `.../routines/components/`
- `apps/dashboard/src/src/features/dashboard/routines/types.ts`
- `apps/dashboard/src/routes/dashboard/routines/$id.tsx`
- `apps/dashboard/src/src/features/dashboard/classes/mock-classes.ts`
- `apps/dashboard/src/src/features/dashboard/classes/components/TrainerAgendaTab.tsx`
- Nuevos componentes/repositorios mock de asistencia y adjuntos.

### API y base de datos — descanso e identidad segura de ejercicios

- `apps/restapi/src/infra/database/pg/schemas/schema.ts`
- Nueva migración Drizzle.
- `apps/restapi/src/modules/routines/dto/routine-exercise.dto.ts`
- Normalizadores de crear/actualizar.
- `apps/restapi/src/modules/routines/routines.service.ts`
- Pruebas del módulo de rutinas.

### Móvil

- `apps/mobile/lib/api/types/training.ts`
- `apps/mobile/app/(tabs)/routines/[id].tsx`
- Fixtures/repositorio mock de material de apoyo.

## 22. Definición de terminado

El cambio se considera terminado únicamente cuando:

- Los tres pasos funcionan en crear y editar.
- Una rutina de 12 ejercicios es cómoda de revisar y modificar sin expandir el diálogo.
- Agregar, eliminar y reordenar conserva identidades y protege ejercicios con logs.
- Todos los valores de descanso se validan y persisten.
- Dashboard y móvil muestran el descanso.
- El historial detecta un cambio exclusivo de descanso.
- La migración conserva registros existentes con 60 segundos.
- La UI de adjuntos cubre válido, tipo inválido, tamaño inválido, cantidad, duplicado, quitar y abrir.
- Un adjunto nuevo reaparece durante la sesión, nunca entra en la API y desaparece al recargar.
- El móvil abre material mock de la rutina asignada y maneja fallo de apertura.
- La asistencia permite presente, ausente, manual sin reserva, clase vacía, bloqueo por pendientes y reporte final.
- La agenda y flujos existentes no sufren regresiones observables.
- Se cumplen typecheck, lint, pruebas y builds acordados.
- Se verifica accesibilidad básica y la matriz visual.
- Los límites mock de HU-ENT-002/HU-ENT-004 quedan explícitos en el PR.
- No quedan tareas pendientes sin describir, campos sin definir ni decisiones de producto ocultas.

## 23. Aprobación requerida antes de implementar

Este documento propone la línea base. La siguiente etapa será crear un plan de implementación ordenado por dependencias. No debe iniciarse implementación hasta que el solicitante revise esta especificación y confirme que refleja el cambio esperado.
