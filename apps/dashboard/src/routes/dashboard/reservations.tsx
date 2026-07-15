import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { WeekCalendarTab } from '@/src/features/dashboard/reservations/components/WeekCalendarTab';

export const Route = createFileRoute('/dashboard/reservations')({
    component: ReservationsPage,
});

function ReservationsPage() {
    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Reservas' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Calendario de reservas"
                    description="Consulta las sesiones de la semana y gestiona reservas, asistencia y listas de espera."
                    className="mb-6"
                />
                <WeekCalendarTab />
            </div>
        </>
    );
}
