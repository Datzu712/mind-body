'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import type { ClassAttendance, GroupClass } from '@/src/features/dashboard/training/lib/training-types';

interface AttendanceTableProps {
    classes: GroupClass[];
    attendance: ClassAttendance[];
    onMarkAttendance: (id: string, attended: boolean) => void;
    hydrated: boolean;
}

export function AttendanceTable({ classes, attendance, onMarkAttendance, hydrated }: AttendanceTableProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

    const selectedClass = useMemo(
        () => classes.find((c) => c.id === selectedClassId) || classes[0],
        [classes, selectedClassId],
    );

    const classAttendance = useMemo(
        () => (selectedClass ? attendance.filter((a) => a.classId === selectedClass.id) : []),
        [attendance, selectedClass],
    );

    const stats = useMemo(() => {
        const total = classAttendance.length;
        const present = classAttendance.filter((a) => a.attended).length;
        const absent = classAttendance.filter((a) => a.attended === false && a.registeredAt).length;
        const pending = total - present - absent;
        return { total, present, absent, pending };
    }, [classAttendance]);

    if (!hydrated) {
        return <p className="text-sm text-muted-foreground">Cargando...</p>;
    }

    return (
        <div className="space-y-6">
            {/* Class tabs */}
            <div className="flex flex-wrap gap-2">
                {classes.map((cls) => {
                    const isActive = selectedClass?.id === cls.id;
                    const count = attendance.filter((a) => a.classId === cls.id).length;
                    return (
                        <button
                            key={cls.id}
                            type="button"
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-card text-foreground hover:bg-accent'
                            }`}
                        >
                            <Clock className="h-4 w-4" />
                            <span>{cls.name}</span>
                            <span className="text-xs text-muted-foreground">{cls.time}</span>
                            <Badge variant="secondary" className="ml-1">
                                {count}
                            </Badge>
                        </button>
                    );
                })}
            </div>

            {selectedClass && (
                <>
                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Reservas</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Asistentes</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">{stats.present}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-red-500">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Ausentes</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">{stats.absent}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-yellow-500">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Pendientes</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">{stats.pending}</p>
                        </div>
                    </div>

                    {/* Member list */}
                    <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Miembro</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Estado</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {classAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                            No hay reservas para esta clase.
                                        </td>
                                    </tr>
                                ) : (
                                    classAttendance.map((a) => (
                                        <tr key={a.id} className="border-t border-border">
                                            <td className="px-4 py-3 font-medium">{a.memberName}</td>
                                            <td className="px-4 py-3">
                                                {!a.registeredAt ? (
                                                    <Badge variant="secondary">Pendiente</Badge>
                                                ) : a.attended ? (
                                                    <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20">
                                                        Presente
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">Ausente</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={a.attended ? 'default' : 'outline'}
                                                        onClick={() => onMarkAttendance(a.id, true)}
                                                        className="h-8"
                                                    >
                                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                                        Presente
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={
                                                            a.attended === false && a.registeredAt
                                                                ? 'destructive'
                                                                : 'outline'
                                                        }
                                                        onClick={() => onMarkAttendance(a.id, false)}
                                                        className="h-8"
                                                    >
                                                        <XCircle className="mr-1 h-4 w-4" />
                                                        Ausente
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
