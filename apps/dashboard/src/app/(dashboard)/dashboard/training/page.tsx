import Link from 'next/link';
import { Dumbbell, List, ClipboardCheck } from 'lucide-react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const modules = [
    {
        title: 'Rutinas',
        description: 'Crea, edita y asigna rutinas de entrenamiento a los miembros.',
        href: '/dashboard/training/routines',
        icon: Dumbbell,
    },
    {
        title: 'Ejercicios',
        description: 'Catálogo de ejercicios disponibles para las rutinas.',
        href: '/dashboard/training/exercises',
        icon: List,
    },
    {
        title: 'Asistencia',
        description: 'Registra la asistencia de miembros a clases grupales.',
        href: '/dashboard/training/attendance',
        icon: ClipboardCheck,
    },
];

export default function TrainingIndexPage() {
    return (
        <>
            <DashboardHeader
                breadcrumbs={[{ label: 'Mind & Body', href: '/dashboard' }, { label: 'Entrenamientos' }]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Entrenamientos"
                    description="Gestiona rutinas, ejercicios y asistencia a clases grupales"
                    className="mb-6"
                />

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {modules.map((module) => (
                        <Link key={module.href} href={module.href} className="group">
                            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <module.icon className="h-5 w-5" />
                                        </div>
                                        <CardTitle>{module.title}</CardTitle>
                                    </div>
                                    <CardDescription className="pt-2">{module.description}</CardDescription>
                                </CardHeader>
                                <CardContent />
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
