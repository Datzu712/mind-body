import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';
import { sileo } from 'sileo';

import { AgendaMetricCard } from './AgendaMetricCard';
import { AgendaEmptyState } from './AgendaEmptyState';
import { ClassStatusBadge } from './ClassStatusBadge';
import { agendaMetrics, mockTrainerSessions, AGENDA_TODAY_LABEL } from '../mock-classes';

export function TrainerAgendaTab() {
    // Mock date filter: offset 0 = today (has sessions); other days are empty.
    const [dayOffset, setDayOffset] = useState(0);
    const sessions = dayOffset === 0 ? mockTrainerSessions : [];

    const dayLabel =
        dayOffset === 0
            ? AGENDA_TODAY_LABEL
            : `${dayOffset > 0 ? 'En' : 'Hace'} ${Math.abs(dayOffset)} día${Math.abs(dayOffset) > 1 ? 's' : ''}`;

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
        </div>
    );
}
