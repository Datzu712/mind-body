'use client';

import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { AttendanceTable } from '@/src/features/dashboard/training/components/attendance-table';
import { useAttendanceStorage } from '@/src/features/dashboard/training/lib/use-attendance-storage';

export default function AttendancePage() {
    const { classes, attendance, hydrated, markAttendance } = useAttendanceStorage();

    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Mind & Body', href: '/dashboard' },
                    { label: 'Entrenamientos', href: '/dashboard/training' },
                    { label: 'Asistencia' },
                ]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Asistencia a clases grupales"
                    description="Registra la asistencia de los miembros a las clases del día."
                    className="mb-6"
                />

                <AttendanceTable
                    classes={classes}
                    attendance={attendance}
                    hydrated={hydrated}
                    onMarkAttendance={markAttendance}
                />
            </div>
        </>
    );
}
