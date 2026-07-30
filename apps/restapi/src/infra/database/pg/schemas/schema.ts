import {
    pgSchema,
    index,
    unique,
    uniqueIndex,
    uuid,
    varchar,
    timestamp,
    foreignKey,
    primaryKey,
    date,
    time,
    text,
    check,
    integer,
    smallint,
    boolean,
    jsonb,
    numeric,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const app = pgSchema('app');
export const membershipStatusInApp = app.enum('membership_status', ['ACTIVE', 'SUSPENDED', 'EXPIRED']);
export const recordStatusInApp = app.enum('record_status', ['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const routineStatusInApp = app.enum('routine_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED']);
export const activitySourceInApp = app.enum('activity_source', ['HEALTH_CONNECT', 'MANUAL']);
export const dniTypeInApp = app.enum('dni_type', ['CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE']);
export const classSessionStatusInApp = app.enum('class_session_status', ['SCHEDULED', 'CANCELLED']);
export const classSessionCancelReasonInApp = app.enum('class_session_cancel_reason', [
    'MANUAL',
    'SERIES_INACTIVE',
    'SERIES_ARCHIVED',
    'SCHEDULE_REMOVED',
]);
export const reservationStatusInApp = app.enum('reservation_status', [
    'CONFIRMED',
    'WAITLISTED',
    'ATTENDED',
    'NO_SHOW',
    'CANCELLED',
]);
export const reservationReasonInApp = app.enum('reservation_reason', [
    'MEMBER_BOOKED',
    'MEMBER_JOINED_WAITLIST',
    'WAITLIST_PROMOTED',
    'MEMBER_CANCELLED',
    'ADMIN_CANCELLED',
    'LATE_CANCELLATION',
    'SESSION_CANCELLED',
    'SERIES_CHANGED',
    'WAITLIST_REMOVED',
    'WAITLIST_EXPIRED',
    'RESCHEDULED',
    'ATTENDANCE',
]);
export const classLevelInApp = app.enum('class_level', ['LOW', 'MEDIUM', 'HIGH']);

export const usersInApp = app.table(
    'users',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        keycloakSubject: uuid('keycloak_subject').notNull(),
        fullName: varchar('full_name', { length: 160 }).notNull(),
        email: varchar({ length: 255 }),
        phone: varchar({ length: 30 }),
        dni: varchar({ length: 20 }),
        dniType: dniTypeInApp('dni_type'),
        birthDate: date('birth_date'),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_users_keycloak_subject').using('btree', table.keycloakSubject.asc().nullsLast().op('uuid_ops')),
        unique('users_keycloak_subject_key').on(table.keycloakSubject),
        unique('users_dni_key').on(table.dni),
    ],
);

export type User = typeof usersInApp.$inferSelect;

export const membersInApp = app.table(
    'members',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        userId: uuid('user_id').notNull(),
        emergencyContactName: varchar('emergency_contact_name', { length: 120 }),
        emergencyContactPhone: varchar('emergency_contact_phone', { length: 30 }),
        joinedAt: date('joined_at')
            .default(sql`CURRENT_DATE`)
            .notNull(),
        notes: text(),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_members_status').using('btree', table.status.asc().nullsLast().op('enum_ops')),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [usersInApp.id],
            name: 'members_user_id_fkey',
        }),
        unique('members_user_id_key').on(table.userId),
    ],
);

export const trainersInApp = app.table(
    'trainers',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        userId: uuid('user_id').notNull(),
        specialty: varchar({ length: 120 }),
        biography: text(),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_trainers_status').using('btree', table.status.asc().nullsLast().op('enum_ops')),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [usersInApp.id],
            name: 'trainers_user_id_fkey',
        }),
        unique('trainers_user_id_key').on(table.userId),
    ],
);

export const staffInApp = app.table(
    'staff',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        userId: uuid('user_id').notNull(),
        hiredAt: date('hired_at')
            .default(sql`CURRENT_DATE`)
            .notNull(),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [usersInApp.id],
            name: 'staff_user_id_fkey',
        }),
        unique('staff_user_id_key').on(table.userId),
    ],
);

export const membershipPlansInApp = app.table(
    'membership_plans',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        name: varchar({ length: 80 }).notNull(),
        durationDays: integer('duration_days').notNull(),
        price: numeric({ precision: 10, scale: 2 }).notNull(),
        description: text(),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        unique('membership_plans_name_key').on(table.name),
        check('membership_plans_duration_days_check', sql`duration_days > 0`),
        check('membership_plans_price_check', sql`price >= (0)::numeric`),
    ],
);

export const membershipsInApp = app.table(
    'memberships',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        memberId: uuid('member_id').notNull(),
        planId: uuid('plan_id').notNull(),
        startDate: date('start_date').notNull(),
        endDate: date('end_date').notNull(),
        status: membershipStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_memberships_member_status_dates').using(
            'btree',
            table.memberId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
            table.startDate.asc().nullsLast().op('date_ops'),
            table.endDate.asc().nullsLast().op('date_ops'),
        ),
        foreignKey({
            columns: [table.memberId],
            foreignColumns: [membersInApp.id],
            name: 'memberships_member_id_fkey',
        }),
        foreignKey({
            columns: [table.planId],
            foreignColumns: [membershipPlansInApp.id],
            name: 'memberships_plan_id_fkey',
        }),
        check('chk_membership_dates', sql`end_date >= start_date`),
    ],
);

export const exercisesInApp = app.table(
    'exercises',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        name: varchar({ length: 120 }).notNull(),
        description: text(),
        muscleGroup: varchar('muscle_group', { length: 80 }),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [unique('exercises_name_key').on(table.name)],
);

export const routinesInApp = app.table(
    'routines',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        trainerId: uuid('trainer_id'),
        name: varchar({ length: 120 }).notNull(),
        objective: text(),
        status: routineStatusInApp().default('DRAFT').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_routines_trainer_status').using(
            'btree',
            table.trainerId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
        ),
        foreignKey({
            columns: [table.trainerId],
            foreignColumns: [trainersInApp.id],
            name: 'routines_trainer_id_fkey',
        }),
    ],
);

export const routineExercisesInApp = app.table(
    'routine_exercises',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        routineId: uuid('routine_id').notNull(),
        exerciseId: uuid('exercise_id').notNull(),
        displayOrder: integer('display_order').notNull(),
        sets: integer(),
        reps: varchar({ length: 40 }),
        restSeconds: integer('rest_seconds').default(60).notNull(),
        notes: text(),
    },
    (table) => [
        foreignKey({
            columns: [table.routineId],
            foreignColumns: [routinesInApp.id],
            name: 'routine_exercises_routine_id_fkey',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.exerciseId],
            foreignColumns: [exercisesInApp.id],
            name: 'routine_exercises_exercise_id_fkey',
        }),
        unique('uq_routine_exercise_order').on(table.displayOrder, table.routineId),
        check('routine_exercises_display_order_check', sql`display_order > 0`),
        check('routine_exercises_sets_check', sql`sets > 0`),
        check('routine_exercises_rest_seconds_check', sql`rest_seconds >= 0 AND rest_seconds <= 600`),
    ],
);

export const memberRoutinesInApp = app.table(
    'member_routines',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        memberId: uuid('member_id').notNull(),
        routineId: uuid('routine_id').notNull(),
        assignedByTrainerId: uuid('assigned_by_trainer_id'),
        assignedAt: date('assigned_at')
            .default(sql`CURRENT_DATE`)
            .notNull(),
        endedAt: date('ended_at'),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_member_routines_member_status').using(
            'btree',
            table.memberId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
        ),
        foreignKey({
            columns: [table.memberId],
            foreignColumns: [membersInApp.id],
            name: 'member_routines_member_id_fkey',
        }),
        foreignKey({
            columns: [table.routineId],
            foreignColumns: [routinesInApp.id],
            name: 'member_routines_routine_id_fkey',
        }),
        foreignKey({
            columns: [table.assignedByTrainerId],
            foreignColumns: [trainersInApp.id],
            name: 'member_routines_assigned_by_trainer_id_fkey',
        }),
        check('chk_member_routine_dates', sql`(ended_at IS NULL) OR (ended_at >= assigned_at)`),
    ],
);

export const memberMeasurementsInApp = app.table(
    'member_measurements',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        memberId: uuid('member_id').notNull(),
        measuredAt: date('measured_at')
            .default(sql`CURRENT_DATE`)
            .notNull(),
        weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
        heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
        bodyFatPercentage: numeric('body_fat_percentage', { precision: 5, scale: 2 }),
        waistCm: numeric('waist_cm', { precision: 5, scale: 2 }),
        notes: text(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        /** Igual a createdAt mientras la medición no se corrija; el miembro puede editarla. */
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_member_measurements_member_date').using(
            'btree',
            table.memberId.asc().nullsLast().op('uuid_ops'),
            table.measuredAt.desc().nullsFirst().op('date_ops'),
        ),
        foreignKey({
            columns: [table.memberId],
            foreignColumns: [membersInApp.id],
            name: 'member_measurements_member_id_fkey',
        }),
    ],
);

export const dailyActivitySummariesInApp = app.table(
    'daily_activity_summaries',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        memberId: uuid('member_id').notNull(),
        date: date().notNull(),
        steps: integer().default(0).notNull(),
        caloriesTotal: numeric('calories_total', { precision: 8, scale: 2 }).default('0').notNull(),
        activeMinutes: integer('active_minutes').default(0).notNull(),
        exerciseCount: integer('exercise_count').default(0).notNull(),
        distanceMeters: numeric('distance_meters', { precision: 10, scale: 2 }).default('0').notNull(),
        source: activitySourceInApp().notNull(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_daily_activity_member_date').using(
            'btree',
            table.memberId.asc().nullsLast().op('uuid_ops'),
            table.date.desc().nullsFirst().op('date_ops'),
        ),
        foreignKey({
            columns: [table.memberId],
            foreignColumns: [membersInApp.id],
            name: 'daily_activity_summaries_member_id_fkey',
        }),
        unique('daily_activity_summaries_member_date_key').on(table.memberId, table.date),
    ],
);

// ── Clases, sesiones y reservas ─────────────────────────────────────────────
// class_series = serie semanal (plantilla/recurrencia). class_sessions = cada
// ocurrencia materializada (fila propia, movible/cancelable). La ocupación se
// deriva SIEMPRE de reservations; nunca se persisten contadores.

export const classSeriesInApp = app.table(
    'class_series',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        trainerId: uuid('trainer_id').notNull(),
        name: varchar({ length: 120 }).notNull(),
        description: text().default('').notNull(),
        /** Hora local del negocio (BUSINESS_TIME_ZONE); la sesión guarda instantes. */
        localStartTime: time('local_start_time').notNull(),
        durationMinutes: smallint('duration_minutes').notNull(),
        capacity: integer().notNull(),
        allowWaitlist: boolean('allow_waitlist').default(false).notNull(),
        /** Fecha local desde la que la serie es materializable. */
        startsOn: date('starts_on').notNull(),
        category: varchar({ length: 80 }),
        level: classLevelInApp(),
        room: varchar({ length: 120 }),
        zone: varchar({ length: 120 }),
        status: recordStatusInApp().default('ACTIVE').notNull(),
        createdByUserId: uuid('created_by_user_id').notNull(),
        updatedByUserId: uuid('updated_by_user_id').notNull(),
        /** Concurrencia optimista (If-Match). */
        version: integer().default(1).notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_class_series_status').using('btree', table.status.asc().nullsLast().op('enum_ops')),
        index('idx_class_series_trainer_status').using(
            'btree',
            table.trainerId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
        ),
        foreignKey({
            columns: [table.trainerId],
            foreignColumns: [trainersInApp.id],
            name: 'class_series_trainer_id_fkey',
        }),
        foreignKey({
            columns: [table.createdByUserId],
            foreignColumns: [usersInApp.id],
            name: 'class_series_created_by_user_id_fkey',
        }),
        foreignKey({
            columns: [table.updatedByUserId],
            foreignColumns: [usersInApp.id],
            name: 'class_series_updated_by_user_id_fkey',
        }),
        check('class_series_duration_minutes_check', sql`duration_minutes BETWEEN 1 AND 1440`),
        check('class_series_capacity_check', sql`capacity BETWEEN 1 AND 500`),
        check('class_series_version_check', sql`version > 0`),
        // deleted_at existe si y solo si la serie está archivada.
        check('chk_class_series_archived_deleted_at', sql`(status = 'ARCHIVED') = (deleted_at IS NOT NULL)`),
    ],
);

export type ClassSeries = typeof classSeriesInApp.$inferSelect;

export const classSeriesWeekdaysInApp = app.table(
    'class_series_weekdays',
    {
        classSeriesId: uuid('class_series_id').notNull(),
        /** ISO: lunes=1 … domingo=7. */
        isoWeekday: smallint('iso_weekday').notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.classSeriesId, table.isoWeekday], name: 'class_series_weekdays_pkey' }),
        foreignKey({
            columns: [table.classSeriesId],
            foreignColumns: [classSeriesInApp.id],
            name: 'class_series_weekdays_class_series_id_fkey',
        }).onDelete('restrict'),
        check('class_series_weekdays_iso_weekday_check', sql`iso_weekday BETWEEN 1 AND 7`),
    ],
);

export const classSessionsInApp = app.table(
    'class_sessions',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        classSeriesId: uuid('class_series_id').notNull(),
        /** Fecha local de la ocurrencia original; inmutable aunque la sesión se mueva. */
        originDate: date('origin_date').notNull(),
        startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).notNull(),
        endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }).notNull(),
        // Snapshots de la serie al materializar/reconciliar.
        className: varchar('class_name', { length: 120 }).notNull(),
        description: text().notNull(),
        trainerId: uuid('trainer_id').notNull(),
        capacity: integer().notNull(),
        allowWaitlist: boolean('allow_waitlist').notNull(),
        category: varchar({ length: 80 }),
        level: classLevelInApp(),
        room: varchar({ length: 120 }),
        zone: varchar({ length: 120 }),
        status: classSessionStatusInApp().default('SCHEDULED').notNull(),
        /** true si la sesión fue movida a mano: la serie ya no pisa su horario. */
        scheduleOverridden: boolean('schedule_overridden').default(false).notNull(),
        /** Versión de la serie usada en el último snapshot/reconcile. */
        sourceSeriesVersion: integer('source_series_version').notNull(),
        version: integer().default(1).notNull(),
        cancelReason: classSessionCancelReasonInApp('cancel_reason'),
        cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),
        /** null = acción del sistema (cron/cascada). */
        cancelledByUserId: uuid('cancelled_by_user_id'),
        updatedByUserId: uuid('updated_by_user_id'),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        // Identidad de la recurrencia e idempotencia del materializador.
        unique('class_sessions_series_origin_key').on(table.classSeriesId, table.originDate),
        index('idx_class_sessions_starts_status').using(
            'btree',
            table.startsAt.asc().nullsLast().op('timestamptz_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
        ),
        index('idx_class_sessions_series_starts').using(
            'btree',
            table.classSeriesId.asc().nullsLast().op('uuid_ops'),
            table.startsAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        index('idx_class_sessions_trainer_starts').using(
            'btree',
            table.trainerId.asc().nullsLast().op('uuid_ops'),
            table.startsAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        foreignKey({
            columns: [table.classSeriesId],
            foreignColumns: [classSeriesInApp.id],
            name: 'class_sessions_class_series_id_fkey',
        }),
        foreignKey({
            columns: [table.trainerId],
            foreignColumns: [trainersInApp.id],
            name: 'class_sessions_trainer_id_fkey',
        }),
        foreignKey({
            columns: [table.cancelledByUserId],
            foreignColumns: [usersInApp.id],
            name: 'class_sessions_cancelled_by_user_id_fkey',
        }),
        foreignKey({
            columns: [table.updatedByUserId],
            foreignColumns: [usersInApp.id],
            name: 'class_sessions_updated_by_user_id_fkey',
        }),
        check('class_sessions_time_range_check', sql`ends_at > starts_at`),
        check('class_sessions_capacity_check', sql`capacity BETWEEN 1 AND 500`),
        check('class_sessions_version_check', sql`version > 0`),
        check(
            'chk_class_sessions_cancel_coherence',
            sql`(status = 'SCHEDULED' AND cancel_reason IS NULL AND cancelled_at IS NULL) OR (status = 'CANCELLED' AND cancel_reason IS NOT NULL AND cancelled_at IS NOT NULL)`,
        ),
        // La exclusión GiST anti-solape de entrenador se agrega a mano en la
        // migración (EXCLUDE USING gist); drizzle no la puede expresar.
    ],
);

export type ClassSessionRow = typeof classSessionsInApp.$inferSelect;

export const reservationsInApp = app.table(
    'reservations',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        sessionId: uuid('session_id').notNull(),
        memberId: uuid('member_id').notNull(),
        status: reservationStatusInApp().notNull(),
        statusReason: reservationReasonInApp('status_reason').notNull(),
        waitlistedAt: timestamp('waitlisted_at', { withTimezone: true, mode: 'string' }),
        confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
        cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),
        attendanceMarkedAt: timestamp('attendance_marked_at', { withTimezone: true, mode: 'string' }),
        /** Solo en la reserva DESTINO de una reprogramación (enlace al origen cancelado). */
        rescheduledFromReservationId: uuid('rescheduled_from_reservation_id'),
        createdByUserId: uuid('created_by_user_id').notNull(),
        /** null = transición del sistema (expiración, cascada). */
        updatedByUserId: uuid('updated_by_user_id'),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        // Ocupación + FIFO de espera.
        index('idx_reservations_session_status_fifo').using(
            'btree',
            table.sessionId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
            table.waitlistedAt.asc().nullsLast().op('timestamptz_ops'),
            table.id.asc().nullsLast().op('uuid_ops'),
        ),
        index('idx_reservations_member_created').using(
            'btree',
            table.memberId.asc().nullsLast().op('uuid_ops'),
            table.createdAt.desc().nullsFirst().op('timestamptz_ops'),
        ),
        index('idx_reservations_member_status_session').using(
            'btree',
            table.memberId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
            table.sessionId.asc().nullsLast().op('uuid_ops'),
        ),
        // Nunca dos reservas vigentes del mismo miembro en la misma sesión;
        // una cancelación histórica no bloquea una nueva.
        uniqueIndex('uq_reservations_active_member_session')
            .on(table.sessionId, table.memberId)
            .where(sql`status <> 'CANCELLED'`),
        // Una reserva origen produce a lo sumo una reserva destino.
        uniqueIndex('uq_reservations_reschedule_source')
            .on(table.rescheduledFromReservationId)
            .where(sql`rescheduled_from_reservation_id IS NOT NULL`),
        foreignKey({
            columns: [table.sessionId],
            foreignColumns: [classSessionsInApp.id],
            name: 'reservations_session_id_fkey',
        }),
        foreignKey({
            columns: [table.memberId],
            foreignColumns: [membersInApp.id],
            name: 'reservations_member_id_fkey',
        }),
        foreignKey({
            columns: [table.rescheduledFromReservationId],
            foreignColumns: [table.id],
            name: 'reservations_rescheduled_from_fkey',
        }),
        foreignKey({
            columns: [table.createdByUserId],
            foreignColumns: [usersInApp.id],
            name: 'reservations_created_by_user_id_fkey',
        }),
        foreignKey({
            columns: [table.updatedByUserId],
            foreignColumns: [usersInApp.id],
            name: 'reservations_updated_by_user_id_fkey',
        }),
        check(
            'chk_reservations_not_self_reschedule',
            sql`rescheduled_from_reservation_id IS NULL OR rescheduled_from_reservation_id <> id`,
        ),
        // Coherencia temporal por estado (los timestamps históricos se conservan).
        check(
            'chk_reservations_status_timestamps',
            sql`(status = 'WAITLISTED' AND waitlisted_at IS NOT NULL AND cancelled_at IS NULL) OR (status = 'CONFIRMED' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL) OR (status = 'ATTENDED' AND confirmed_at IS NOT NULL AND attendance_marked_at IS NOT NULL) OR (status = 'NO_SHOW' AND confirmed_at IS NOT NULL AND (attendance_marked_at IS NOT NULL OR status_reason = 'LATE_CANCELLATION')) OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL)`,
        ),
        // Compatibilidad status/razón.
        check(
            'chk_reservations_status_reason',
            sql`(status = 'CONFIRMED' AND status_reason IN ('MEMBER_BOOKED', 'WAITLIST_PROMOTED', 'RESCHEDULED')) OR (status = 'WAITLISTED' AND status_reason = 'MEMBER_JOINED_WAITLIST') OR (status = 'ATTENDED' AND status_reason = 'ATTENDANCE') OR (status = 'NO_SHOW' AND status_reason IN ('LATE_CANCELLATION', 'ATTENDANCE')) OR (status = 'CANCELLED' AND status_reason IN ('MEMBER_CANCELLED', 'ADMIN_CANCELLED', 'SESSION_CANCELLED', 'SERIES_CHANGED', 'WAITLIST_REMOVED', 'WAITLIST_EXPIRED', 'RESCHEDULED'))`,
        ),
    ],
);

export type ReservationRow = typeof reservationsInApp.$inferSelect;

// Auditoría append-only de reservas: cada transición inserta un evento en la
// misma transacción; nada se actualiza ni borra.
export const reservationEventsInApp = app.table(
    'reservation_events',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        reservationId: uuid('reservation_id').notNull(),
        /** null = acción del sistema. */
        actorUserId: uuid('actor_user_id'),
        /** null solo en el evento de creación. */
        fromStatus: reservationStatusInApp('from_status'),
        toStatus: reservationStatusInApp('to_status').notNull(),
        reason: reservationReasonInApp().notNull(),
        fromSessionId: uuid('from_session_id'),
        toSessionId: uuid('to_session_id'),
        metadata: jsonb()
            .default(sql`'{}'::jsonb`)
            .notNull(),
        occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_reservation_events_reservation_occurred').using(
            'btree',
            table.reservationId.asc().nullsLast().op('uuid_ops'),
            table.occurredAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        foreignKey({
            columns: [table.reservationId],
            foreignColumns: [reservationsInApp.id],
            name: 'reservation_events_reservation_id_fkey',
        }),
        foreignKey({
            columns: [table.actorUserId],
            foreignColumns: [usersInApp.id],
            name: 'reservation_events_actor_user_id_fkey',
        }),
        foreignKey({
            columns: [table.fromSessionId],
            foreignColumns: [classSessionsInApp.id],
            name: 'reservation_events_from_session_id_fkey',
        }),
        foreignKey({
            columns: [table.toSessionId],
            foreignColumns: [classSessionsInApp.id],
            name: 'reservation_events_to_session_id_fkey',
        }),
    ],
);

// Auditoría append-only de series y sesiones (schedule).
export const classScheduleEventsInApp = app.table(
    'class_schedule_events',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        classSeriesId: uuid('class_series_id'),
        classSessionId: uuid('class_session_id'),
        /** CREATED | UPDATED | STATUS_CHANGED | ARCHIVED | MATERIALIZED | MOVED | CANCELLED | RECONCILED */
        eventType: varchar('event_type', { length: 80 }).notNull(),
        /** null = acción del sistema. */
        actorUserId: uuid('actor_user_id'),
        beforeState: jsonb('before_state'),
        afterState: jsonb('after_state'),
        reason: text(),
        occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_class_schedule_events_series_occurred').using(
            'btree',
            table.classSeriesId.asc().nullsLast().op('uuid_ops'),
            table.occurredAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        index('idx_class_schedule_events_session_occurred').using(
            'btree',
            table.classSessionId.asc().nullsLast().op('uuid_ops'),
            table.occurredAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        foreignKey({
            columns: [table.classSeriesId],
            foreignColumns: [classSeriesInApp.id],
            name: 'class_schedule_events_class_series_id_fkey',
        }),
        foreignKey({
            columns: [table.classSessionId],
            foreignColumns: [classSessionsInApp.id],
            name: 'class_schedule_events_class_session_id_fkey',
        }),
        foreignKey({
            columns: [table.actorUserId],
            foreignColumns: [usersInApp.id],
            name: 'class_schedule_events_actor_user_id_fkey',
        }),
        // El evento pertenece a exactamente una entidad: serie o sesión.
        check('chk_class_schedule_events_target', sql`num_nonnulls(class_series_id, class_session_id) = 1`),
    ],
);

export const notificationTypeInApp = app.enum('notification_type', ['ROUTINE_ASSIGNED', 'ROUTINE_UPDATED', 'SESSION_VALIDATED']);
export const trainingSessionStatusInApp = app.enum('training_session_status', ['PENDING', 'CONFIRMED', 'VALIDATED', 'EXPIRED']);

export const trainingSessionsInApp = app.table(
    'training_sessions',
    {
        id: uuid('id').default(sql`uuidv7()`).primaryKey().notNull(),
        memberRoutineId: uuid('member_routine_id').notNull().references(() => memberRoutinesInApp.id),
        date: date('date', { mode: 'string' }).defaultNow().notNull(),
        status: trainingSessionStatusInApp('status').default('PENDING').notNull(),
        confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
        confirmedBy: uuid('confirmed_by').references(() => usersInApp.id),
        validatedByTrainerId: uuid('validated_by_trainer_id').references(() => trainersInApp.id),
        validatedAt: timestamp('validated_at', { withTimezone: true, mode: 'string' }),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_training_sessions_member_routine_status').using('btree', table.memberRoutineId, table.status)
    ]
);

export const exerciseLogsInApp = app.table(
    'exercise_logs',
    {
        id: uuid('id').default(sql`uuidv7()`).primaryKey().notNull(),
        sessionId: uuid('session_id').notNull().references(() => trainingSessionsInApp.id, { onDelete: 'cascade' }),
        routineExerciseId: uuid('routine_exercise_id').notNull().references(() => routineExercisesInApp.id),
        targetSets: integer('target_sets'),
        targetReps: varchar('target_reps', { length: 40 }),
        targetWeightKg: numeric('target_weight_kg', { precision: 5, scale: 2 }),
        completedSets: integer('completed_sets'),
        completedRepsLog: text('completed_reps_log'),
        weightKgActual: numeric('weight_kg_actual', { precision: 5, scale: 2 }),
        notes: text('notes'),
        completed: boolean('completed').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        unique('uq_exercise_logs_session_routine_exercise').on(table.sessionId, table.routineExerciseId),
        index('idx_exercise_logs_session_id').using('btree', table.sessionId)
    ]
);

export const notificationsInApp = app.table(
    'notifications',
    {
        id: uuid('id').default(sql`uuidv7()`).primaryKey().notNull(),
        userId: uuid('user_id').notNull().references(() => usersInApp.id, { onDelete: 'cascade' }),
        type: notificationTypeInApp('type').notNull(),
        title: varchar('title', { length: 200 }).notNull(),
        body: text('body'),
        payload: jsonb('payload'),
        read: boolean('read').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_notifications_user_read').using('btree', table.userId, table.read)
    ]
);

export const routineVersionsInApp = app.table(
    'routine_versions',
    {
        id: uuid('id').default(sql`uuidv7()`).primaryKey().notNull(),
        routineId: uuid('routine_id').notNull().references(() => routinesInApp.id, { onDelete: 'cascade' }),
        versionNumber: integer('version_number').notNull(),
        snapshot: jsonb('snapshot').notNull(),
        changedBy: uuid('changed_by').references(() => trainersInApp.id),
        changeReason: text('change_reason'),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        unique('uq_routine_versions_routine_version').on(table.routineId, table.versionNumber),
        index('idx_routine_versions_routine_id').using('btree', table.routineId)
    ]
);
