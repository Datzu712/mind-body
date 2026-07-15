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
import { ClassStatusBadge } from './ClassStatusBadge';
import { ClassFormDialog, type ClassFormData } from './ClassFormDialog';
import { mockManagedClasses, type ClassStatus, type ManagedClass } from '../mock-classes';

/** Derive the visible status from capacity/waitlist, respecting a manual "inactive". */
function deriveStatus(
    chosen: 'active' | 'inactive',
    booked: number,
    capacity: number,
    allowWaitlist: boolean,
    waitlistCount: number,
): ClassStatus {
    if (chosen === 'inactive') return 'inactive';
    if (booked >= capacity) return allowWaitlist && waitlistCount > 0 ? 'waitlist' : 'full';
    return 'active';
}

export function ClassManagementTab() {
    const [classes, setClasses] = useState<ManagedClass[]>(mockManagedClasses);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ClassStatus>('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ManagedClass | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; item: ManagedClass | null }>({
        open: false,
        item: null,
    });

    const filteredClasses = useMemo(
        () =>
            classes.filter((cls) => {
                const matchesSearch =
                    cls.name.toLowerCase().includes(search.toLowerCase()) ||
                    cls.trainer.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        [classes, search, statusFilter],
    );

    const handleCreate = (data: ClassFormData) => {
        const newClass: ManagedClass = {
            id: `cls-${Date.now()}`,
            name: data.name,
            description: data.description,
            trainer: data.trainer,
            day: data.day,
            time: data.time,
            durationMin: data.durationMin,
            capacity: data.capacity,
            booked: 0,
            waitlistCount: 0,
            allowWaitlist: data.allowWaitlist,
            status: deriveStatus(data.status, 0, data.capacity, data.allowWaitlist, 0),
            activeReservations: 0,
        };
        setClasses((prev) => [...prev, newClass]);
        sileo.success({ title: `Clase "${newClass.name}" creada` });
        return Promise.resolve({ success: true });
    };

    const handleEdit = (data: ClassFormData) => {
        if (!editingClass) return Promise.resolve({ success: false, error: 'No hay clase seleccionada' });
        setClasses((prev) =>
            prev.map((cls) =>
                cls.id === editingClass.id
                    ? {
                          ...cls,
                          name: data.name,
                          description: data.description,
                          trainer: data.trainer,
                          day: data.day,
                          time: data.time,
                          durationMin: data.durationMin,
                          capacity: data.capacity,
                          allowWaitlist: data.allowWaitlist,
                          status: deriveStatus(
                              data.status,
                              cls.booked,
                              data.capacity,
                              data.allowWaitlist,
                              cls.waitlistCount,
                          ),
                      }
                    : cls,
            ),
        );
        setEditingClass(null);
        sileo.success({ title: `Clase "${data.name}" actualizada` });
        return Promise.resolve({ success: true });
    };

    const handleToggleStatus = (cls: ManagedClass) => {
        const goingInactive = cls.status !== 'inactive';
        if (goingInactive && cls.activeReservations > 0) {
            sileo.warning({ title: 'Esta clase tiene reservas activas. Los miembros serán notificados.' });
        }
        setClasses((prev) =>
            prev.map((c) =>
                c.id === cls.id
                    ? {
                          ...c,
                          status: goingInactive
                              ? 'inactive'
                              : deriveStatus('active', c.booked, c.capacity, c.allowWaitlist, c.waitlistCount),
                      }
                    : c,
            ),
        );
        sileo.success({ title: goingInactive ? `"${cls.name}" desactivada` : `"${cls.name}" activada` });
    };

    const handleDelete = () => {
        const cls = confirmDialog.item;
        if (!cls) return;
        if (cls.activeReservations > 0) {
            sileo.warning({ title: 'Esta clase tiene reservas activas. Los miembros serán notificados.' });
        }
        setClasses((prev) => prev.filter((c) => c.id !== cls.id));
        sileo.success({ title: `Clase "${cls.name}" eliminada` });
        setConfirmDialog({ open: false, item: null });
    };

    const openEditForm = (cls: ManagedClass) => {
        setEditingClass(cls);
        setFormOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingClass(null);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Toolbar: search + status filter + new class */}
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
                        <SelectTrigger className="bg-secondary/50 border-border sm:w-48">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="inactive">Inactiva</SelectItem>
                            <SelectItem value="full">Cupo lleno</SelectItem>
                            <SelectItem value="waitlist">Lista de espera</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva clase
                </Button>
            </div>

            {/* Classes table */}
            <Card className="border-border bg-card">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="text-muted-foreground font-semibold">Clase</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Entrenador</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Día y hora</TableHead>
                                    <TableHead className="text-muted-foreground font-semibold">Cupos</TableHead>
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
                                            <TableCell className="text-muted-foreground">{cls.trainer}</TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {cls.day} {cls.time}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="font-medium text-foreground">
                                                    {cls.booked} / {cls.capacity}
                                                </span>
                                                {cls.waitlistCount > 0 && (
                                                    <span className="ml-2 text-xs text-warning">
                                                        +{cls.waitlistCount} en espera
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
                                                        className="bg-popover border-border"
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

            {/* Create / edit form */}
            <ClassFormDialog
                open={formOpen}
                onOpenChange={handleFormClose}
                item={editingClass}
                onSubmit={editingClass ? handleEdit : handleCreate}
            />

            {/* Delete confirmation */}
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
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
}
