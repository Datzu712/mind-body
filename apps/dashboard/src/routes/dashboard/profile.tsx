import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { UserProfileDetail } from '@/src/features/dashboard/users/components/user-profile-detail';
import { Badge } from '@/components/ui/badge';
import { UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/src/features/dashboard/users/hooks';

export const Route = createFileRoute('/dashboard/profile')({
    component: ProfilePage,
});

function ProfilePage() {
    const { user: authUser } = useAuth();
    const { data: user, isLoading } = useUser(authUser?.id ?? '');

    if (isLoading || !user) {
        return (
            <>
                <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Mi perfil' }]} />
                <div className="flex-1 overflow-auto p-6">
                    <p className="text-muted-foreground">Cargando perfil...</p>
                </div>
            </>
        );
    }

    const primaryProfile = user.profiles.includes('STAFF')
        ? ('STAFF' as const)
        : user.profiles.includes('TRAINER')
          ? ('TRAINER' as const)
          : ('MEMBER' as const);

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Mi perfil' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <UserRound className="h-7 w-7 text-primary" />
                            Mi perfil
                        </span>
                    }
                    description="Actualiza tu informacion personal en cualquier momento."
                    actions={
                        <Badge variant="secondary" className="text-sm">
                            {primaryProfile === 'STAFF'
                                ? 'Staff'
                                : primaryProfile === 'TRAINER'
                                  ? 'Entrenador'
                                  : 'Miembro'}
                        </Badge>
                    }
                    className="mb-6"
                />
                <UserProfileDetail user={user} profileType={primaryProfile} isOwnProfile />
            </div>
        </>
    );
}
