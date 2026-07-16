import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, Power, Trash2 } from 'lucide-react';
import { sileo } from 'sileo';

import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { useCreateClass, useDeleteClass, useGymClasses, useSetClassStatus, useUpdateClass } from '../hooks';
import type { ClassFormData, ClassStatus, GymClass } from '../types';
import { formatScheduleLabel } from '../utils';
import { ClassStatusBadge } from './ClassStatusBadge';
import { ClassFormDialog } from './ClassFormDialog';

export function ClassManagementTab() {
    const { data: classes = [] } = useGymClasses();
    const createClass = useCreateClass();
    const updateClass = useUpdateClass();
    const setClassStatus = useSetClassStatus();
    const deleteClass = useDeleteClass();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ClassStatus>('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<GymClass | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; item: GymClass | null }>({
        open: false,
        item: null,
    });

    const filteredClasses = useMemo(
        () =>
            classes.filter((cls) => {
                const matchesSearch =
                    cls.name.toLowerCase().includes(search.toLowerCase()) ||
                    cls.trainerName.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        [classes, search, statusFilter],
    );

    const handleCreate = async (data: ClassFormData) => {
        try {
            await createClass.mutateAsync(data);
            sileo.success({ title: `Clase "${data.name}" creada` });
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'No se pudo crear la clase' };
        }
    };

    const handleEdit = async (data: ClassFormData) => {
        if (!editingClass) return { success: false, error: 'No hay clase seleccionada' };
        try {
            const result = await updateClass.mutateAsync({
                id: editingClass.id,
                dto: data,
                version: editingClass.version,
            });
            // El backend separa la transición de estado del update de datos.
            if (data.status !== editingClass.status) {
                await setClassStatus.mutateAsync({
                    id: editingClass.id,
                    status: data.status,
                    version: result.classSeries.version,
                });
            }
            setEditingClass(null);
            sileo.success({ title: `Clase "${data.name}" actualizada` });
            if (result.affectedReservations > 0) {
                sileo.warning({
                    title: `${result.affectedReservations} reservas canceladas por el cambio de horario`,
                });
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'No se pudo actualizar' };
        }
    };

    const handleToggleStatus = (cls: GymClass) => {
        const next: ClassStatus = cls.status === 'inactive' ? 'active' : 'inactive';
        void setClassStatus
            .mutateAsync({ id: cls.id, status: next, version: cls.version })
            .then((result) => {
                sileo.success({ title: next === 'inactive' ? `"${cls.name}" desactivada` : `"${cls.name}" activada` });
                if (result.affectedReservations > 0) {
                    sileo.warning({ title: `${result.affectedReservations} reservas activas fueron canceladas` });
                }
            })
            .catch((error: unknown) => {
                sileo.error({ title: error instanceof Error ? error.message : 'No se pudo cambiar el estado' });
            });
    };

    const handleDelete = () => {
        const cls = confirmDialog.item;
        if (!cls) return;
        void deleteClass
            .mutateAsync({ id: cls.id, version: cls.version })
            .then((result) => {
                sileo.success({ title: `Clase "${cls.name}" eliminada` });
                if (result.affectedReservations > 0) {
                    sileo.warning({ title: `${result.affectedReservations} reservas activas fueron canceladas` });
                }
            })
            .catch((error: unknown) => {
                sileo.error({ title: error instanceof Error ? error.message : 'No se pudo eliminar la clase' });
            });
        setConfirmDialog({ open: false, item: null });
    };

    const openEditForm = (cls: GymClass) => {
        setEditingClass(cls);
        setFormOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingClass(null);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Toolbar: búsqueda + filtro de estado + nueva clase */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar clases o entrenadores..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-secondary/50 border-border"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as 'all' | ClassStatus)}
                    >
                        <SelectTrigger className="w-full bg-secondary/50 border-border sm:w-48">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="inactive">Inactiva</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva clase
                </Button>
            </div>

            {/* Tabla de series */}
            <Card className="border-border bg-card">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="text-muted-foreground font-semibold">Clase</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Entrenador</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Horario</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Capacidad</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClasses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No se encontraron clases con los filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClasses.map((cls) => (
                                        <TableRow key={cls.id} className="border-border">
                                            <TableCell className="font-medium text-foreground">{cls.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{cls.trainerName}</TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {formatScheduleLabel(cls)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="font-medium text-foreground">{cls.capacity}</span>
                                                {cls.allowWaitlist && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        + lista de espera
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <ClassStatusBadge status={cls.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            aria-label={`Acciones para ${cls.name}`}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-auto min-w-44 whitespace-nowrap bg-popover border-border"
                                                    >
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => openEditForm(cls)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleToggleStatus(cls)}
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {cls.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-border" />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                            onClick={() => setConfirmDialog({ open: true, item: cls })}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
                Mostrando {filteredClasses.length} de {classes.length} clases
            </p>

            {/* Formulario crear / editar */}
            <ClassFormDialog
                open={formOpen}
                onOpenChange={handleFormClose}
                item={editingClass}
                onSubmit={editingClass ? handleEdit : handleCreate}
            />

            {/* Confirmación de borrado */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                title="Eliminar clase"
                description={`¿Eliminar "${confirmDialog.item?.name ?? ''}"? Sus sesiones futuras se borrarán y las reservas activas se cancelarán. Los miembros serán notificados. Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
}
