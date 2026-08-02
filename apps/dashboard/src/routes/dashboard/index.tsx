import { createFileRoute } from '@tanstack/react-router';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { KPICard } from '@/src/shared/components/kpi-card';
import { ActivityFeed } from '@/src/features/dashboard/components/activity-feed';
import {
    RevenueChart,
    ClassPopularityChart,
    MembershipDistributionChart,
} from '@/src/features/dashboard/components/dashboard-charts';
import { mockKPIs } from '@/src/shared/lib/mock-data';

export const Route = createFileRoute('/dashboard/')({
    component: DashboardPage,
});

function DashboardPage() {
    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Mind & Body', href: '/dashboard' }, { label: 'Dashboard' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Dashboard"
                    description="Bienvenido al panel de administración de Mind & Body"
                    className="mb-6"
                />

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
                    {mockKPIs.map((kpi) => (
                        <KPICard
                            key={kpi.label}
                            label={kpi.label}
                            value={kpi.value}
                            change={kpi.change}
                            changeLabel={kpi.changeLabel}
                            icon={kpi.icon}
                        />
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-3 mb-6">
                    <RevenueChart />
                    <ClassPopularityChart />
                    <MembershipDistributionChart />
                </div>

                {/* Actividad reciente */}
                <div className="grid gap-6">
                    <ActivityFeed />
                </div>
            </div>
        </>
    );
}
