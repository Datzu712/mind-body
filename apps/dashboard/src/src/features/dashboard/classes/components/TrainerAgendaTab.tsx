import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    CalendarCheck,
    CalendarClock,
    CalendarX,
    MoreHorizontal,
    Eye,
    RotateCcw,
    XCircle,
    ClipboardCheck,
} from 'lucide-react';
import { sileo } from 'sileo';

import { AgendaMetricCard } from './AgendaMetricCard';
import { AgendaEmptyState } from './AgendaEmptyState';
import { ClassStatusBadge } from './ClassStatusBadge';
import { agendaMetrics, mockTrainerSessions, AGENDA_TODAY_LABEL } from '../mock-classes';

type AttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT';

interface AttendanceEntry {
    id: string;
    member: string;
    status: AttendanceStatus;
    reserved: boolean;
    markedAt?: string;
}

function buildRoster(className: string): AttendanceEntry[] {
    return mockTrainerSessions
        .filter((session) => session.className === className && session.status !== 'cancelada')
        .map((session) => ({
            id: session.id,
            member: session.member,
            status: 'PENDING',
            reserved: true,
        }));
}

export function TrainerAgendaTab() {
    // Mock date filter: offset 0 = today (has sessions); other days are empty.
    const [dayOffset, setDayOffset] = useState(0);
    const [attendanceClass, setAttendanceClass] = useState<string | null>(null);
    const [attendanceRows, setAttendanceRows] = useState<AttendanceEntry[]>([]);
    const [manualMember, setManualMember] = useState('');
    const [finalized, setFinalized] = useState(false);
    const sessions = dayOffset === 0 ? mockTrainerSessions : [];

    const dayLabel =
        dayOffset === 0
            ? AGENDA_TODAY_LABEL
            : `${dayOffset > 0 ? 'En' : 'Hace'} ${Math.abs(dayOffset)} día${Math.abs(dayOffset) > 1 ? 's' : ''}`;

    const openAttendance = (className: string) => {
        setAttendanceClass(className);
        setAttendanceRows(buildRoster(className));
        setManualMember('');
        setFinalized(false);
    };

    const markAttendance = (id: string, status: AttendanceStatus) => {
        setAttendanceRows((rows) =>
            rows.map((row) => (row.id === id ? { ...row, status, markedAt: new Date().toLocaleTimeString() } : row)),
        );
    };

    const addManualMember = () => {
        const name = manualMember.trim();
        if (!name) return;
        if (attendanceRows.some((row) => row.member.toLowerCase() === name.toLowerCase())) {
            sileo.error({ title: 'El miembro ya esta en la lista' });
            return;
        }
        if (!window.confirm('El miembro no tiene reserva. Deseas registrarlo manualmente como presente?')) return;
        setAttendanceRows((rows) => [
            ...rows,
            {
                id: `manual-${Date.now()}`,
                member: name,
                status: 'PRESENT',
                reserved: false,
                markedAt: new Date().toLocaleTimeString(),
            },
        ]);
        setManualMember('');
    };

    const pendingCount = attendanceRows.filter((row) => row.status === 'PENDING').length;
    const presentRows = attendanceRows.filter((row) => row.status === 'PRESENT');
    const absentRows = attendanceRows.filter((row) => row.status === 'ABSENT');

    return (
        <div className="flex flex-col gap-6">
            {/* Date filter + filters button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDayOffset((d) => d - 1)}
                        aria-label="Día anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-40 text-center text-sm font-medium text-foreground">{dayLabel}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDayOffset((d) => d + 1)}
                        aria-label="Día siguiente"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="outline" className="border-border">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filtros
                </Button>
            </div>

            {/* Metric cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <AgendaMetricCard
                    label="Reservas hoy"
                    value={agendaMetrics.reservasHoy}
                    icon={CalendarCheck}
                    tone="success"
                    caption="Confirmadas"
                />
                <AgendaMetricCard
                    label="Próximas sesiones"
                    value={agendaMetrics.proximasSesiones}
                    icon={CalendarClock}
                    tone="primary"
                    caption="En las próximas 2 h"
                />
                <AgendaMetricCard
                    label="Canceladas hoy"
                    value={agendaMetrics.canceladasHoy}
                    icon={CalendarX}
                    tone="destructive"
                    caption="Canceladas"
                />
            </div>

            {/* Sessions table or empty state */}
            {sessions.length === 0 ? (
                <AgendaEmptyState />
            ) : (
                <Card className="border-border bg-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="text-muted-foreground font-semibold">Hora</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Clase</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Miembro</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow key={session.id} className="border-border">
                                            <TableCell className="font-medium text-foreground whitespace-nowrap">
                                                {session.time}
                                            </TableCell>
                                            <TableCell className="text-foreground">{session.className}</TableCell>
                                            <TableCell className="text-muted-foreground">{session.member}</TableCell>
                                            <TableCell>
                                                <ClassStatusBadge status={session.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            aria-label={`Acciones para ${session.className}`}
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
                                                            onClick={() => openAttendance(session.className)}
                                                            disabled={session.status === 'cancelada'}
                                                        >
                                                            <ClipboardCheck className="mr-2 h-4 w-4" />
                                                            Tomar asistencia
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                sileo.success({
                                                                    title: `Detalle de ${session.className} · ${session.member}`,
                                                                })
                                                            }
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver detalle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                sileo.success({
                                                                    title: `Reprogramación iniciada para ${session.className}`,
                                                                })
                                                            }
                                                        >
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Reprogramar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-border" />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                            onClick={() =>
                                                                sileo.warning({
                                                                    title: `Sesión de ${session.member} cancelada`,
                                                                })
                                                            }
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancelar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <p className="text-sm text-muted-foreground">
                Mostrando {sessions.length} de {mockTrainerSessions.length} sesiones
            </p>

            <Dialog open={!!attendanceClass} onOpenChange={(open) => !open && setAttendanceClass(null)}>
                <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Asistencia de {attendanceClass}</DialogTitle>
                        <DialogDescription>
                            Mock de frontend: marca presentes/ausentes, registra sin reserva y finaliza con reporte
                            visual.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-border bg-secondary/20">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Presentes</p>
                                <p className="text-2xl font-semibold text-foreground">{presentRows.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-secondary/20">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Ausentes</p>
                                <p className="text-2xl font-semibold text-foreground">{absentRows.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-secondary/20">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Pendientes</p>
                                <p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {!finalized ? (
                        <>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    value={manualMember}
                                    onChange={(event) => setManualMember(event.target.value)}
                                    placeholder="Miembro sin reserva"
                                    className="bg-secondary/50 border-border"
                                />
                                <Button type="button" variant="outline" onClick={addManualMember}>
                                    Registro manual
                                </Button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead>Miembro</TableHead>
                                            <TableHead>Reserva</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceRows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="font-medium text-foreground">
                                                    {row.member}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={row.reserved ? 'outline' : 'secondary'}>
                                                        {row.reserved ? 'Con reserva' : 'Sin reserva'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {row.status === 'PENDING'
                                                        ? 'Pendiente'
                                                        : row.status === 'PRESENT'
                                                          ? 'Presente'
                                                          : 'Ausente'}
                                                </TableCell>
                                                <TableCell className="space-x-2 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => markAttendance(row.id, 'PRESENT')}
                                                    >
                                                        Presente
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => markAttendance(row.id, 'ABSENT')}
                                                    >
                                                        Ausente
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-border p-4">
                                <h3 className="mb-2 font-semibold text-foreground">Asistentes</h3>
                                {presentRows.map((row) => (
                                    <p key={row.id} className="text-sm text-muted-foreground">
                                        {row.member} {row.reserved ? '' : '(sin reserva)'}
                                    </p>
                                ))}
                            </div>
                            <div className="rounded-lg border border-border p-4">
                                <h3 className="mb-2 font-semibold text-foreground">Ausentes</h3>
                                {absentRows.map((row) => (
                                    <p key={row.id} className="text-sm text-muted-foreground">
                                        {row.member}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAttendanceClass(null)}>
                            Cerrar
                        </Button>
                        {!finalized && (
                            <Button type="button" disabled={pendingCount > 0} onClick={() => setFinalized(true)}>
                                Finalizar asistencia
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
