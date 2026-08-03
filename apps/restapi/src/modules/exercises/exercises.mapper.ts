import type { exercisesInApp } from '@/infra/database/pg/schemas/schema';
import type { ExerciseDetailDto, ExerciseSlimDto } from './exercise.types';

export type ExerciseRow = typeof exercisesInApp.$inferSelect;

export function toSlimDto(row: ExerciseRow): ExerciseSlimDto {
    return {
        id: row.id,
        name: row.name,
        bodyPart: row.bodyPart,
        equipment: row.equipment,
        target: row.target,
        muscleGroup: row.muscleGroup,
        imageUrl: row.imageUrl,
        gifUrl: row.gifUrl,
    };
}

export function toDetailDto(row: ExerciseRow): ExerciseDetailDto {
    return {
        ...toSlimDto(row),
        secondaryMuscles: row.secondaryMuscles ?? [],
        instructions: row.instructionsEs?.length ? row.instructionsEs : (row.instructionsEn ?? []),
        description: row.description,
    };
}
