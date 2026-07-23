import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    exercisesInApp as Exercises,
    memberRoutinesInApp as MemberRoutines,
    membersInApp as Members,
    notificationsInApp as Notifications,
    routineExercisesInApp as RoutineExercises,
    routinesInApp as Routines,
    trainersInApp as Trainers,
    trainingSessionsInApp as TrainingSessions,
    usersInApp as Users,
    exerciseLogsInApp as ExerciseLogs,
    routineVersionsInApp as RoutineVersions,
} from '@/infra/database/pg/schemas/schema';
import type { CreateRoutineDto } from './dto/create-routine.dto';
import type { UpdateRoutineDto } from './dto/update-routine.dto';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { UpsertExerciseLogDto } from './dto/upsert-exercise-log.dto';
import type { AssignRoutineDto } from './dto/assign-routine.dto';

@Injectable()
export class RoutinesService {
    constructor(private readonly drizzle: DrizzleService) {}

    private async getMemberId(userId: string): Promise<string> {
        const [member] = await this.drizzle.db
            .select({ id: Members.id })
            .from(Members)
            .where(eq(Members.userId, userId));

        if (!member) throw new NotFoundException('Member not found');
        return member.id;
    }

    private async getTrainerOrThrow(userId: string) {
        const [trainer] = await this.drizzle.db.select().from(Trainers).where(eq(Trainers.userId, userId));

        if (!trainer) throw new ForbiddenException('Se requiere rol TRAINER');
        return trainer;
    }

    async isTrainer(userId: string): Promise<boolean> {
        const [trainer] = await this.drizzle.db
            .select({ id: Trainers.id })
            .from(Trainers)
            .where(eq(Trainers.userId, userId));
        return !!trainer;
    }

    // Member routines --------------------------------------------------------

    async findAssignedRoutines(userId: string) {
        const memberId = await this.getMemberId(userId);

        const rows = await this.drizzle.db
            .select({ mr: MemberRoutines, routine: Routines })
            .from(MemberRoutines)
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            )
            .orderBy(desc(MemberRoutines.assignedAt));

        return Promise.all(
            rows.map(async (r) => {
                const exercises = await this.drizzle.db
                    .select({ re: RoutineExercises, exercise: Exercises })
                    .from(RoutineExercises)
                    .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
                    .where(eq(RoutineExercises.routineId, r.routine.id))
                    .orderBy(asc(RoutineExercises.displayOrder));

                return {
                    ...r.routine,
                    memberRoutineId: r.mr.id,
                    assignedAt: r.mr.assignedAt,
                    memberRoutineStatus: r.mr.status,
                    exercises: exercises.map((e) => ({
                        ...e.re,
                        exerciseName: e.exercise.name,
                    })),
                };
            }),
        );
    }

    async findRoutineDetail(userId: string, routineId: string) {
        const memberId = await this.getMemberId(userId);

        const [row] = await this.drizzle.db
            .select({ mr: MemberRoutines, routine: Routines })
            .from(MemberRoutines)
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.routineId, routineId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(Routines.deletedAt),
                ),
            );

        if (!row) throw new NotFoundException('Rutina no encontrada');

        const exercises = await this.drizzle.db
            .select({ re: RoutineExercises, exercise: Exercises })
            .from(RoutineExercises)
            .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
            .where(eq(RoutineExercises.routineId, routineId))
            .orderBy(asc(RoutineExercises.displayOrder));

        return {
            ...row.routine,
            memberRoutineId: row.mr.id,
            assignedAt: row.mr.assignedAt,
            memberRoutineStatus: row.mr.status,
            exercises: exercises.map((e) => ({
                ...e.re,
                exerciseName: e.exercise.name,
            })),
        };
    }

    // Sessions ---------------------------------------------------------------

    async createSession(userId: string, dto: CreateSessionDto) {
        const memberId = await this.getMemberId(userId);

        const [mr] = await this.drizzle.db
            .select({ mr: MemberRoutines, routine: Routines })
            .from(MemberRoutines)
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(MemberRoutines.id, dto.memberRoutineId),
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            );

        if (!mr) throw new UnprocessableEntityException('No tenés una rutina activa asignada');

        const [session] = await this.drizzle.db
            .insert(TrainingSessions)
            .values({ memberRoutineId: dto.memberRoutineId })
            .returning();

        return session!;
    }

    async upsertExerciseLog(userId: string, sessionId: string, dto: UpsertExerciseLogDto) {
        const memberId = await this.getMemberId(userId);
        const session = await this.guardSessionOwnership(sessionId, memberId);

        if (session.status !== 'PENDING') {
            throw new ConflictException('Solo se pueden editar logs de una sesión pendiente');
        }

        const [sessionWithRoutine] = await this.drizzle.db
            .select({ routineId: MemberRoutines.routineId })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .where(eq(TrainingSessions.id, sessionId));

        const routineId = sessionWithRoutine!.routineId;

        const [re] = await this.drizzle.db
            .select()
            .from(RoutineExercises)
            .where(and(eq(RoutineExercises.id, dto.routineExerciseId), eq(RoutineExercises.routineId, routineId)));

        if (!re) throw new UnprocessableEntityException('El ejercicio no pertenece a la rutina de la sesión');

        const [existing] = await this.drizzle.db
            .select()
            .from(ExerciseLogs)
            .where(
                and(eq(ExerciseLogs.sessionId, sessionId), eq(ExerciseLogs.routineExerciseId, dto.routineExerciseId)),
            );

        const completed = dto.completed ?? false;

        if (existing) {
            const [updated] = await this.drizzle.db
                .update(ExerciseLogs)
                .set({
                    weightKgActual: dto.weightKgActual ?? existing.weightKgActual,
                    completedRepsLog: dto.completedRepsLog ?? existing.completedRepsLog,
                    completedSets: dto.completedSets ?? existing.completedSets,
                    notes: dto.notes ?? existing.notes,
                    completed,
                    updatedAt: sql`now()`,
                })
                .where(eq(ExerciseLogs.id, existing.id))
                .returning();
            return updated!;
        }

        const [log] = await this.drizzle.db
            .insert(ExerciseLogs)
            .values({
                sessionId,
                routineExerciseId: dto.routineExerciseId,
                targetSets: re?.sets ?? null,
                targetReps: re?.reps ?? null,
                targetWeightKg: null,
                weightKgActual: dto.weightKgActual ?? null,
                completedRepsLog: dto.completedRepsLog ?? null,
                completedSets: dto.completedSets ?? null,
                notes: dto.notes ?? null,
                completed,
            })
            .returning();

        return log!;
    }

    async confirmSession(userId: string, sessionId: string) {
        const memberId = await this.getMemberId(userId);
        await this.expirePendingSessions(memberId);
        const session = await this.guardSessionOwnership(sessionId, memberId);

        if (session.status !== 'PENDING') {
            throw new ConflictException('La sesión solo puede confirmarse si está pendiente');
        }

        const [updated] = await this.drizzle.db
            .update(TrainingSessions)
            .set({ status: 'CONFIRMED', confirmedAt: sql`now()`, confirmedBy: userId })
            .where(eq(TrainingSessions.id, sessionId))
            .returning();

        return updated!;
    }

    async validateSession(userId: string, sessionId: string) {
        const trainer = await this.getTrainerOrThrow(userId);

        const [row] = await this.drizzle.db
            .select({ session: TrainingSessions, routineTrainerId: Routines.trainerId })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(TrainingSessions.id, sessionId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            );

        if (!row) throw new NotFoundException('Sesión no encontrada');

        if (row.routineTrainerId !== trainer.id) {
            throw new ForbiddenException('No tenés permiso para validar esta sesión');
        }

        if (row.session.status !== 'CONFIRMED') {
            throw new ConflictException('La sesión debe estar confirmada para validarse');
        }
        if (row.session.validatedAt) {
            throw new ConflictException('Sesión ya validada');
        }

        const [updated] = await this.drizzle.db
            .update(TrainingSessions)
            .set({ status: 'VALIDATED', validatedByTrainerId: trainer.id, validatedAt: sql`now()` })
            .where(eq(TrainingSessions.id, sessionId))
            .returning();

        await this.notifySessionValidated(sessionId);

        return updated!;
    }

    async findSessions(userId: string, scope?: string) {
        const isTrainerScope = scope === 'trainer' && (await this.isTrainer(userId));
        if (isTrainerScope) {
            return this.findTrainerSessions(userId);
        }

        const memberId = await this.getMemberId(userId);
        await this.expirePendingSessions(memberId);

        const rows = await this.drizzle.db
            .select({ session: TrainingSessions })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            )
            .orderBy(desc(TrainingSessions.date));

        return Promise.all(
            rows.map(async (r) => {
                const logs = await this.drizzle.db
                    .select({ log: ExerciseLogs, exercise: Exercises, routineExercise: RoutineExercises })
                    .from(ExerciseLogs)
                    .innerJoin(RoutineExercises, eq(ExerciseLogs.routineExerciseId, RoutineExercises.id))
                    .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
                    .where(eq(ExerciseLogs.sessionId, r.session.id))
                    .orderBy(asc(RoutineExercises.displayOrder));

                return {
                    ...r.session,
                    exerciseLogs: logs.map((l) => ({ ...l.log, exerciseName: l.exercise.name })),
                };
            }),
        );
    }

    async findSessionDetail(userId: string, sessionId: string, scope?: string) {
        const isTrainerScope = scope === 'trainer' && (await this.isTrainer(userId));
        if (isTrainerScope) {
            return this.findTrainerSessionDetail(userId, sessionId);
        }

        const memberId = await this.getMemberId(userId);
        await this.expirePendingSessions(memberId);

        const [row] = await this.drizzle.db
            .select({ session: TrainingSessions })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(TrainingSessions.id, sessionId),
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            );

        if (!row) throw new NotFoundException('Sesión no encontrada');

        const logs = await this.drizzle.db
            .select({ log: ExerciseLogs, exercise: Exercises, routineExercise: RoutineExercises })
            .from(ExerciseLogs)
            .innerJoin(RoutineExercises, eq(ExerciseLogs.routineExerciseId, RoutineExercises.id))
            .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
            .where(eq(ExerciseLogs.sessionId, sessionId))
            .orderBy(asc(RoutineExercises.displayOrder));

        return {
            session: row.session,
            exerciseLogs: logs.map((l) => ({ ...l.log, exerciseName: l.exercise.name })),
        };
    }

    private async findTrainerSessions(userId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.expirePendingSessionsForTrainer(trainer.id);

        const rows = await this.drizzle.db
            .select({ session: TrainingSessions })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(Routines.trainerId, trainer.id),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            )
            .orderBy(desc(TrainingSessions.date));

        return Promise.all(
            rows.map(async (r) => {
                const logs = await this.drizzle.db
                    .select({ log: ExerciseLogs, exercise: Exercises, routineExercise: RoutineExercises })
                    .from(ExerciseLogs)
                    .innerJoin(RoutineExercises, eq(ExerciseLogs.routineExerciseId, RoutineExercises.id))
                    .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
                    .where(eq(ExerciseLogs.sessionId, r.session.id))
                    .orderBy(asc(RoutineExercises.displayOrder));

                return {
                    ...r.session,
                    exerciseLogs: logs.map((l) => ({ ...l.log, exerciseName: l.exercise.name })),
                };
            }),
        );
    }

    private async findTrainerSessionDetail(userId: string, sessionId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.expirePendingSessionsForTrainer(trainer.id);

        const [row] = await this.drizzle.db
            .select({ session: TrainingSessions })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(TrainingSessions.id, sessionId),
                    eq(Routines.trainerId, trainer.id),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                    isNull(Routines.deletedAt),
                ),
            );

        if (!row) throw new NotFoundException('Sesión no encontrada');

        const logs = await this.drizzle.db
            .select({ log: ExerciseLogs, exercise: Exercises, routineExercise: RoutineExercises })
            .from(ExerciseLogs)
            .innerJoin(RoutineExercises, eq(ExerciseLogs.routineExerciseId, RoutineExercises.id))
            .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
            .where(eq(ExerciseLogs.sessionId, sessionId))
            .orderBy(asc(RoutineExercises.displayOrder));

        return {
            session: row.session,
            exerciseLogs: logs.map((l) => ({ ...l.log, exerciseName: l.exercise.name })),
        };
    }

    // Notifications ----------------------------------------------------------

    async findNotifications(userId: string) {
        return this.drizzle.db
            .select()
            .from(Notifications)
            .where(eq(Notifications.userId, userId))
            .orderBy(desc(Notifications.createdAt));
    }

    async markNotificationRead(userId: string, notificationId: string) {
        const [updated] = await this.drizzle.db
            .update(Notifications)
            .set({ read: true })
            .where(and(eq(Notifications.id, notificationId), eq(Notifications.userId, userId)))
            .returning();

        if (!updated) throw new NotFoundException('Notificación no encontrada');
        return updated;
    }

    // Trainer routines -------------------------------------------------------

    async findTrainerRoutines(userId: string) {
        const trainerId = await this.getTrainerId(userId);

        const routines = await this.drizzle.db
            .select()
            .from(Routines)
            .where(and(eq(Routines.trainerId, trainerId), eq(Routines.status, 'ACTIVE'), isNull(Routines.deletedAt)))
            .orderBy(desc(Routines.createdAt));

        return Promise.all(routines.map(async (r) => this.findRoutineWithExercises(this.drizzle.db, r.id)));
    }

    async findRoutineDetailForTrainer(userId: string, routineId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.findOwnedRoutine(trainer.id, routineId);
        return this.findRoutineWithExercises(this.drizzle.db, routineId);
    }

    async findRoutineMembers(userId: string, routineId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.findOwnedRoutine(trainer.id, routineId);

        return this.drizzle.db
            .select({
                memberRoutineId: MemberRoutines.id,
                memberId: Members.id,
                userId: Members.userId,
                fullName: Users.fullName,
                email: Users.email,
                assignedAt: MemberRoutines.assignedAt,
                status: MemberRoutines.status,
            })
            .from(MemberRoutines)
            .innerJoin(Members, eq(MemberRoutines.memberId, Members.id))
            .innerJoin(Users, eq(Members.userId, Users.id))
            .where(
                and(
                    eq(MemberRoutines.routineId, routineId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                ),
            )
            .orderBy(desc(MemberRoutines.assignedAt));
    }

    async findRoutineSessions(userId: string, routineId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.findOwnedRoutine(trainer.id, routineId);

        await this.expirePendingSessionsForRoutine(routineId);

        const rows = await this.drizzle.db
            .select({
                session: TrainingSessions,
                memberId: Members.id,
                fullName: Users.fullName,
            })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Members, eq(MemberRoutines.memberId, Members.id))
            .innerJoin(Users, eq(Members.userId, Users.id))
            .where(
                and(
                    eq(MemberRoutines.routineId, routineId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                ),
            )
            .orderBy(desc(TrainingSessions.date));

        return rows.map((r) => ({
            ...r.session,
            member: { id: r.memberId, fullName: r.fullName },
        }));
    }

    async findExercises() {
        return this.drizzle.db
            .select()
            .from(Exercises)
            .where(eq(Exercises.status, 'ACTIVE'))
            .orderBy(asc(Exercises.name));
    }

    async createRoutine(userId: string, dto: CreateRoutineDto) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.guardDuplicateName(trainer.id, dto.name);
        this.guardValidExerciseOrder(dto.exercises);

        return this.drizzle.db.transaction(async (tx) => {
            const [routine] = await tx
                .insert(Routines)
                .values({
                    trainerId: trainer.id,
                    name: dto.name,
                    objective: dto.objective ?? null,
                    status: 'ACTIVE',
                })
                .returning();

            const routineId = routine!.id;

            await tx.insert(RoutineExercises).values(
                dto.exercises.map((e) => ({
                    routineId,
                    exerciseId: e.exerciseId,
                    displayOrder: e.displayOrder,
                    sets: e.sets ?? null,
                    reps: e.reps ?? null,
                    restSeconds: e.restSeconds,
                    notes: e.notes ?? null,
                })),
            );

            await tx.insert(RoutineVersions).values({
                routineId,
                versionNumber: 1,
                snapshot: this.buildSnapshot(routineId, dto),
                changedBy: trainer.id,
            });

            await this.notifyAssignedMembers(tx, routineId, trainer.id, 'ROUTINE_ASSIGNED', dto.name);

            return this.findRoutineWithExercises(tx, routineId);
        });
    }

    async updateRoutine(userId: string, routineId: string, dto: UpdateRoutineDto) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.findOwnedRoutine(trainer.id, routineId);
        await this.guardDuplicateName(trainer.id, dto.name, routineId);
        this.guardValidExerciseOrder(dto.exercises);

        return this.drizzle.db.transaction(async (tx) => {
            await tx
                .update(Routines)
                .set({ name: dto.name, objective: dto.objective ?? null, updatedAt: sql`now()` })
                .where(eq(Routines.id, routineId));

            const existing = await tx.select().from(RoutineExercises).where(eq(RoutineExercises.routineId, routineId));
            const referenced =
                existing.length === 0
                    ? []
                    : await tx
                          .selectDistinct({ routineExerciseId: ExerciseLogs.routineExerciseId })
                          .from(ExerciseLogs)
                          .where(
                              inArray(
                                  ExerciseLogs.routineExerciseId,
                                  existing.map((e) => e.id),
                              ),
                          );
            const referencedIds = new Set(referenced.map((r) => r.routineExerciseId));
            const existingById = new Map(existing.map((e) => [e.id, e]));

            await Promise.all(
                existing.map((e, index) =>
                    tx
                        .update(RoutineExercises)
                        .set({ displayOrder: 100000 + index })
                        .where(eq(RoutineExercises.id, e.id)),
                ),
            );

            const keptIds = new Set<string>();
            for (const e of dto.exercises) {
                const current = e.routineExerciseId ? existingById.get(e.routineExerciseId) : undefined;
                if (current) {
                    if (current.exerciseId !== e.exerciseId && referencedIds.has(current.id)) {
                        throw new ConflictException('No se puede sustituir un ejercicio con sesiones registradas');
                    }
                    await tx
                        .update(RoutineExercises)
                        .set({
                            exerciseId: e.exerciseId,
                            displayOrder: e.displayOrder,
                            sets: e.sets ?? null,
                            reps: e.reps ?? null,
                            restSeconds: e.restSeconds,
                            notes: e.notes ?? null,
                        })
                        .where(eq(RoutineExercises.id, current.id));
                    keptIds.add(current.id);
                } else {
                    const [created] = await tx
                        .insert(RoutineExercises)
                        .values({
                            routineId,
                            exerciseId: e.exerciseId,
                            displayOrder: e.displayOrder,
                            sets: e.sets ?? null,
                            reps: e.reps ?? null,
                            restSeconds: e.restSeconds,
                            notes: e.notes ?? null,
                        })
                        .returning();
                    keptIds.add(created!.id);
                }
            }

            for (const e of existing) {
                if (!keptIds.has(e.id) && referencedIds.has(e.id)) {
                    throw new ConflictException('No se puede eliminar un ejercicio con sesiones registradas');
                }
                if (!keptIds.has(e.id)) {
                    await tx.delete(RoutineExercises).where(eq(RoutineExercises.id, e.id));
                }
            }

            const [maxVersion] = await tx
                .select({ max: sql<number>`COALESCE(MAX(${RoutineVersions.versionNumber}), 0)` })
                .from(RoutineVersions)
                .where(eq(RoutineVersions.routineId, routineId));
            const nextVersion = (maxVersion?.max ?? 0) + 1;

            await tx.insert(RoutineVersions).values({
                routineId,
                versionNumber: nextVersion,
                snapshot: this.buildSnapshot(routineId, dto),
                changedBy: trainer.id,
                changeReason: dto.changeReason ?? null,
            });

            await this.notifyAssignedMembers(tx, routineId, trainer.id, 'ROUTINE_UPDATED', dto.name);

            return this.findRoutineWithExercises(tx, routineId);
        });
    }

    async deleteRoutine(userId: string, routineId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.findOwnedRoutine(trainer.id, routineId);

        await this.drizzle.db
            .update(Routines)
            .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
            .where(eq(Routines.id, routineId));
    }

    async findRoutineVersions(userId: string, routineId: string) {
        const trainer = await this.getTrainerOrThrow(userId);
        await this.findOwnedRoutine(trainer.id, routineId);

        const rows = await this.drizzle.db
            .select({
                version: RoutineVersions,
                fullName: Users.fullName,
            })
            .from(RoutineVersions)
            .leftJoin(Trainers, eq(RoutineVersions.changedBy, Trainers.id))
            .leftJoin(Users, eq(Trainers.userId, Users.id))
            .where(eq(RoutineVersions.routineId, routineId))
            .orderBy(desc(RoutineVersions.versionNumber));

        return rows.map((r) => ({
            id: r.version.id,
            routine_id: r.version.routineId,
            version_number: r.version.versionNumber,
            snapshot: r.version.snapshot,
            changed_by: r.version.changedBy,
            changed_by_name: r.fullName ?? 'Entrenador',
            change_reason: r.version.changeReason,
            created_at: r.version.createdAt,
        }));
    }

    async assignRoutine(userId: string, routineId: string, dto: AssignRoutineDto) {
        const trainer = await this.getTrainerOrThrow(userId);
        const routine = await this.findOwnedRoutine(trainer.id, routineId);

        let memberId = dto.member_id;
        let member = await this.drizzle.db
            .select({ id: Members.id, userId: Members.userId })
            .from(Members)
            .where(eq(Members.id, memberId))
            .then((rows) => rows[0]);

        // Dashboard sends user id; resolve to member profile id
        if (!member) {
            member = await this.drizzle.db
                .select({ id: Members.id, userId: Members.userId })
                .from(Members)
                .where(eq(Members.userId, memberId))
                .then((rows) => rows[0]);
            if (member) memberId = member.id;
        }

        if (!member) throw new NotFoundException('Member no encontrado');

        const [existingAssignment] = await this.drizzle.db
            .select({ id: MemberRoutines.id })
            .from(MemberRoutines)
            .where(
                and(
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.routineId, routineId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                ),
            );
        if (existingAssignment) throw new ConflictException('La rutina ya está asignada a este miembro');

        return this.drizzle.db.transaction(async (tx) => {
            const [mr] = await tx
                .insert(MemberRoutines)
                .values({
                    memberId,
                    routineId,
                    assignedByTrainerId: trainer.id,
                    status: 'ACTIVE',
                })
                .returning();

            await tx.insert(Notifications).values({
                userId: member.userId,
                type: 'ROUTINE_ASSIGNED',
                title: 'Nueva rutina asignada',
                body: `El entrenador te asignó la rutina ${routine.name}`,
                payload: { routine_id: routineId },
            });

            return mr!;
        });
    }

    // Helpers ----------------------------------------------------------------

    private async getTrainerId(userId: string): Promise<string> {
        const trainer = await this.getTrainerOrThrow(userId);
        return trainer.id;
    }

    private async guardSessionOwnership(sessionId: string, memberId: string) {
        const [row] = await this.drizzle.db
            .select({ session: TrainingSessions })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Routines, eq(MemberRoutines.routineId, Routines.id))
            .where(
                and(
                    eq(TrainingSessions.id, sessionId),
                    eq(MemberRoutines.memberId, memberId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(Routines.deletedAt),
                    isNull(MemberRoutines.deletedAt),
                ),
            );

        if (!row) throw new NotFoundException('Sesión no encontrada');
        return row.session;
    }

    private async expirePendingSessions(memberId: string) {
        await this.drizzle.db
            .update(TrainingSessions)
            .set({ status: 'EXPIRED' })
            .where(
                and(
                    eq(TrainingSessions.status, 'PENDING'),
                    sql`${TrainingSessions.createdAt} < now() - interval '24 hours'`,
                    sql`${TrainingSessions.memberRoutineId} IN (SELECT id FROM app.member_routines WHERE member_id = ${memberId})`,
                ),
            );
    }

    private async expirePendingSessionsForRoutine(routineId: string) {
        await this.drizzle.db
            .update(TrainingSessions)
            .set({ status: 'EXPIRED' })
            .where(
                and(
                    eq(TrainingSessions.status, 'PENDING'),
                    sql`${TrainingSessions.createdAt} < now() - interval '24 hours'`,
                    sql`${TrainingSessions.memberRoutineId} IN (SELECT id FROM app.member_routines WHERE routine_id = ${routineId})`,
                ),
            );
    }

    private async expirePendingSessionsForTrainer(trainerId: string) {
        await this.drizzle.db
            .update(TrainingSessions)
            .set({ status: 'EXPIRED' })
            .where(
                and(
                    eq(TrainingSessions.status, 'PENDING'),
                    sql`${TrainingSessions.createdAt} < now() - interval '24 hours'`,
                    sql`${TrainingSessions.memberRoutineId} IN (
                        SELECT mr.id FROM app.member_routines mr
                        JOIN app.routines r ON r.id = mr.routine_id
                        WHERE r.trainer_id = ${trainerId}
                    )`,
                ),
            );
    }

    private async findOwnedRoutine(trainerId: string, routineId: string) {
        const [routine] = await this.drizzle.db
            .select()
            .from(Routines)
            .where(
                and(
                    eq(Routines.id, routineId),
                    eq(Routines.trainerId, trainerId),
                    eq(Routines.status, 'ACTIVE'),
                    isNull(Routines.deletedAt),
                ),
            );

        if (!routine) throw new NotFoundException('Rutina no encontrada');
        return routine;
    }

    private async guardDuplicateName(trainerId: string, name: string, excludeId?: string) {
        const conditions: SQL[] = [
            eq(Routines.trainerId, trainerId),
            eq(Routines.name, name),
            isNull(Routines.deletedAt),
        ];
        if (excludeId) conditions.push(ne(Routines.id, excludeId));

        const [existing] = await this.drizzle.db
            .select({ id: Routines.id })
            .from(Routines)
            .where(and(...conditions));
        if (existing) throw new ConflictException('Ya existe una rutina con ese nombre. ¿Confirmar o renombrar?');
    }

    private buildSnapshot(routineId: string, dto: CreateRoutineDto) {
        return {
            id: routineId,
            name: dto.name,
            objective: dto.objective ?? null,
            exercises: dto.exercises.map((e) => ({
                exercise_id: e.exerciseId,
                display_order: e.displayOrder,
                sets: e.sets ?? null,
                reps: e.reps ?? null,
                notes: e.notes ?? null,
                rest_seconds: e.restSeconds,
            })),
        };
    }

    private guardValidExerciseOrder(exercises: Array<{ displayOrder: number }>) {
        const sorted = exercises.map((e) => e.displayOrder).sort((a, b) => a - b);
        const isValid = sorted.every((order, index) => order === index + 1);
        if (!isValid) {
            throw new UnprocessableEntityException({
                code: 'INVALID_DISPLAY_ORDER',
                message: 'El orden de ejercicios debe ser consecutivo desde 1',
            });
        }
    }

    private async findRoutineWithExercises(tx: typeof this.drizzle.db, routineId: string) {
        const [routine] = await tx.select().from(Routines).where(eq(Routines.id, routineId));
        const exercises = await tx
            .select({ re: RoutineExercises, exercise: Exercises })
            .from(RoutineExercises)
            .innerJoin(Exercises, eq(RoutineExercises.exerciseId, Exercises.id))
            .where(eq(RoutineExercises.routineId, routineId))
            .orderBy(asc(RoutineExercises.displayOrder));

        return {
            ...routine!,
            exercises: exercises.map((e) => ({ ...e.re, exerciseName: e.exercise.name })),
        };
    }

    private async notifyAssignedMembers(
        tx: typeof this.drizzle.db,
        routineId: string,
        _trainerId: string,
        type: 'ROUTINE_ASSIGNED' | 'ROUTINE_UPDATED',
        routineName: string,
    ) {
        const assigned = await tx
            .select({ memberUserId: Members.userId })
            .from(MemberRoutines)
            .innerJoin(Members, eq(MemberRoutines.memberId, Members.id))
            .where(
                and(
                    eq(MemberRoutines.routineId, routineId),
                    eq(MemberRoutines.status, 'ACTIVE'),
                    isNull(MemberRoutines.deletedAt),
                ),
            );

        if (assigned.length === 0) return;

        const title = type === 'ROUTINE_ASSIGNED' ? 'Nueva rutina asignada' : 'Rutina actualizada';
        const body =
            type === 'ROUTINE_ASSIGNED'
                ? `El entrenador te asignó la rutina ${routineName}`
                : `La rutina ${routineName} fue actualizada por tu entrenador`;

        await tx.insert(Notifications).values(
            assigned.map((a) => ({
                userId: a.memberUserId,
                type,
                title,
                body,
                payload: { routine_id: routineId },
            })),
        );
    }

    private async notifySessionValidated(sessionId: string) {
        const [row] = await this.drizzle.db
            .select({ userId: Members.userId })
            .from(TrainingSessions)
            .innerJoin(MemberRoutines, eq(TrainingSessions.memberRoutineId, MemberRoutines.id))
            .innerJoin(Members, eq(MemberRoutines.memberId, Members.id))
            .where(eq(TrainingSessions.id, sessionId));

        if (!row) return;

        await this.drizzle.db.insert(Notifications).values({
            userId: row.userId,
            type: 'SESSION_VALIDATED',
            title: 'Sesión validada',
            body: 'Tu entrenador validó una sesión de entrenamiento',
            payload: { session_id: sessionId },
        });
    }
}
