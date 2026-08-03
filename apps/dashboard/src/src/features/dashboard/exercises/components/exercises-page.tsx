import { useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { ExerciseDetailSheet } from './exercise-detail-sheet';
import { ExerciseLibrary } from './exercise-library';

export function ExercisesPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Ejercicios' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Ejercicios"
                    description="Biblioteca de ejercicios del gimnasio: buscá por nombre, grupo muscular o equipo."
                    className="mb-6"
                />
                <ExerciseLibrary onExerciseClick={(exercise) => setSelectedId(exercise.id)} />
                <ExerciseDetailSheet exerciseId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
            </div>
        </>
    );
}
