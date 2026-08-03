export interface ExerciseSlimDto {
    id: string;
    name: string;
    bodyPart: string | null;
    equipment: string | null;
    target: string | null;
    muscleGroup: string | null;
    imageUrl: string | null;
    gifUrl: string | null;
}

export interface ExerciseDetailDto extends ExerciseSlimDto {
    secondaryMuscles: string[];
    /** Pasos en español; si el dataset no trae ES, cae a inglés. */
    instructions: string[];
    description: string | null;
}

export interface PaginatedExercisesDto {
    items: ExerciseSlimDto[];
    total: number;
    limit: number;
    offset: number;
}

export interface ExerciseFacetsDto {
    bodyParts: string[];
    equipments: string[];
    targets: string[];
}
