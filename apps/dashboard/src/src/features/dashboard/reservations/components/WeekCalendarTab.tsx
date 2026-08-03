import { Fragment, useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, isManagementRole } from '@/hooks/use-auth';

import { useGymClasses, useTrainers, useWeekSessions } from '../hooks';
import { formatTime12h, formatWeekLabel, weekStartForOffset } from '../utils';
import { SessionCard } from './SessionCard';
import { SessionDetailSheet } from './SessionDetailSheet';

export function WeekCalendarTab() {
    // Sin rol de gestión el calendario pide `mine=true` (agenda propia), y el
    // listado de entrenadores (GET /classes/trainer-options, ADMIN/STAFF) no se
    // pide ni se muestra: filtrar por entrenador no aporta nada sobre tu agenda.
    const { user: authUser } = useAuth();
    const canManage = isManagementRole(authUser?.roles);
    const [weekOffset, setWeekOffset] = useState(0);
    const [classFilter, setClassFilter] = useState('all');
    const [trainerFilter, setTrainerFilter] = useState('all');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    // Reloj vivo: reposiciona el indicador de "ahora" sin recargar.
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    const weekStart = weekStartForOffset(weekOffset);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const { data: weekSessions = [] } = useWeekSessions(weekOffset, !canManage);
    const { data: classes = [] } = useGymClasses();
    const { data: trainers = [] } = useTrainers(canManage);
    const sessions = weekSessions
        .filter((s) => classFilter === 'all' || s.classId === classFilter)
        .filter((s) => trainerFilter === 'all' || s.trainerId === trainerFilter);
    // Franjas fijas de 7 a. m. a 8 p. m.; se agregan horas extra solo si hay
    // sesiones fuera de ese rango (p. ej. spinning de 6 a. m.).
    const BASE_HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
    const sessionHours = sessions.map((s) => Number(s.startTime.slice(0, 2)));
    const times = [...new Set([...BASE_HOURS, ...sessionHours])]
        .sort((a, b) => a - b)
        .map((h) => `${String(h).padStart(2, '0')}:00`);

    // Indicador de "ahora" (solo semana actual): columna de hoy resaltada y
    // línea posicionada proporcionalmente a los minutos dentro de la fila de
    // la hora actual (estilo Google Calendar). Si la hora actual no tiene
    // fila (fuera del rango de franjas), la línea se oculta.
    const todayKey = format(now, 'yyyy-MM-dd');
    const nowRow = times.findIndex((t) => t.slice(0, 2) === format(now, 'HH'));
    const nowMinutePct = (now.getMinutes() / 60) * 100;

    return (
        <div className="flex flex-col gap-6">
            {/* Toolbar: navegación de semana + filtros */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setWeekOffset((w) => w - 1)}
                            aria-label="Semana anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-40 text-center text-sm font-medium text-foreground">
                            {formatWeekLabel(weekStart)}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setWeekOffset((w) => w + 1)}
                            aria-label="Semana siguiente"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {weekOffset !== 0 && (
                        <Button variant="outline" className="border-border" onClick={() => setWeekOffset(0)}>
                            Hoy
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-full bg-secondary/50 border-border sm:w-44">
                            <SelectValue placeholder="Clase" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">Todas las clases</SelectItem>
                            {classes
                                .filter((cls) => cls.status !== 'inactive')
                                .map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    {canManage && (
                        <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                            <SelectTrigger className="w-full bg-secondary/50 border-border sm:w-44">
                                <SelectValue placeholder="Entrenador" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">Todos los entrenadores</SelectItem>
                                {trainers.map((trainer) => (
                                    <SelectItem key={trainer.id} value={trainer.id}>
                                        {trainer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Grilla semanal */}
            {sessions.length === 0 ? (
                <Card className="border-border bg-card">
                    <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                        <CalendarX2 className="h-8 w-8 text-muted-foreground" aria-hidden />
                        <p className="font-medium text-foreground">Sin sesiones esta semana</p>
                        <p className="text-sm text-muted-foreground">
                            No hay sesiones programadas para esta semana con los filtros aplicados.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-border bg-card">
                    <CardContent className="p-0">
                        <div className="max-h-[65vh] overflow-auto">
                            <div
                                className="relative grid min-w-[880px]"
                                style={{
                                    gridTemplateColumns: '72px repeat(7, minmax(0, 1fr))',
                                    // Filas explícitas (mismo sizing que las implícitas): el overlay
                                    // absoluto de "ahora" solo puede referenciar líneas explícitas.
                                    gridTemplateRows: `auto repeat(${times.length}, auto)`,
                                }}
                            >
                                <div className="sticky top-0 z-10 border-b border-border bg-card" />
                                {days.map((day) => {
                                    const isToday = format(day, 'yyyy-MM-dd') === todayKey;
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={cn(
                                                'sticky top-0 z-10 border-b border-l border-border bg-card p-2 text-center text-xs font-semibold capitalize',
                                                isToday ? 'text-primary' : 'text-muted-foreground',
                                            )}
                                        >
                                            {format(day, 'EEE d', { locale: es })}
                                        </div>
                                    );
                                })}
                                {times.map((time) => (
                                    <Fragment key={time}>
                                        <div className="whitespace-nowrap border-t border-border p-2 text-xs text-muted-foreground">
                                            {formatTime12h(time)}
                                        </div>
                                        {days.map((day) => {
                                            const dayKey = format(day, 'yyyy-MM-dd');
                                            const cell = sessions.filter(
                                                (s) =>
                                                    s.date === dayKey && s.startTime.slice(0, 2) === time.slice(0, 2),
                                            );
                                            return (
                                                <div
                                                    key={dayKey}
                                                    className={cn(
                                                        'flex min-h-16 flex-col gap-1.5 border-t border-l border-border p-1.5',
                                                        dayKey === todayKey && 'bg-primary/[0.04]',
                                                    )}
                                                >
                                                    {cell.map((session) => (
                                                        <SessionCard
                                                            key={session.id}
                                                            session={session}
                                                            onClick={() => setSelectedSessionId(session.id)}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                                {/* Overlay absoluto: al ser position:absolute NO participa del
                                    auto-placement (no desplaza celdas), pero con grid-row/column
                                    definidos su containing block es el área de la fila de la hora
                                    actual; top:% baja la línea según los minutos transcurridos. */}
                                {weekOffset === 0 && nowRow !== -1 && (
                                    <div
                                        className="pointer-events-none absolute inset-0 z-[5] col-span-full"
                                        // En absolutos, la línea de fin en `auto` = borde del contenedor
                                        // (no "span 1"): hay que fijar inicio Y fin de la fila.
                                        style={{ gridRow: `${nowRow + 2} / ${nowRow + 3}` }}
                                        aria-hidden
                                    >
                                        <div
                                            className="absolute inset-x-0 pl-[72px]"
                                            style={{ top: `${nowMinutePct}%` }}
                                        >
                                            <div className="relative flex items-center">
                                                <span className="absolute -left-1 h-2 w-2 rounded-full bg-primary" />
                                                <span className="h-0.5 w-full bg-primary/70" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <p className="text-sm text-muted-foreground">
                {sessions.length} {sessions.length === 1 ? 'sesión programada' : 'sesiones programadas'} esta semana
            </p>

            <SessionDetailSheet
                sessionId={selectedSessionId}
                onOpenChange={(open) => {
                    if (!open) setSelectedSessionId(null);
                }}
            />
        </div>
    );
}
