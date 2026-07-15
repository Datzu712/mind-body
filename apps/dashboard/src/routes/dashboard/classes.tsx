import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { ClassManagementTab } from '@/src/features/dashboard/reservations/components/ClassManagementTab';

export const Route = createFileRoute('/dashboard/classes')({
    component: ClassesPage,
});

function ClassesPage() {
    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Clases' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Clases"
                    description="Gestiona el catálogo de clases, horarios y cupos."
                    className="mb-6"
                />
                <ClassManagementTab />
            </div>
        </>
    );
}
