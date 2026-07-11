import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/routines')({
    component: RoutinesLayout,
});

function RoutinesLayout() {
    return <Outlet />;
}
