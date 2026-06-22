import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { UserProfileDetail } from '@/src/features/dashboard/users/components/user-profile-detail';
import { Badge } from '@/components/ui/badge';
import { UserRound } from 'lucide-react';
import { mockUsersUnified } from '@/src/features/dashboard/users/mock-data';

export const Route = createFileRoute('/dashboard/profile')({
    component: ProfilePage,
});

function ProfilePage() {
    // Simulate current logged-in user (first staff user)
    const currentUser = mockUsersUnified.find((u) => u.profiles.includes('STAFF'))!;

    // Determine primary profile to show (prefer STAFF for dashboard users)
    const primaryProfile = currentUser.profiles.includes('STAFF')
        ? ('STAFF' as const)
        : currentUser.profiles.includes('TRAINER')
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
                <UserProfileDetail user={currentUser} profileType={primaryProfile} isOwnProfile />
            </div>
        </>
    );
}
