import { describe, expect, it, vi } from 'vitest';
import {
    prepareAgentExerciseSearch,
    searchExerciseCatalogForAgent,
    type AgentExerciseCandidate,
    type AgentExerciseCatalogReader,
} from '../src/modules/exercises/exercise-agent-search';
import { buildExerciseCatalogTools } from '../src/modules/exercises/exercise-agent-tools';
import type { ExerciseFacetsDto, ExerciseSlimDto } from '../src/modules/exercises/exercise.types';
import type { ExercisesService } from '../src/modules/exercises/exercises.service';

const facets: ExerciseFacetsDto = {
    bodyParts: ['back', 'upper arms'],
    equipments: ['barbell', 'body weight', 'cable', 'dumbbell'],
    targets: ['biceps', 'lats', 'traps', 'upper back'],
};

function slim(candidate: AgentExerciseCandidate): ExerciseSlimDto {
    return {
        ...candidate,
        muscleGroup: null,
        imageUrl: null,
        gifUrl: null,
    };
}

function catalogMock(options?: {
    exactItems?: AgentExerciseCandidate[];
    candidates?: AgentExerciseCandidate[];
}): AgentExerciseCatalogReader & {
    facets: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    agentCandidates: ReturnType<typeof vi.fn>;
} {
    const exactItems = options?.exactItems ?? [];
    return {
        facets: vi.fn().mockResolvedValue(facets),
        list: vi.fn().mockResolvedValue({
            items: exactItems.map(slim),
            total: exactItems.length,
            limit: 5,
            offset: 0,
        }),
        agentCandidates: vi.fn().mockResolvedValue(options?.candidates ?? []),
    };
}

describe('agent exercise catalog search', () => {
    it('canonicaliza casing, separadores y plurales, y detecta target=back como bodyPart mal ubicado', () => {
        const prepared = prepareAgentExerciseSearch(
            {
                q: '  curl  ',
                bodyPart: ' Back ',
                equipment: 'CABLES',
                target: 'back',
                limit: 5,
            },
            facets,
        );

        expect(prepared.appliedFilters).toEqual({ q: 'curl', bodyPart: 'back', equipment: 'cable' });
        expect(prepared.normalizedFilters).toEqual([
            { filter: 'bodyPart', requested: 'Back', canonical: 'back' },
            { filter: 'equipment', requested: 'CABLES', canonical: 'cable' },
        ]);
        expect(prepared.ignoredFilters).toEqual([
            {
                filter: 'target',
                requested: 'back',
                reason: 'value-belongs-to-another-filter',
                replacementFilter: 'bodyPart',
                message: '"back" is a bodyPart value, not a target value.',
            },
        ]);
    });

    it('recupera curl + back + cable + target back con ejercicios coherentes de espalda y cable', async () => {
        const cableCurl: AgentExerciseCandidate = {
            id: 'curl',
            name: 'cable standing biceps curl',
            bodyPart: 'upper arms',
            equipment: 'cable',
            target: 'biceps',
        };
        const pulldown: AgentExerciseCandidate = {
            id: 'pulldown',
            name: 'cable bar lateral pulldown',
            bodyPart: 'back',
            equipment: 'cable',
            target: 'lats',
        };
        const barbellRow: AgentExerciseCandidate = {
            id: 'row',
            name: 'barbell bent over row',
            bodyPart: 'back',
            equipment: 'barbell',
            target: 'upper back',
        };
        const catalog = catalogMock({ candidates: [cableCurl, barbellRow, pulldown] });

        const result = await searchExerciseCatalogForAgent(catalog, {
            q: 'curl',
            bodyPart: 'back',
            equipment: 'cable',
            target: 'back',
            limit: 5,
        });

        expect(catalog.list).toHaveBeenCalledWith({
            limit: 5,
            offset: 0,
            q: 'curl',
            bodyPart: 'back',
            equipment: 'cable',
        });
        expect(catalog.agentCandidates).toHaveBeenCalledWith({
            q: 'curl',
            bodyPart: 'back',
            equipment: 'cable',
        });
        expect(result.matchMode).toBe('related');
        expect(result.items.map((item) => item.id)).toEqual(['pulldown']);
        expect(result.items[0]?.matchedFilters).toEqual(['bodyPart', 'equipment']);
        expect(result.preservedFilters).toEqual(['bodyPart', 'equipment']);
        expect(result.relaxedFilters).toEqual([
            {
                filter: 'q',
                requested: 'curl',
                reason: 'not-satisfied-by-selected-interpretation',
                message: 'q="curl" was relaxed to preserve bodyPart, equipment.',
            },
        ]);
        expect(result.ignoredFilters[0]).toMatchObject({
            filter: 'target',
            replacementFilter: 'bodyPart',
        });
        expect(result.guidance).toContain('One coherent interpretation was selected');
    });

    it('mantiene la búsqueda estricta cuando hay resultados y no consulta candidatos OR', async () => {
        const exact: AgentExerciseCandidate = {
            id: 'lat-pulldown',
            name: 'cable lat pulldown full range of motion',
            bodyPart: 'back',
            equipment: 'cable',
            target: 'lats',
        };
        const catalog = catalogMock({ exactItems: [exact] });

        const result = await searchExerciseCatalogForAgent(catalog, {
            q: 'lat pulldown',
            bodyPart: 'BACK',
            equipment: 'cable',
            target: 'lats',
            limit: 5,
        });

        expect(result.matchMode).toBe('exact');
        expect(result.items[0]?.matchedFilters).toEqual(['q', 'bodyPart', 'equipment', 'target']);
        expect(catalog.agentCandidates).not.toHaveBeenCalled();
    });

    it('no transforma filtros totalmente inválidos en una lista genérica del catálogo', async () => {
        const catalog = catalogMock();

        const result = await searchExerciseCatalogForAgent(catalog, {
            target: 'whole posterior chain somehow',
            limit: 5,
        });

        expect(result).toMatchObject({ total: 0, items: [], matchMode: 'none' });
        expect(catalog.list).not.toHaveBeenCalled();
        expect(catalog.agentCandidates).not.toHaveBeenCalled();
    });

    it('notifica únicamente los IDs que searchExercises devolvió al agente', async () => {
        const coherent: AgentExerciseCandidate = {
            id: 'pulldown',
            name: 'cable bar lateral pulldown',
            bodyPart: 'back',
            equipment: 'cable',
            target: 'lats',
        };
        const rejectedInterpretation: AgentExerciseCandidate = {
            id: 'curl',
            name: 'cable standing biceps curl',
            bodyPart: 'upper arms',
            equipment: 'cable',
            target: 'biceps',
        };
        const catalog = catalogMock({ candidates: [rejectedInterpretation, coherent] });
        const onSearchResults = vi.fn();
        const tools = buildExerciseCatalogTools(catalog as unknown as ExercisesService, vi.fn(), {
            onSearchResults,
        });

        await tools.searchExercises.execute?.(
            { q: 'curl', bodyPart: 'back', equipment: 'cable', target: 'back', limit: 5 },
            { toolCallId: 'test-call', messages: [] },
        );

        expect(onSearchResults).toHaveBeenCalledOnce();
        expect(onSearchResults).toHaveBeenCalledWith(['pulldown']);
    });
});
