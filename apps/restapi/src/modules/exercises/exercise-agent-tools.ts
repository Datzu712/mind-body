import { tool } from 'ai';
import { z } from 'zod';
import { searchExerciseCatalogForAgent } from './exercise-agent-search';
import type { ExercisesService } from './exercises.service';

/** Tools del catálogo de ejercicios para agentes LLM (coach del miembro y
 *  Forge, el asistente del entrenador). Los errores se devuelven como data via onError
 *  para que una tool caída no mate el stream. */
export function buildExerciseCatalogTools(
    exercises: ExercisesService,
    onError: (toolName: string, err: unknown) => { error: string },
    options: { onSearchResults?: (ids: string[]) => void } = {},
) {
    return {
        getExerciseFilters: tool({
            description:
                'Get the valid filter values of the exercise catalog: body parts, equipment types and target ' +
                'muscles. Call this before searchExercises when you need to filter by one of those fields. ' +
                'bodyPart is a broad anatomical region (for example back); target is the primary muscle ' +
                '(for example lats or upper back), so never copy a bodyPart value into target.',
            inputSchema: z.object({}),
            execute: async () => {
                try {
                    const facets = await exercises.facets();
                    return {
                        ...facets,
                        usage: {
                            bodyPart: 'Broad anatomical region, e.g. back or upper arms.',
                            equipment: 'Required apparatus, e.g. cable or dumbbell.',
                            target: 'Primary muscle, e.g. lats, upper back or biceps; it is not a bodyPart.',
                        },
                    };
                } catch (err) {
                    return onError('getExerciseFilters', err);
                }
            },
        }),
        searchExercises: tool({
            description:
                "Search the app's exercise library. Every exercise you recommend must come from here so the " +
                'user can find it (with demo GIF and instructions) in the Exercises section of the app. ' +
                'Filters must use values returned by getExerciseFilters. Use q only for words expected in the ' +
                'English exercise name; do not use it as a movement category. Use the fewest independent filters ' +
                'needed. If matchMode is related, no item matched everything: inspect matchedFilters on every item ' +
                'plus preservedFilters and relaxedFilters. Never describe a relaxed filter as satisfied; retry ' +
                'separately when that constraint was essential.',
            inputSchema: z.object({
                q: z.string().max(120).optional().describe('Free-text search on the exercise name (English)'),
                bodyPart: z.string().max(80).optional(),
                equipment: z.string().max(80).optional(),
                target: z.string().max(80).optional().describe('Primary muscle worked'),
                limit: z.number().int().min(1).max(25).default(10),
            }),
            execute: async ({ q, bodyPart, equipment, target, limit }) => {
                try {
                    const result = await searchExerciseCatalogForAgent(exercises, {
                        limit,
                        ...(q && { q }),
                        ...(bodyPart && { bodyPart }),
                        ...(equipment && { equipment }),
                        ...(target && { target }),
                    });
                    options.onSearchResults?.(result.items.map((item) => item.id));
                    return result;
                } catch (err) {
                    return onError('searchExercises', err);
                }
            },
        }),
        getExerciseDetails: tool({
            description:
                'Get the full details of one exercise from the library by its id (from searchExercises): ' +
                'step-by-step instructions, secondary muscles and description. Use it when explaining form ' +
                'or technique for a specific exercise.',
            inputSchema: z.object({
                id: z.string().describe('Exercise id returned by searchExercises'),
            }),
            execute: async ({ id }) => {
                try {
                    const e = await exercises.detail(id);
                    return {
                        name: e.name,
                        bodyPart: e.bodyPart,
                        equipment: e.equipment,
                        target: e.target,
                        secondaryMuscles: e.secondaryMuscles,
                        instructions: e.instructions,
                        description: e.description,
                    };
                } catch (err) {
                    return onError('getExerciseDetails', err);
                }
            },
        }),
    };
}
