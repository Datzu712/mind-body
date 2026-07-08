import { useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { ClassFormDialog } from './ClassFormDialog';
import { ClassesToolbar } from './ClassesToolbar';
import { ClassesTable } from './ClassesTable';
import { mockManagedClasses, type ManagedClass } from '../mock-classes';
import { useClassManagement } from '../hooks/useClassManagement';

const route = getRouteApi('/dashboard/classes');

export function ClassManagementTab() {
    const { search, status } = route.useSearch();
    const navigate = route.useNavigate();

    const {
        classes,
        filteredClasses,
        handleCreate,
        handleEdit,
        handleToggleStatus,
        handleDelete,
    } = useClassManagement(mockManagedClasses, search, status);

    const [formOpen, setFormOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ManagedClass | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; item: ManagedClass | null }>({
        open: false,
        item: null,
    });

    const handleSearchChange = (value: string) => {
        navigate({ search: (prev) => ({ ...prev, search: value }), replace: true });
    };

    const handleStatusChange = (value: any) => {
        navigate({ search: (prev) => ({ ...prev, status: value }), replace: true });
    };

    const openEditForm = (cls: ManagedClass) => {
        setEditingClass(cls);
        setFormOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingClass(null);
    };

    const onConfirmDelete = () => {
        handleDelete(confirmDialog.item);
        setConfirmDialog({ open: false, item: null });
    };

    return (
        <div className="flex flex-col gap-6">
            <ClassesToolbar
                search={search}
                onSearchChange={handleSearchChange}
                statusFilter={status}
                onStatusChange={handleStatusChange}
                onCreateClick={() => setFormOpen(true)}
            />

            <ClassesTable
                classes={filteredClasses}
                onEdit={openEditForm}
                onToggleStatus={handleToggleStatus}
                onDelete={(cls) => setConfirmDialog({ open: true, item: cls })}
            />

            <p className="text-sm text-muted-foreground">
                Mostrando {filteredClasses.length} de {classes.length} clases
            </p>

            <ClassFormDialog
                open={formOpen}
                onOpenChange={handleFormClose}
                item={editingClass}
                onSubmit={(data) => (editingClass ? handleEdit(editingClass, data) : handleCreate(data))}
            />

            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                title="Eliminar clase"
                description={
                    confirmDialog.item && confirmDialog.item.activeReservations > 0
                        ? `¿Estás seguro de eliminar "${confirmDialog.item.name}"? Las ${confirmDialog.item.activeReservations} reservas activas se cancelarán y los miembros recibirán una notificación por los canales configurados.`
                        : `¿Estás seguro de eliminar "${confirmDialog.item?.name ?? ''}"? Esta acción no se puede deshacer.`
                }
                confirmLabel="Eliminar"
                onConfirm={onConfirmDelete}
                variant="destructive"
            />
        </div>
    );
}
