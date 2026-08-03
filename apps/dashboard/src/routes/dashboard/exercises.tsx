import { createFileRoute } from '@tanstack/react-router';
import { ExercisesPage } from '@/src/features/dashboard/exercises/components/exercises-page';

export const Route = createFileRoute('/dashboard/exercises')({
    component: ExercisesPage,
});
