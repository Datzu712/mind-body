import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { UserProfileDetail } from '@/src/features/dashboard/users/components/user-profile-detail';
import { mockUsersUnified } from '@/src/features/dashboard/users/mock-data';

export const Route = createFileRoute('/dashboard/users/trainers/$id')({
    component: TrainerDetailPage,
});

function TrainerDetailPage() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { id } = Route.useParams();
    const user = mockUsersUnified.find((u) => u.id === id);

    if (!user) {
        return (
            <>
                <DashboardHeader
                    breadcrumbs={[
                        { label: 'Mind & Body', href: '/dashboard' },
                        { label: 'Usuarios', href: '/dashboard/users' },
                        { label: 'No encontrado' },
                    ]}
                />
                <div className="flex-1 overflow-auto p-6">
                    <p className="text-muted-foreground">Usuario no encontrado.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Mind & Body', href: '/dashboard' },
                    { label: 'Usuarios', href: '/dashboard/users' },
                    { label: user.fullName },
                    { label: 'Entrenador' },
                ]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader title={user.fullName} description="Perfil de entrenador" className="mb-6" />
                <UserProfileDetail user={user} profileType="TRAINER" />
            </div>
        </>
    );
}
