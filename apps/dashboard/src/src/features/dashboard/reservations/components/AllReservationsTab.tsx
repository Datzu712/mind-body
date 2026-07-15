import { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { DataTable, type Column } from '@/src/shared/components/data-table';
import { mockManagedClasses } from '../mock-classes';
import {
    reservationStatusLabels,
    sessionStartDate,
    weekStartForOffset,
    type ClassSession,
    type Reservation,
    type ReservationStatus,
} from '../mock-reservations';
import type { ReservationsStore } from '../use-reservations-mock';
import { ClassStatusBadge } from './ClassStatusBadge';
import { ReservationActions } from './ReservationActions';

const PAGE_SIZE = 10;

type RangeFilter = 'current' | 'past' | 'all';

interface Row {
    reservation: Reservation;
    session: ClassSession;
}

interface AllReservationsTabProps {
    store: ReservationsStore;
}

export function AllReservationsTab({ store }: AllReservationsTabProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');
    const [classFilter, setClassFilter] = useState('all');
    const [rangeFilter, setRangeFilter] = useState<RangeFilter>('all');
    const [page, setPage] = useState(0);

    const rows = useMemo(() => {
        const inRange = (session: ClassSession) => {
            if (rangeFilter === 'all') return true;
            const start = weekStartForOffset(rangeFilter === 'current' ? 0 : -1);
            const from = format(start, 'yyyy-MM-dd');
            const to = format(addDays(start, 6), 'yyyy-MM-dd');
            return session.date >= from && session.date <= to;
        };

        return store.reservations
            .flatMap((reservation) => {
                const session = store.sessionById.get(reservation.sessionId);
                return session ? [{ reservation, session }] : [];
            })
            .filter(({ reservation }) => reservation.memberName.toLowerCase().includes(search.toLowerCase()))
            .filter(({ reservation }) => statusFilter === 'all' || reservation.status === statusFilter)
            .filter(({ session }) => classFilter === 'all' || session.classId === classFilter)
            .filter(({ session }) => inRange(session))
            .sort(
                (a, b) =>
                    sessionStartDate(a.session).getTime() - sessionStartDate(b.session).getTime() ||
                    a.reservation.memberName.localeCompare(b.reservation.memberName),
            );
    }, [store.reservations, store.sessionById, search, statusFilter, classFilter, rangeFilter]);

    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount - 1);
    const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    const columns: Column<Row>[] = [
        {
            key: 'member',
            header: 'Miembro',
            render: ({ reservation }) => <span className="font-medium text-foreground">{reservation.memberName}</span>,
        },
        {
            key: 'class',
            header: 'Clase',
            render: ({ session }) => <span className="text-muted-foreground">{session.className}</span>,
        },
        {
            key: 'session',
            header: 'Sesión',
            className: 'whitespace-nowrap',
            render: ({ session }) => (
                <span className="capitalize text-muted-foreground">
                    {format(sessionStartDate(session), 'EEE d MMM', { locale: es })} · {session.startTime}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            render: ({ reservation }) => <ClassStatusBadge status={reservation.status} />,
        },
        {
            key: 'createdAt',
            header: 'Creada',
            className: 'whitespace-nowrap',
            render: ({ reservation }) => (
                <span className="text-muted-foreground">
                    {format(new Date(reservation.createdAt), 'd MMM yyyy', { locale: es })}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: ({ reservation }) => <ReservationActions store={store} reservation={reservation} />,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Filtros */}
            <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por miembro..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        className="pl-9 bg-secondary/50 border-border"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                        setStatusFilter(value as 'all' | ReservationStatus);
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="bg-secondary/50 border-border lg:w-44">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {Object.entries(reservationStatusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={classFilter}
                    onValueChange={(value) => {
                        setClassFilter(value);
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="bg-secondary/50 border-border lg:w-44">
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
                <Select
                    value={rangeFilter}
                    onValueChange={(value) => {
                        setRangeFilter(value as RangeFilter);
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="bg-secondary/50 border-border lg:w-44">
                        <SelectValue placeholder="Rango" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">Todas las fechas</SelectItem>
                        <SelectItem value="current">Esta semana</SelectItem>
                        <SelectItem value="past">Semana pasada</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabla */}
            <Card className="border-border bg-card">
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={pageRows}
                        keyExtractor={({ reservation }) => reservation.id}
                        emptyMessage="No se encontraron reservas con los filtros aplicados."
                        className="border-0"
                    />
                </CardContent>
            </Card>

            {/* Paginación */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Mostrando {pageRows.length} de {rows.length} reservas
                </p>
                {pageCount > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border"
                            disabled={safePage === 0}
                            onClick={() => setPage(safePage - 1)}
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {safePage + 1} / {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border"
                            disabled={safePage >= pageCount - 1}
                            onClick={() => setPage(safePage + 1)}
                            aria-label="Página siguiente"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
