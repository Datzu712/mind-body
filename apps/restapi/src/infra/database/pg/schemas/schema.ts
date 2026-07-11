import {
    pgSchema,
    index,
    unique,
    uniqueIndex,
    uuid,
    varchar,
    timestamp,
    foreignKey,
    date,
    text,
    check,
    integer,
    numeric,
    jsonb,
    boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const app = pgSchema('app');
export const membershipStatusInApp = app.enum('membership_status', ['ACTIVE', 'SUSPENDED', 'EXPIRED']);
export const recordStatusInApp = app.enum('record_status', ['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const routineStatusInApp = app.enum('routine_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED']);
export const activitySourceInApp = app.enum('activity_source', ['HEALTH_CONNECT', 'MANUAL']);
export const trainingSessionStatusInApp = app.enum('training_session_status', [
    'PENDING',
    'CONFIRMED',
    'VALIDATED',
    'EXPIRED',
]);
export const notificationTypeInApp = app.enum('notification_type', [
    'ROUTINE_ASSIGNED',
    'ROUTINE_UPDATED',
    'SESSION_VALIDATED',
]);
export const dniTypeInApp = app.enum('dni_type', ['CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE']);

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
            table.memberId.asc().nullsLast().op('date_ops'),
            table.status.asc().nullsLast().op('enum_ops'),
            table.startDate.asc().nullsLast().op('enum_ops'),
            table.endDate.asc().nullsLast().op('uuid_ops'),
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
            table.status.asc().nullsLast(),
        ),
        uniqueIndex('uq_routines_trainer_name_active')
            .on(table.trainerId, table.name)
            .where(sql`${table.deletedAt} is null`),
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
            table.status.asc().nullsLast().op('uuid_ops'),
        ),
        uniqueIndex('uq_member_routines_active')
            .on(table.memberId, table.routineId)
            .where(sql`${table.status} = 'ACTIVE' AND ${table.deletedAt} IS NULL`),
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
    },
    (table) => [
        index('idx_member_measurements_member_date').using(
            'btree',
            table.memberId.asc().nullsLast().op('date_ops'),
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

export const trainingSessionsInApp = app.table(
    'training_sessions',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        memberRoutineId: uuid('member_routine_id').notNull(),
        date: date()
            .default(sql`CURRENT_DATE`)
            .notNull(),
        status: trainingSessionStatusInApp().default('PENDING').notNull(),
        confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
        confirmedBy: uuid('confirmed_by'),
        validatedByTrainerId: uuid('validated_by_trainer_id'),
        validatedAt: timestamp('validated_at', { withTimezone: true, mode: 'string' }),
        notes: text(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_training_sessions_member_routine_status').using(
            'btree',
            table.memberRoutineId.asc().nullsLast().op('uuid_ops'),
            table.status.asc().nullsLast(),
        ),
        foreignKey({
            columns: [table.memberRoutineId],
            foreignColumns: [memberRoutinesInApp.id],
            name: 'training_sessions_member_routine_id_fkey',
        }),
        foreignKey({
            columns: [table.confirmedBy],
            foreignColumns: [usersInApp.id],
            name: 'training_sessions_confirmed_by_fkey',
        }),
        foreignKey({
            columns: [table.validatedByTrainerId],
            foreignColumns: [trainersInApp.id],
            name: 'training_sessions_validated_by_trainer_id_fkey',
        }),
    ],
);

export const exerciseLogsInApp = app.table(
    'exercise_logs',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        sessionId: uuid('session_id').notNull(),
        routineExerciseId: uuid('routine_exercise_id').notNull(),
        targetSets: integer('target_sets'),
        targetReps: varchar('target_reps', { length: 40 }),
        targetWeightKg: numeric('target_weight_kg', { precision: 5, scale: 2, mode: 'number' }),
        completedSets: integer('completed_sets'),
        completedRepsLog: text('completed_reps_log'),
        weightKgActual: numeric('weight_kg_actual', { precision: 5, scale: 2, mode: 'number' }),
        notes: text(),
        completed: boolean().default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_exercise_logs_session_id').using('btree', table.sessionId.asc().nullsLast().op('uuid_ops')),
        foreignKey({
            columns: [table.sessionId],
            foreignColumns: [trainingSessionsInApp.id],
            name: 'exercise_logs_session_id_fkey',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.routineExerciseId],
            foreignColumns: [routineExercisesInApp.id],
            name: 'exercise_logs_routine_exercise_id_fkey',
        }),
        unique('uq_exercise_logs_session_routine_exercise').on(table.sessionId, table.routineExerciseId),
    ],
);

export const routineVersionsInApp = app.table(
    'routine_versions',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        routineId: uuid('routine_id').notNull(),
        versionNumber: integer('version_number').notNull(),
        snapshot: jsonb().notNull(),
        changedBy: uuid('changed_by'),
        changeReason: text('change_reason'),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_routine_versions_routine_id').using('btree', table.routineId.asc().nullsLast().op('uuid_ops')),
        foreignKey({
            columns: [table.routineId],
            foreignColumns: [routinesInApp.id],
            name: 'routine_versions_routine_id_fkey',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.changedBy],
            foreignColumns: [trainersInApp.id],
            name: 'routine_versions_changed_by_fkey',
        }),
        unique('uq_routine_versions_routine_version').on(table.routineId, table.versionNumber),
    ],
);

export const notificationsInApp = app.table(
    'notifications',
    {
        id: uuid()
            .default(sql`uuidv7()`)
            .primaryKey()
            .notNull(),
        userId: uuid('user_id').notNull(),
        type: notificationTypeInApp().notNull(),
        title: varchar({ length: 200 }).notNull(),
        body: text(),
        payload: jsonb(),
        read: boolean().default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => [
        index('idx_notifications_user_read').using(
            'btree',
            table.userId.asc().nullsLast().op('uuid_ops'),
            table.read.asc().nullsLast(),
        ),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [usersInApp.id],
            name: 'notifications_user_id_fkey',
        }).onDelete('cascade'),
    ],
);
