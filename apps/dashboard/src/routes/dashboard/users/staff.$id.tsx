import { createFileRoute } from '@tanstack/react-router';
import { UserX, AlertTriangle } from 'lucide-react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { UserProfileDetail } from '@/src/features/dashboard/users/components/user-profile-detail';
import {
    UserProfileDetailSkeleton,
    UserProfileMessage,
} from '@/src/features/dashboard/users/components/user-profile-states';
import { useUser } from '@/src/features/dashboard/users/hooks';
import { ApiError } from '@/lib/api';

export const Route = createFileRoute('/dashboard/users/staff/$id')({
    component: StaffDetailPage,
});

function crumbs(last: string) {
    return [
        { label: 'Mind & Body', href: '/dashboard' },
        { label: 'Usuarios', href: '/dashboard/users' },
        { label: last },
    ];
}

function StaffDetailPage() {
    const { id = '' }: { id: string } = Route.useParams();
    const { data: user, isLoading, error } = useUser(id);

    if (isLoading) {
        return (
            <>
                <DashboardHeader breadcrumbs={crumbs('Cargando...')} />
                <div className="flex-1 overflow-auto p-6">
                    <UserProfileDetailSkeleton />
                </div>
            </>
        );
    }

    if (error || !user) {
        const notFound = error instanceof ApiError && error.status === 404;
        return (
            <>
                <DashboardHeader breadcrumbs={crumbs(notFound ? 'No encontrado' : 'Error')} />
                <div className="flex-1 overflow-auto p-6">
                    <UserProfileMessage
                        icon={notFound ? UserX : AlertTriangle}
                        title={notFound ? 'Usuario no encontrado' : 'No se pudo cargar el usuario'}
                        description={
                            notFound
                                ? 'El usuario no existe o fue eliminado.'
                                : 'Ocurrió un error al cargar los datos. Reintentá más tarde.'
                        }
                    />
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
                    { label: 'Staff' },
                ]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader title={user.fullName} description="Perfil de staff" className="mb-6" />
                <UserProfileDetail user={user} profileType="STAFF" />
            </div>
        </>
    );
}
