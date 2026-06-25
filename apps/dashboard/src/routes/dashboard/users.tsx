import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/users')({
    component: UsersLayout,
});

function UsersLayout() {
    return <Outlet />;
}
