import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { TrainerAgendaTab } from '@/src/features/dashboard/classes/components/TrainerAgendaTab';
import { ClassManagementTab } from '@/src/features/dashboard/classes/components/ClassManagementTab';

export const Route = createFileRoute('/dashboard/classes')({
    component: ClassesPage,
});

function ClassesPage() {
    const [activeTab, setActiveTab] = useState('agenda');

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Agenda y clases' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Agenda y clases"
                    description="Gestiona reservas, sesiones, cupos y disponibilidad de clases."
                    className="mb-6"
                />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
                    <TabsList className="bg-secondary/50 border border-border">
                        <TabsTrigger value="agenda">
                            <CalendarDays className="h-4 w-4" />
                            Agenda del entrenador
                        </TabsTrigger>
                        <TabsTrigger value="management">
                            <ClipboardList className="h-4 w-4" />
                            Gestión de clases y cupos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="agenda">
                        <TrainerAgendaTab />
                    </TabsContent>
                    <TabsContent value="management">
                        <ClassManagementTab />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
