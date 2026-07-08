import { useState, useMemo } from 'react';
import { sileo } from 'sileo';
import type { ClassFormData } from '../components/ClassFormDialog';
import { type ClassStatus, type ManagedClass } from '../mock-classes';

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

export function useClassManagement(initialClasses: ManagedClass[], search: string, statusFilter: 'all' | ClassStatus) {
    const [classes, setClasses] = useState<ManagedClass[]>(initialClasses);

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

    const handleEdit = (editingClass: ManagedClass | null, data: ClassFormData) => {
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

    const handleDelete = (cls: ManagedClass | null) => {
        if (!cls) return;
        if (cls.activeReservations > 0) {
            sileo.warning({ title: 'Esta clase tiene reservas activas. Los miembros serán notificados.' });
        }
        setClasses((prev) => prev.filter((c) => c.id !== cls.id));
        sileo.success({ title: `Clase "${cls.name}" eliminada` });
    };

    return {
        classes,
        filteredClasses,
        handleCreate,
        handleEdit,
        handleToggleStatus,
        handleDelete,
    };
}
