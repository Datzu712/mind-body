import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';
import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    exercisesInApp,
    memberRoutinesInApp,
    membersInApp,
    routineExercisesInApp,
    routinesInApp,
    usersInApp,
} from '@/infra/database/pg/schemas/schema';
import type { RoutineDetailDto, RoutineSummaryDto } from './routine.types';
import type {
    AddRoutineExerciseDto,
    CreateRoutineDto,
    ListRoutinesQueryDto,
    UpdateRoutineDto,
    UpdateRoutineExerciseDto,
} from './dto/routine.dtos';

type RoutineRow = typeof routinesInApp.$inferSelect;
type ItemRow = typeof routineExercisesInApp.$inferSelect;
type ExerciseRow = typeof exercisesInApp.$inferSelect;
type Db = DrizzleService['db'];
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Colchón para renumerar display_order sin chocar con el unique (routine_id, display_order). */
const RENUMBER_OFFSET = 1000;

const DEFAULT_NAME = 'Nueva rutina';

export interface ReplaceRoutinePlanInput {
    name: string;
    objective: string;
    expectedUpdatedAt: string;
    items: AddRoutineExerciseDto[];
}

@Injectable()
export class RoutinesService {
    constructor(private readonly drizzle: DrizzleService) {}

    async list(query: ListRoutinesQueryDto): Promise<RoutineSummaryDto[]> {
        const conds = [isNull(routinesInApp.deletedAt)];
        if (query.q) {
            const escaped = query.q.replace(/[\\%_]/g, (m) => `\\${m}`);
            conds.push(ilike(routinesInApp.name, `%${escaped}%`));
        }
        if (query.status) conds.push(eq(routinesInApp.status, query.status));

        const rows = await this.drizzle.db
            .select({
                routine: routinesInApp,
                createdByName: usersInApp.fullName,
                exerciseCount: count(routineExercisesInApp.id),
            })
            .from(routinesInApp)
            .leftJoin(usersInApp, eq(routinesInApp.createdByUserId, usersInApp.id))
            .leftJoin(routineExercisesInApp, eq(routineExercisesInApp.routineId, routinesInApp.id))
            .where(and(...conds))
            .groupBy(routinesInApp.id, usersInApp.fullName)
            .orderBy(desc(routinesInApp.updatedAt));

        return rows.map((r) => ({
            id: r.routine.id,
            name: r.routine.name,
            objective: r.routine.objective,
            status: r.routine.status,
            createdByName: r.createdByName,
            exerciseCount: Number(r.exerciseCount),
            updatedAt: r.routine.updatedAt,
        }));
    }

    async create(dto: CreateRoutineDto, userId: string): Promise<RoutineDetailDto> {
        const [created] = await this.drizzle.db
            .insert(routinesInApp)
            .values({
                // '' también cae al default (por eso no aplica ??)
                name: dto.name?.trim() ? dto.name.trim() : DEFAULT_NAME,
                ...(dto.objective && { objective: dto.objective }),
                // Dueño = quien crea, sin importar el perfil (trainer/staff/futuros).
                createdByUserId: userId,
            })
            .returning({ id: routinesInApp.id });
        if (!created) throw new Error('No se pudo crear la rutina');
        return this.detail(created.id);
    }

    async detail(id: string): Promise<RoutineDetailDto> {
        const [r] = await this.drizzle.db
            .select({ routine: routinesInApp, createdByName: usersInApp.fullName })
            .from(routinesInApp)
            .leftJoin(usersInApp, eq(routinesInApp.createdByUserId, usersInApp.id))
            .where(and(eq(routinesInApp.id, id), isNull(routinesInApp.deletedAt)))
            .limit(1);
        if (!r) throw new NotFoundException('Rutina no encontrada');

        const items = await this.drizzle.db
            .select({ item: routineExercisesInApp, exercise: exercisesInApp })
            .from(routineExercisesInApp)
            .innerJoin(exercisesInApp, eq(routineExercisesInApp.exerciseId, exercisesInApp.id))
            .where(eq(routineExercisesInApp.routineId, id))
            .orderBy(asc(routineExercisesInApp.displayOrder));

        return this.toDetail(r.routine, r.createdByName, items);
    }

    async update(id: string, dto: UpdateRoutineDto): Promise<RoutineDetailDto> {
        await this.ensureExists(id);
        if (dto.status === 'ACTIVE') {
            const [c] = await this.drizzle.db
                .select({ n: count() })
                .from(routineExercisesInApp)
                .where(eq(routineExercisesInApp.routineId, id));
            if (Number(c?.n ?? 0) === 0) {
                throw new BadRequestException('La rutina necesita al menos un ejercicio para publicarse');
            }
        }
        await this.drizzle.db
            .update(routinesInApp)
            .set({
                ...(dto.name !== undefined && { name: dto.name.trim() || DEFAULT_NAME }),
                ...(dto.objective !== undefined && { objective: dto.objective }),
                ...(dto.status !== undefined && { status: dto.status }),
                updatedAt: sql`now()`,
            })
            .where(eq(routinesInApp.id, id));
        return this.detail(id);
    }

    async remove(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.drizzle.db
            .update(routinesInApp)
            .set({ deletedAt: sql`now()` })
            .where(eq(routinesInApp.id, id));
    }

    async addExercise(routineId: string, dto: AddRoutineExerciseDto): Promise<RoutineDetailDto> {
        await this.ensureExists(routineId);
        const [exercise] = await this.drizzle.db
            .select({ id: exercisesInApp.id })
            .from(exercisesInApp)
            .where(
                and(
                    eq(exercisesInApp.id, dto.exerciseId),
                    eq(exercisesInApp.status, 'ACTIVE'),
                    isNull(exercisesInApp.deletedAt),
                ),
            )
            .limit(1);
        if (!exercise) throw new NotFoundException('Ejercicio no encontrado en el catálogo');

        const [max] = await this.drizzle.db
            .select({ m: sql<number>`coalesce(max(${routineExercisesInApp.displayOrder}), 0)` })
            .from(routineExercisesInApp)
            .where(eq(routineExercisesInApp.routineId, routineId));

        await this.drizzle.db.insert(routineExercisesInApp).values({
            routineId,
            exerciseId: dto.exerciseId,
            displayOrder: Number(max?.m ?? 0) + 1,
            ...(dto.sets !== undefined && { sets: dto.sets }),
            ...(dto.reps !== undefined && { reps: dto.reps }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
        });
        await this.touch(routineId);
        return this.detail(routineId);
    }

    async updateExercise(routineId: string, itemId: string, dto: UpdateRoutineExerciseDto): Promise<RoutineDetailDto> {
        const item = await this.findItem(routineId, itemId);
        const patch = {
            ...(dto.sets !== undefined && { sets: dto.sets }),
            ...(dto.reps !== undefined && { reps: dto.reps }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
        };
        if (Object.keys(patch).length > 0) {
            await this.drizzle.db.update(routineExercisesInApp).set(patch).where(eq(routineExercisesInApp.id, item.id));
            await this.touch(routineId);
        }
        return this.detail(routineId);
    }

    async removeExercise(routineId: string, itemId: string): Promise<RoutineDetailDto> {
        const item = await this.findItem(routineId, itemId);
        // Sin renumerar: los huecos en display_order no afectan el orden
        // relativo, y así dos remove concurrentes (tool calls paralelas de
        // Forge) nunca tocan filas compartidas ni pueden chocar.
        await this.drizzle.db.delete(routineExercisesInApp).where(eq(routineExercisesInApp.id, item.id));
        await this.touch(routineId);
        return this.detail(routineId);
    }

    /** Alta de varios ejercicios en UNA transacción: los display_order se
     *  calculan una sola vez, así no hay carrera posible entre altas. */
    async addExercises(routineId: string, items: AddRoutineExerciseDto[]): Promise<RoutineDetailDto> {
        await this.ensureExists(routineId);
        const exerciseIds = [...new Set(items.map((i) => i.exerciseId))];
        const found = await this.drizzle.db
            .select({ id: exercisesInApp.id })
            .from(exercisesInApp)
            .where(
                and(
                    inArray(exercisesInApp.id, exerciseIds),
                    eq(exercisesInApp.status, 'ACTIVE'),
                    isNull(exercisesInApp.deletedAt),
                ),
            );
        if (found.length !== exerciseIds.length) {
            throw new NotFoundException('Alguno de los ejercicios no existe en el catálogo');
        }

        await this.drizzle.db.transaction(async (tx) => {
            const [max] = await tx
                .select({ m: sql<number>`coalesce(max(${routineExercisesInApp.displayOrder}), 0)` })
                .from(routineExercisesInApp)
                .where(eq(routineExercisesInApp.routineId, routineId));
            let order = Number(max?.m ?? 0);
            for (const item of items) {
                order += 1;
                await tx.insert(routineExercisesInApp).values({
                    routineId,
                    exerciseId: item.exerciseId,
                    displayOrder: order,
                    ...(item.sets !== undefined && { sets: item.sets }),
                    ...(item.reps !== undefined && { reps: item.reps }),
                    ...(item.notes !== undefined && { notes: item.notes }),
                });
            }
        });
        await this.touch(routineId);
        return this.detail(routineId);
    }

    /**
     * Reemplaza un plan completo en una sola transacción. Forge lo usa al
     * generar/reconstruir para no dejar el borrador vacío o a medio escribir si
     * falla una operación posterior.
     */
    async replaceDraftPlan(routineId: string, plan: ReplaceRoutinePlanInput): Promise<RoutineDetailDto> {
        if (plan.items.length === 0) {
            throw new BadRequestException('El plan necesita al menos un ejercicio');
        }
        const exerciseIds = plan.items.map((item) => item.exerciseId);
        if (new Set(exerciseIds).size !== exerciseIds.length) {
            throw new BadRequestException('El plan no puede repetir el mismo ejercicio');
        }

        await this.drizzle.db.transaction(async (tx) => {
            const [routine] = await tx
                .select({ status: routinesInApp.status, updatedAt: routinesInApp.updatedAt })
                .from(routinesInApp)
                .where(and(eq(routinesInApp.id, routineId), isNull(routinesInApp.deletedAt)))
                .limit(1)
                .for('update');
            if (!routine) throw new NotFoundException('Rutina no encontrada');
            if (routine.status !== 'DRAFT') {
                throw new BadRequestException('Forge solo puede reemplazar una rutina en borrador');
            }
            if (routine.updatedAt !== plan.expectedUpdatedAt) {
                throw new ConflictException('La rutina cambió mientras Forge preparaba el plan; vuelve a leerla');
            }

            const found = await tx
                .select({ id: exercisesInApp.id })
                .from(exercisesInApp)
                .where(
                    and(
                        inArray(exercisesInApp.id, exerciseIds),
                        eq(exercisesInApp.status, 'ACTIVE'),
                        isNull(exercisesInApp.deletedAt),
                    ),
                );
            if (found.length !== exerciseIds.length) {
                throw new NotFoundException('Alguno de los ejercicios no existe en el catálogo');
            }

            await tx.delete(routineExercisesInApp).where(eq(routineExercisesInApp.routineId, routineId));
            await tx.insert(routineExercisesInApp).values(
                plan.items.map((item, index) => ({
                    routineId,
                    exerciseId: item.exerciseId,
                    displayOrder: index + 1,
                    ...(item.sets !== undefined && { sets: item.sets }),
                    ...(item.reps !== undefined && { reps: item.reps }),
                    ...(item.notes !== undefined && { notes: item.notes }),
                })),
            );
            await tx
                .update(routinesInApp)
                .set({
                    name: plan.name.trim() || DEFAULT_NAME,
                    objective: plan.objective,
                    updatedAt: sql`now()`,
                })
                .where(eq(routinesInApp.id, routineId));
        });

        return this.detail(routineId);
    }

    /** Vacía la rutina en una sola transacción (para el "limpia todo" de Forge).
     *  Solo sobre borradores: una rutina publicada no se vacía por chat. */
    async removeAllExercises(routineId: string): Promise<RoutineDetailDto> {
        const [r] = await this.drizzle.db
            .select({ status: routinesInApp.status })
            .from(routinesInApp)
            .where(and(eq(routinesInApp.id, routineId), isNull(routinesInApp.deletedAt)))
            .limit(1);
        if (!r) throw new NotFoundException('Rutina no encontrada');
        if (r.status !== 'DRAFT') {
            throw new BadRequestException('Solo se puede vaciar una rutina en borrador');
        }
        await this.drizzle.db.delete(routineExercisesInApp).where(eq(routineExercisesInApp.routineId, routineId));
        await this.touch(routineId);
        return this.detail(routineId);
    }

    async reorderExercises(routineId: string, itemIds: string[]): Promise<RoutineDetailDto> {
        await this.ensureExists(routineId);
        const current = await this.drizzle.db
            .select({ id: routineExercisesInApp.id })
            .from(routineExercisesInApp)
            .where(eq(routineExercisesInApp.routineId, routineId));
        const currentIds = new Set(current.map((r) => r.id));
        const incoming = new Set(itemIds);
        const sameSet =
            currentIds.size === incoming.size &&
            itemIds.length === incoming.size &&
            [...currentIds].every((id) => incoming.has(id));
        if (!sameSet) {
            throw new BadRequestException('La lista de ejercicios no coincide con la rutina actual');
        }
        await this.drizzle.db.transaction(async (tx) => {
            await this.renumber(tx, itemIds);
        });
        await this.touch(routineId);
        return this.detail(routineId);
    }

    async assign(routineId: string, memberId: string, userId: string): Promise<void> {
        const routine = await this.detail(routineId);
        if (routine.status !== 'ACTIVE') {
            throw new BadRequestException('Solo se pueden asignar rutinas publicadas');
        }
        const [member] = await this.drizzle.db
            .select({ id: membersInApp.id })
            .from(membersInApp)
            .where(and(eq(membersInApp.id, memberId), isNull(membersInApp.deletedAt)))
            .limit(1);
        if (!member) throw new NotFoundException('Miembro no encontrado');

        const [existing] = await this.drizzle.db
            .select({ id: memberRoutinesInApp.id })
            .from(memberRoutinesInApp)
            .where(
                and(
                    eq(memberRoutinesInApp.memberId, memberId),
                    eq(memberRoutinesInApp.routineId, routineId),
                    eq(memberRoutinesInApp.status, 'ACTIVE'),
                    isNull(memberRoutinesInApp.deletedAt),
                ),
            )
            .limit(1);
        if (existing) throw new ConflictException('El miembro ya tiene esta rutina asignada');

        await this.drizzle.db.insert(memberRoutinesInApp).values({
            memberId,
            routineId,
            // Quien asigna, sin importar el perfil (trainer/staff/futuros).
            assignedByUserId: userId,
        });
    }

    /** Rutinas publicadas con asignación activa para el user autenticado (mobile). */
    async listMine(userId: string): Promise<RoutineDetailDto[]> {
        const [member] = await this.drizzle.db
            .select({ id: membersInApp.id })
            .from(membersInApp)
            .where(and(eq(membersInApp.userId, userId), isNull(membersInApp.deletedAt)))
            .limit(1);
        if (!member) return [];

        const assignments = await this.drizzle.db
            .select({ routineId: memberRoutinesInApp.routineId })
            .from(memberRoutinesInApp)
            .innerJoin(routinesInApp, eq(memberRoutinesInApp.routineId, routinesInApp.id))
            .where(
                and(
                    eq(memberRoutinesInApp.memberId, member.id),
                    eq(memberRoutinesInApp.status, 'ACTIVE'),
                    isNull(memberRoutinesInApp.deletedAt),
                    eq(routinesInApp.status, 'ACTIVE'),
                    isNull(routinesInApp.deletedAt),
                ),
            )
            .orderBy(desc(memberRoutinesInApp.assignedAt));

        return Promise.all(assignments.map(async (a) => this.detail(a.routineId)));
    }

    private async ensureExists(id: string): Promise<void> {
        const [r] = await this.drizzle.db
            .select({ id: routinesInApp.id })
            .from(routinesInApp)
            .where(and(eq(routinesInApp.id, id), isNull(routinesInApp.deletedAt)))
            .limit(1);
        if (!r) throw new NotFoundException('Rutina no encontrada');
    }

    private async findItem(routineId: string, itemId: string): Promise<ItemRow> {
        const [row] = await this.drizzle.db
            .select()
            .from(routineExercisesInApp)
            .where(and(eq(routineExercisesInApp.id, itemId), eq(routineExercisesInApp.routineId, routineId)))
            .limit(1);
        if (!row) throw new NotFoundException('Ejercicio no encontrado en la rutina');
        return row;
    }

    /** Renumera a 1..n en dos pasadas (primero con offset) para no chocar
     *  con el unique (routine_id, display_order) a mitad de camino. */
    private async renumber(tx: Tx, orderedIds: string[]): Promise<void> {
        for (const [i, id] of orderedIds.entries()) {
            await tx
                .update(routineExercisesInApp)
                .set({ displayOrder: i + 1 + RENUMBER_OFFSET })
                .where(eq(routineExercisesInApp.id, id));
        }
        for (const [i, id] of orderedIds.entries()) {
            await tx
                .update(routineExercisesInApp)
                .set({ displayOrder: i + 1 })
                .where(eq(routineExercisesInApp.id, id));
        }
    }

    private async touch(routineId: string): Promise<void> {
        await this.drizzle.db
            .update(routinesInApp)
            .set({ updatedAt: sql`now()` })
            .where(eq(routinesInApp.id, routineId));
    }

    private toDetail(
        routine: RoutineRow,
        createdByName: string | null,
        rows: { item: ItemRow; exercise: ExerciseRow }[],
    ): RoutineDetailDto {
        return {
            id: routine.id,
            name: routine.name,
            objective: routine.objective,
            status: routine.status,
            createdByName,
            createdAt: routine.createdAt,
            updatedAt: routine.updatedAt,
            exercises: rows.map(({ item, exercise }) => ({
                id: item.id,
                exerciseId: item.exerciseId,
                displayOrder: item.displayOrder,
                sets: item.sets,
                reps: item.reps,
                notes: item.notes,
                exercise: {
                    name: exercise.name,
                    bodyPart: exercise.bodyPart,
                    equipment: exercise.equipment,
                    target: exercise.target,
                    gifUrl: exercise.gifUrl,
                    imageUrl: exercise.imageUrl,
                },
            })),
        };
    }
}
