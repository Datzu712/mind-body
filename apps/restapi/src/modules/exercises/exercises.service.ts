import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { exercisesInApp } from '@/infra/database/pg/schemas/schema';
import type { AgentExerciseCandidate, AgentExerciseSearchFilters } from './exercise-agent-search';
import { toDetailDto, toSlimDto } from './exercises.mapper';
import type { ExerciseDetailDto, ExerciseFacetsDto, PaginatedExercisesDto } from './exercise.types';
import type { ListExercisesQueryDto } from './dto/exercise.dtos';

@Injectable()
export class ExercisesService {
    constructor(private readonly drizzle: DrizzleService) {}

    /** Catálogo visible: activos y no borrados. */
    private baseConditions(): SQL[] {
        return [eq(exercisesInApp.status, 'ACTIVE'), isNull(exercisesInApp.deletedAt)];
    }

    async list(query: ListExercisesQueryDto): Promise<PaginatedExercisesDto> {
        const conds = this.baseConditions();
        if (query.q) {
            const escaped = query.q.replace(/[\\%_]/g, (m) => `\\${m}`);
            conds.push(ilike(exercisesInApp.name, `%${escaped}%`));
        }
        if (query.bodyPart) conds.push(eq(exercisesInApp.bodyPart, query.bodyPart));
        if (query.equipment) conds.push(eq(exercisesInApp.equipment, query.equipment));
        if (query.target) conds.push(eq(exercisesInApp.target, query.target));
        const where = and(...conds);

        const [rows, totalRows] = await Promise.all([
            this.drizzle.db
                .select()
                .from(exercisesInApp)
                .where(where)
                .orderBy(asc(exercisesInApp.name))
                .limit(query.limit)
                .offset(query.offset),
            this.drizzle.db.select({ total: count() }).from(exercisesInApp).where(where),
        ]);
        const total = totalRows[0]?.total ?? 0;

        return { items: rows.map(toSlimDto), total, limit: query.limit, offset: query.offset };
    }

    /**
     * Candidatos para recuperar una búsqueda sobre-restringida de un agente.
     * Usa OR intencionalmente y proyecta solo los campos necesarios; el helper
     * de búsqueda los ordena después y nunca cambia la semántica del GET público.
     */
    async agentCandidates(filters: AgentExerciseSearchFilters): Promise<AgentExerciseCandidate[]> {
        const signals: SQL[] = [];
        if (filters.q) {
            const escaped = filters.q.replace(/[\\%_]/g, (m) => `\\${m}`);
            signals.push(ilike(exercisesInApp.name, `%${escaped}%`));
        }
        if (filters.bodyPart) signals.push(eq(exercisesInApp.bodyPart, filters.bodyPart));
        if (filters.equipment) signals.push(eq(exercisesInApp.equipment, filters.equipment));
        if (filters.target) signals.push(eq(exercisesInApp.target, filters.target));
        if (signals.length === 0) return [];

        return this.drizzle.db
            .select({
                id: exercisesInApp.id,
                name: exercisesInApp.name,
                bodyPart: exercisesInApp.bodyPart,
                equipment: exercisesInApp.equipment,
                target: exercisesInApp.target,
            })
            .from(exercisesInApp)
            .where(and(...this.baseConditions(), or(...signals)))
            .orderBy(asc(exercisesInApp.name));
    }

    async facets(): Promise<ExerciseFacetsDto> {
        const distinct = async (
            column: typeof exercisesInApp.bodyPart | typeof exercisesInApp.equipment | typeof exercisesInApp.target,
        ) => {
            const rows = await this.drizzle.db
                .selectDistinct({ v: column })
                .from(exercisesInApp)
                .where(and(...this.baseConditions()));
            return rows
                .map((r) => r.v)
                .filter((v): v is string => !!v)
                .sort();
        };
        const [bodyParts, equipments, targets] = await Promise.all([
            distinct(exercisesInApp.bodyPart),
            distinct(exercisesInApp.equipment),
            distinct(exercisesInApp.target),
        ]);
        return { bodyParts, equipments, targets };
    }

    async detail(id: string): Promise<ExerciseDetailDto> {
        const [row] = await this.drizzle.db
            .select()
            .from(exercisesInApp)
            .where(and(eq(exercisesInApp.id, id), ...this.baseConditions()))
            .limit(1);
        if (!row) throw new NotFoundException('Ejercicio no encontrado');
        return toDetailDto(row);
    }
}
