import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { KPICard } from '@/src/shared/components/kpi-card';
import { QuickActions } from '@/src/features/dashboard/components/quick-actions';
import { ActivityFeed } from '@/src/features/dashboard/components/activity-feed';
import { ReservationsTrendChart, ClassPopularityChart } from '@/src/features/dashboard/components/dashboard-charts';
import { useStatsOverview } from '@/src/features/dashboard/stats/hooks';
import type { StatsOverview } from '@/src/features/dashboard/stats/types';

export const Route = createFileRoute('/dashboard/')({
    component: DashboardPage,
});

/**
 * Every card maps to a live query. There is deliberately no revenue KPI: payments
 * happen in person and the system never records money, so any figure here would
 * be invented.
 */
const KPIS: { key: keyof StatsOverview; label: string; icon: string }[] = [
    { key: 'activeMembers', label: 'Miembros activos', icon: 'users' },
    { key: 'reservationsToday', label: 'Reservas hoy', icon: 'calendar' },
    { key: 'sessionsToday', label: 'Sesiones hoy', icon: 'calendar' },
    { key: 'activeClasses', label: 'Clases activas', icon: 'dumbbell' },
    { key: 'internalUsers', label: 'Usuarios internos', icon: 'user-cog' },
    { key: 'noShowsLast7Days', label: 'No-shows (7 días)', icon: 'alert' },
];

// TODO(memberships): add "Por vencer (7 días)" and "Vencidas" once the memberships
// module exposes them. Those are the cards that tell staff who to chase in person.

function DashboardPage() {
    const { data, isLoading, isError } = useStatsOverview();

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Mind & Body', href: '/dashboard' }, { label: 'Dashboard' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Dashboard"
                    description="Bienvenido al panel de administración de Mind & Body"
                    className="mb-6"
                />

                {isError && (
                    <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        No se pudieron cargar las métricas. Recarga la página o inténtalo más tarde.
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
                    {KPIS.map((kpi) =>
                        isLoading ? (
                            <div key={kpi.key} className="h-[118px] animate-pulse rounded-xl bg-muted/40" />
                        ) : (
                            <KPICard
                                key={kpi.key}
                                label={kpi.label}
                                value={data ? data[kpi.key].toLocaleString('es-CR') : '—'}
                                icon={kpi.icon}
                            />
                        ),
                    )}
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                    <ReservationsTrendChart />
                    <ClassPopularityChart />
                </div>

                {/* Quick Actions & Activity */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <QuickActions />
                    <ActivityFeed />
                </div>
            </div>
        </>
    );
}
