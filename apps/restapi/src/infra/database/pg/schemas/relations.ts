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
} from './schema';

export const membersInAppRelations = relations(membersInApp, ({ one, many }) => ({
    usersInApp: one(usersInApp, {
        fields: [membersInApp.userId],
        references: [usersInApp.id],
    }),
    membershipsInApps: many(membershipsInApp),
    memberRoutinesInApps: many(memberRoutinesInApp),
    memberMeasurementsInApps: many(memberMeasurementsInApp),
}));

export const usersInAppRelations = relations(usersInApp, ({ many }) => ({
    membersInApps: many(membersInApp),
    trainersInApps: many(trainersInApp),
    staffInApps: many(staffInApp),
    memberMeasurementsInApps: many(memberMeasurementsInApp),
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

export const memberRoutinesInAppRelations = relations(memberRoutinesInApp, ({ one }) => ({
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
}));

export const memberMeasurementsInAppRelations = relations(memberMeasurementsInApp, ({ one }) => ({
    membersInApp: one(membersInApp, {
        fields: [memberMeasurementsInApp.memberId],
        references: [membersInApp.id],
    }),
    usersInApp: one(usersInApp, {
        fields: [memberMeasurementsInApp.createdByUserId],
        references: [usersInApp.id],
    }),
}));
