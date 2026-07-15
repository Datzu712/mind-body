import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ClipboardList, ListChecks } from 'lucide-react';
import { AllReservationsTab } from '@/src/features/dashboard/reservations/components/AllReservationsTab';
import { ClassManagementTab } from '@/src/features/dashboard/reservations/components/ClassManagementTab';
import { WeekCalendarTab } from '@/src/features/dashboard/reservations/components/WeekCalendarTab';
import { useReservationsMock } from '@/src/features/dashboard/reservations/use-reservations-mock';

export const Route = createFileRoute('/dashboard/reservations')({
    component: ReservationsPage,
});

function ReservationsPage() {
    const [activeTab, setActiveTab] = useState('calendar');
    const store = useReservationsMock();

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Reservas' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Reservas"
                    description="Consulta y gestiona reservas, sesiones, cupos y listas de espera."
                    className="mb-6"
                />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
                    <TabsList className="bg-secondary/50 border border-border">
                        <TabsTrigger value="calendar">
                            <CalendarDays className="h-4 w-4" />
                            Calendario
                        </TabsTrigger>
                        <TabsTrigger value="all">
                            <ListChecks className="h-4 w-4" />
                            Todas las reservas
                        </TabsTrigger>
                        <TabsTrigger value="classes">
                            <ClipboardList className="h-4 w-4" />
                            Clases y cupos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="calendar">
                        <WeekCalendarTab store={store} />
                    </TabsContent>
                    <TabsContent value="all">
                        <AllReservationsTab store={store} />
                    </TabsContent>
                    <TabsContent value="classes">
                        <ClassManagementTab />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
