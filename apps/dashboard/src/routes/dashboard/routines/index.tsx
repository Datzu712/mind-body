import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { sileo } from 'sileo';

import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { RoutinesTable } from '@/src/features/dashboard/routines/components/routines-table';
import { AssignRoutineDialog } from '@/src/features/dashboard/routines/components/assign-routine-dialog';
import {
    useCreateRoutine,
    useDeleteRoutine,
    useRoutines,
    useUpdateRoutine,
} from '@/src/features/dashboard/routines/hooks';
import type { RoutineSummary, RoutinesFilters } from '@/src/features/dashboard/routines/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ClipboardList, Loader2, Plus, Search } from 'lucide-react';

export const Route = createFileRoute('/dashboard/routines/')({
    component: RoutinesPage,
});

/** El archivar cambia status; se maneja en una fila aparte para poder usar
 *  useUpdateRoutine (que necesita el id fijo) sin hooks condicionales. */
function ArchiveRunner({ routine, onDone }: { routine: RoutineSummary; onDone: () => void }) {
    const update = useUpdateRoutine(routine.id);
    return (
        <ConfirmDialog
            open
            onOpenChange={(open) => !open && onDone()}
            title="Archivar rutina"
            description={`"${routine.name}" dejará de estar disponible para asignaciones nuevas.`}
            confirmLabel="Archivar"
            onConfirm={() => {
                update
                    .mutateAsync({ status: 'ARCHIVED' })
                    .then(() => sileo.success({ title: 'Rutina archivada' }))
                    .catch((e: Error) => sileo.error({ title: 'No se pudo archivar', description: e.message }))
                    .finally(onDone);
            }}
        />
    );
}

function RoutinesPage() {
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<'ALL' | NonNullable<RoutinesFilters['status']>>('ALL');
    const filters: RoutinesFilters = {
        ...(q && { q }),
        ...(status !== 'ALL' && { status }),
    };
    const { data: routines, isLoading } = useRoutines(filters);
    const createRoutine = useCreateRoutine();
    const deleteRoutine = useDeleteRoutine();

    const [toAssign, setToAssign] = useState<RoutineSummary | null>(null);
    const [toArchive, setToArchive] = useState<RoutineSummary | null>(null);
    const [toDelete, setToDelete] = useState<RoutineSummary | null>(null);

    const openBuilder = (id: string) => {
        void navigate({ to: '/dashboard/routines/$routineId', params: { routineId: id } });
    };

    const handleCreate = () => {
        createRoutine
            .mutateAsync({})
            .then((created) => openBuilder(created.id))
            .catch((e: Error) => sileo.error({ title: 'No se pudo crear la rutina', description: e.message }));
    };

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Rutinas' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Rutinas"
                    description="Creá y gestioná las rutinas de entrenamiento del gimnasio."
                    className="mb-6"
                />

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas</SelectItem>
                            <SelectItem value="DRAFT">Borradores</SelectItem>
                            <SelectItem value="ACTIVE">Activas</SelectItem>
                            <SelectItem value="ARCHIVED">Archivadas</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="ml-auto" onClick={handleCreate} disabled={createRoutine.isPending}>
                        {createRoutine.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Nueva rutina
                    </Button>
                </div>

                <Card className="border-border bg-card">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando rutinas...
                            </div>
                        ) : !routines?.length ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <ClipboardList />
                                    </EmptyMedia>
                                    <EmptyTitle>Sin rutinas</EmptyTitle>
                                    <EmptyDescription>
                                        {q || status !== 'ALL'
                                            ? 'Ninguna rutina coincide con los filtros.'
                                            : 'Creá la primera rutina con "Nueva rutina".'}
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <RoutinesTable
                                routines={routines}
                                onOpen={openBuilder}
                                onAssign={setToAssign}
                                onArchive={setToArchive}
                                onDelete={setToDelete}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {toAssign && (
                <AssignRoutineDialog
                    routineId={toAssign.id}
                    routineName={toAssign.name}
                    open
                    onOpenChange={(open) => !open && setToAssign(null)}
                />
            )}
            {toArchive && <ArchiveRunner routine={toArchive} onDone={() => setToArchive(null)} />}
            {toDelete && (
                <ConfirmDialog
                    open
                    onOpenChange={(open) => !open && setToDelete(null)}
                    title="Eliminar rutina"
                    description={`Se eliminará "${toDelete.name}". Esta acción no se puede deshacer desde la app.`}
                    confirmLabel="Eliminar"
                    variant="destructive"
                    onConfirm={() => {
                        deleteRoutine
                            .mutateAsync(toDelete.id)
                            .then(() => sileo.success({ title: 'Rutina eliminada' }))
                            .catch((e: Error) => sileo.error({ title: 'No se pudo eliminar', description: e.message }))
                            .finally(() => setToDelete(null));
                    }}
                />
            )}
        </>
    );
}
