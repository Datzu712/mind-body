export interface ExerciseSlim {
    id: string;
    name: string;
    bodyPart: string | null;
    equipment: string | null;
    target: string | null;
    muscleGroup: string | null;
    imageUrl: string | null;
    gifUrl: string | null;
}

export interface ExerciseDetail extends ExerciseSlim {
    secondaryMuscles: string[];
    instructions: string[];
    description: string | null;
}

export interface PaginatedExercises {
    items: ExerciseSlim[];
    total: number;
    limit: number;
    offset: number;
}

export interface ExerciseFacets {
    bodyParts: string[];
    equipments: string[];
    targets: string[];
}

export interface ExercisesFilters {
    limit: number;
    offset: number;
    q?: string;
    bodyPart?: string;
    equipment?: string;
}
