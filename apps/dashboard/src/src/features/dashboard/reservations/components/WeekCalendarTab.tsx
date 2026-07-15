import { Fragment, useState } from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';

import { MOCK_TRAINERS, mockManagedClasses } from '../mock-classes';
import { formatWeekLabel, weekStartForOffset } from '../mock-reservations';
import type { ReservationsStore } from '../use-reservations-mock';
import { SessionCard } from './SessionCard';
import { SessionDetailSheet } from './SessionDetailSheet';

interface WeekCalendarTabProps {
    store: ReservationsStore;
}

export function WeekCalendarTab({ store }: WeekCalendarTabProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [classFilter, setClassFilter] = useState('all');
    const [trainerFilter, setTrainerFilter] = useState('all');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const weekStart = weekStartForOffset(weekOffset);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const sessions = store
        .getSessionsForWeek(weekOffset)
        .filter((s) => classFilter === 'all' || s.classId === classFilter)
        .filter((s) => trainerFilter === 'all' || s.trainer === trainerFilter);
    const times = [...new Set(sessions.map((s) => s.startTime))].sort();

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
                        <SelectTrigger className="bg-secondary/50 border-border sm:w-44">
                            <SelectValue placeholder="Clase" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">Todas las clases</SelectItem>
                            {mockManagedClasses
                                .filter((cls) => cls.status !== 'inactive')
                                .map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                        <SelectTrigger className="bg-secondary/50 border-border sm:w-44">
                            <SelectValue placeholder="Entrenador" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">Todos los entrenadores</SelectItem>
                            {MOCK_TRAINERS.map((trainer) => (
                                <SelectItem key={trainer} value={trainer}>
                                    {trainer}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                                className="grid min-w-[880px]"
                                style={{ gridTemplateColumns: '72px repeat(7, minmax(0, 1fr))' }}
                            >
                                <div className="sticky top-0 z-10 border-b border-border bg-card" />
                                {days.map((day) => (
                                    <div
                                        key={day.toISOString()}
                                        className="sticky top-0 z-10 border-b border-l border-border bg-card p-2 text-center text-xs font-semibold capitalize text-muted-foreground"
                                    >
                                        {format(day, 'EEE d', { locale: es })}
                                    </div>
                                ))}
                                {times.map((time) => (
                                    <Fragment key={time}>
                                        <div className="border-t border-border p-2 text-xs text-muted-foreground">
                                            {time}
                                        </div>
                                        {days.map((day) => {
                                            const dayKey = format(day, 'yyyy-MM-dd');
                                            const cell = sessions.filter(
                                                (s) => s.date === dayKey && s.startTime === time,
                                            );
                                            return (
                                                <div
                                                    key={dayKey}
                                                    className="flex min-h-16 flex-col gap-1.5 border-t border-l border-border p-1.5"
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
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <p className="text-sm text-muted-foreground">
                {sessions.length} {sessions.length === 1 ? 'sesión programada' : 'sesiones programadas'} esta semana
            </p>

            <SessionDetailSheet
                store={store}
                sessionId={selectedSessionId}
                onOpenChange={(open) => {
                    if (!open) setSelectedSessionId(null);
                }}
            />
        </div>
    );
}
