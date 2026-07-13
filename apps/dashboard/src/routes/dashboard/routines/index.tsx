import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { RoutinesTable } from '@/src/features/dashboard/routines/components/routines-table';
import { RoutineForm } from '@/src/features/dashboard/routines/components/routine-form';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { sileo } from 'sileo';
import type { Routine, RoutineFormData } from '@/src/features/dashboard/routines/types';
import {
    useRoutines,
    useCreateRoutine,
    useUpdateRoutine,
    useDeleteRoutine,
} from '@/src/features/dashboard/routines/hooks';

export const Route = createFileRoute('/dashboard/routines/')({
    component: RoutinesPage,
});

function RoutinesPage() {
    const { data: routines, isLoading } = useRoutines();
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
    const [deleteRoutine, setDeleteRoutine] = useState<Routine | null>(null);

    const createRoutine = useCreateRoutine();
    const updateRoutine = useUpdateRoutine(editingRoutine?.id ?? '');
    const deleteMutation = useDeleteRoutine(deleteRoutine?.id ?? '');

    const filteredRoutines = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return routines ?? [];
        return (routines ?? []).filter(
            (r) => r.name.toLowerCase().includes(term) || (r.objective ?? '').toLowerCase().includes(term),
        );
    }, [routines, search]);

    const handleOpenCreate = () => {
        setEditingRoutine(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setFormOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingRoutine(null);
    };

    const handleSubmit = (data: RoutineFormData) => {
        if (editingRoutine) {
            updateRoutine.mutate(data, {
                onSuccess: () => {
                    sileo.success({ title: 'Rutina actualizada' });
                    handleFormClose(false);
                },
                onError: (err) => {
                    sileo.error({ title: 'Error al actualizar', description: err.message });
                },
            });
        } else {
            createRoutine.mutate(data, {
                onSuccess: () => {
                    sileo.success({ title: 'Rutina creada' });
                    handleFormClose(false);
                },
                onError: (err) => {
                    sileo.error({ title: 'Error al crear', description: err.message });
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteRoutine) return;
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                sileo.success({ title: 'Rutina eliminada' });
                setDeleteRoutine(null);
            },
            onError: (err) => {
                sileo.error({ title: 'Error al eliminar', description: err.message });
            },
        });
    };

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Mind & Body', href: '/dashboard' }, { label: 'Rutinas' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Rutinas"
                    description="Creá y gestioná las rutinas de entrenamiento de tus miembros"
                    actions={
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear
                        </Button>
                    }
                    className="mb-6"
                />

                <div className="relative mb-6 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar rutinas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-secondary/50 border-border"
                    />
                </div>

                {isLoading ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                        Cargando rutinas...
                    </div>
                ) : (
                    <RoutinesTable routines={filteredRoutines} onEdit={handleOpenEdit} onDelete={setDeleteRoutine} />
                )}

                <RoutineForm
                    open={formOpen}
                    onOpenChange={handleFormClose}
                    routine={editingRoutine}
                    onSubmit={handleSubmit}
                    isPending={createRoutine.isPending || updateRoutine.isPending}
                />

                <ConfirmDialog
                    open={!!deleteRoutine}
                    onOpenChange={(open) => !open && setDeleteRoutine(null)}
                    title="Eliminar rutina"
                    description={`¿Estás seguro de eliminar "${deleteRoutine?.name}"? Esta acción no se puede deshacer.`}
                    confirmLabel="Eliminar"
                    onConfirm={handleConfirmDelete}
                    variant="destructive"
                />
            </div>
        </>
    );
}
