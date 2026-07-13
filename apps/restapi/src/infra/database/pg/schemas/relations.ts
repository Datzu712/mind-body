import { relations } from 'drizzle-orm/relations';
import {
    usersInApp,
    membersInApp,
    trainersInApp,
    staffInApp,
    membershipsInApp,
    membershipPlansInApp,
    routinesInApp,
    routineExercisesInApp,
    exercisesInApp,
    memberRoutinesInApp,
    memberMeasurementsInApp,
    dailyActivitySummariesInApp,
    trainingSessionsInApp,
    exerciseLogsInApp,
    routineVersionsInApp,
    notificationsInApp,
} from './schema';

export const membersInAppRelations = relations(membersInApp, ({ one, many }) => ({
    usersInApp: one(usersInApp, {
        fields: [membersInApp.userId],
        references: [usersInApp.id],
    }),
    membershipsInApps: many(membershipsInApp),
    memberRoutinesInApps: many(memberRoutinesInApp),
    memberMeasurementsInApps: many(memberMeasurementsInApp),
    dailyActivitySummariesInApps: many(dailyActivitySummariesInApp),
}));

export const usersInAppRelations = relations(usersInApp, ({ many }) => ({
    membersInApps: many(membersInApp),
    trainersInApps: many(trainersInApp),
    staffInApps: many(staffInApp),
}));

export const trainersInAppRelations = relations(trainersInApp, ({ one, many }) => ({
    usersInApp: one(usersInApp, {
        fields: [trainersInApp.userId],
        references: [usersInApp.id],
    }),
    routinesInApps: many(routinesInApp),
    memberRoutinesInApps: many(memberRoutinesInApp),
}));

export const staffInAppRelations = relations(staffInApp, ({ one }) => ({
    usersInApp: one(usersInApp, {
        fields: [staffInApp.userId],
        references: [usersInApp.id],
    }),
}));

export const membershipsInAppRelations = relations(membershipsInApp, ({ one }) => ({
    membersInApp: one(membersInApp, {
        fields: [membershipsInApp.memberId],
        references: [membersInApp.id],
    }),
    membershipPlansInApp: one(membershipPlansInApp, {
        fields: [membershipsInApp.planId],
        references: [membershipPlansInApp.id],
    }),
}));

export const membershipPlansInAppRelations = relations(membershipPlansInApp, ({ many }) => ({
    membershipsInApps: many(membershipsInApp),
}));

export const routinesInAppRelations = relations(routinesInApp, ({ one, many }) => ({
    trainersInApp: one(trainersInApp, {
        fields: [routinesInApp.trainerId],
        references: [trainersInApp.id],
    }),
    routineExercisesInApps: many(routineExercisesInApp),
    memberRoutinesInApps: many(memberRoutinesInApp),
}));

export const routineExercisesInAppRelations = relations(routineExercisesInApp, ({ one }) => ({
    routinesInApp: one(routinesInApp, {
        fields: [routineExercisesInApp.routineId],
        references: [routinesInApp.id],
    }),
    exercisesInApp: one(exercisesInApp, {
        fields: [routineExercisesInApp.exerciseId],
        references: [exercisesInApp.id],
    }),
}));

export const exercisesInAppRelations = relations(exercisesInApp, ({ many }) => ({
    routineExercisesInApps: many(routineExercisesInApp),
}));

export const memberMeasurementsInAppRelations = relations(memberMeasurementsInApp, ({ one }) => ({
    membersInApp: one(membersInApp, {
        fields: [memberMeasurementsInApp.memberId],
        references: [membersInApp.id],
    }),
}));

export const dailyActivitySummariesInAppRelations = relations(dailyActivitySummariesInApp, ({ one }) => ({
    membersInApp: one(membersInApp, {
        fields: [dailyActivitySummariesInApp.memberId],
        references: [membersInApp.id],
    }),
}));

export const trainingSessionsInAppRelations = relations(trainingSessionsInApp, ({ one, many }) => ({
    memberRoutinesInApp: one(memberRoutinesInApp, {
        fields: [trainingSessionsInApp.memberRoutineId],
        references: [memberRoutinesInApp.id],
    }),
    usersInApp: one(usersInApp, {
        fields: [trainingSessionsInApp.confirmedBy],
        references: [usersInApp.id],
    }),
    trainersInApp: one(trainersInApp, {
        fields: [trainingSessionsInApp.validatedByTrainerId],
        references: [trainersInApp.id],
    }),
    exerciseLogsInApps: many(exerciseLogsInApp),
}));

export const exerciseLogsInAppRelations = relations(exerciseLogsInApp, ({ one }) => ({
    trainingSessionsInApp: one(trainingSessionsInApp, {
        fields: [exerciseLogsInApp.sessionId],
        references: [trainingSessionsInApp.id],
    }),
    routineExercisesInApp: one(routineExercisesInApp, {
        fields: [exerciseLogsInApp.routineExerciseId],
        references: [routineExercisesInApp.id],
    }),
}));

export const routineVersionsInAppRelations = relations(routineVersionsInApp, ({ one }) => ({
    routinesInApp: one(routinesInApp, {
        fields: [routineVersionsInApp.routineId],
        references: [routinesInApp.id],
    }),
    trainersInApp: one(trainersInApp, {
        fields: [routineVersionsInApp.changedBy],
        references: [trainersInApp.id],
    }),
}));

export const notificationsInAppRelations = relations(notificationsInApp, ({ one }) => ({
    usersInApp: one(usersInApp, {
        fields: [notificationsInApp.userId],
        references: [usersInApp.id],
    }),
}));

export const memberRoutinesInAppRelations = relations(memberRoutinesInApp, ({ one, many }) => ({
    membersInApp: one(membersInApp, {
        fields: [memberRoutinesInApp.memberId],
        references: [membersInApp.id],
    }),
    routinesInApp: one(routinesInApp, {
        fields: [memberRoutinesInApp.routineId],
        references: [routinesInApp.id],
    }),
    trainersInApp: one(trainersInApp, {
        fields: [memberRoutinesInApp.assignedByTrainerId],
        references: [trainersInApp.id],
    }),
    trainingSessionsInApps: many(trainingSessionsInApp),
}));
