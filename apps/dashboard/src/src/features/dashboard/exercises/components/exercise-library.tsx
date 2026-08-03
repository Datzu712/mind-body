import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, FilterX, Search, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/src/features/dashboard/users/use-debounced-value';
import { useExerciseFacets, useExercises } from '../hooks';
import { bodyPartLabel, equipmentLabel } from '../exercise-labels';
import type { ExerciseSlim } from '../types';
import { ExerciseCard } from './exercise-card';

const PAGE_SIZE = 24;
/** Sentinel para los Select: Radix no permite SelectItem con value "". */
const ALL = 'all';

interface ExerciseLibraryProps {
    onExerciseClick?: (exercise: ExerciseSlim) => void;
    /** Slot por card (p.ej. botón "+" cuando el builder embeba la biblioteca). */
    renderCardAction?: (exercise: ExerciseSlim) => ReactNode;
}

export function ExerciseLibrary({ onExerciseClick, renderCardAction }: ExerciseLibraryProps) {
    const [q, setQ] = useState('');
    const [bodyPart, setBodyPart] = useState(ALL);
    const [equipment, setEquipment] = useState(ALL);
    const [offset, setOffset] = useState(0);
    const debouncedQ = useDebouncedValue(q, 300);

    const filters = {
        limit: PAGE_SIZE,
        offset,
        q: debouncedQ || undefined,
        bodyPart: bodyPart === ALL ? undefined : bodyPart,
        equipment: equipment === ALL ? undefined : equipment,
    };
    const { data, isPending, isError, refetch } = useExercises(filters);
    const { data: facets } = useExerciseFacets();

    // Página nueva se lee desde el inicio: al cambiar offset se sube al tope de
    // la biblioteca (keepPreviousData deja el grid viejo anclado al fondo si no).
    // scrollIntoView cubre ambos contextos (página del catálogo y panel del
    // builder) sin saber cuál ancestro scrollea. Se salta el mount para no
    // robarle el scroll a la página al montar.
    const rootRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        rootRef.current?.scrollIntoView({ block: 'start' });
    }, [offset]);

    const hasFilters = q !== '' || bodyPart !== ALL || equipment !== ALL;
    const resetAnd = (fn: () => void) => {
        fn();
        setOffset(0);
    };

    return (
        <div ref={rootRef} className="@container scroll-mt-3 space-y-4">
            {/* Toolbar: búsqueda + equipo en una fila; grupo muscular como chips
                (el filtro más usado, visible y de un clic — mismo patrón que la app mobile) */}
            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[180px] flex-1">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={q}
                            onChange={(e) => resetAnd(() => setQ(e.target.value))}
                            placeholder="Buscar ejercicio..."
                            className="pl-8 pr-8"
                        />
                        {q !== '' && (
                            <button
                                type="button"
                                aria-label="Borrar búsqueda"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => resetAnd(() => setQ(''))}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Select value={equipment} onValueChange={(v) => resetAnd(() => setEquipment(v))}>
                        <SelectTrigger
                            className={cn('w-44 shrink-0', equipment !== ALL && 'border-primary/50 text-foreground')}
                        >
                            <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <SelectValue placeholder="Equipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Todo el equipo</SelectItem>
                            {facets?.equipments.map((eq) => (
                                <SelectItem key={eq} value={eq}>
                                    {equipmentLabel(eq)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            aria-label="Limpiar filtros"
                            title="Limpiar filtros"
                            onClick={() =>
                                resetAnd(() => {
                                    setQ('');
                                    setBodyPart(ALL);
                                    setEquipment(ALL);
                                })
                            }
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Chips de grupo muscular (scroll horizontal, click activo = quitar) */}
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
                    <FilterChip active={bodyPart === ALL} onClick={() => resetAnd(() => setBodyPart(ALL))}>
                        Todos
                    </FilterChip>
                    {facets?.bodyParts.map((bp) => (
                        <FilterChip
                            key={bp}
                            active={bodyPart === bp}
                            onClick={() => resetAnd(() => setBodyPart(bodyPart === bp ? ALL : bp))}
                        >
                            {bodyPartLabel(bp)}
                        </FilterChip>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {isPending ? (
                <div className="grid grid-cols-2 gap-4 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-square w-full rounded-xl" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <p className="text-sm text-muted-foreground">No se pudieron cargar los ejercicios.</p>
                    <Button variant="outline" size="sm" onClick={() => void refetch()}>
                        Reintentar
                    </Button>
                </div>
            ) : data && data.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <SearchX className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium">Sin resultados</p>
                    <p className="text-sm text-muted-foreground">Probá con otro término u otros filtros.</p>
                </div>
            ) : data ? (
                <>
                    <div className="grid grid-cols-2 gap-4 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5">
                        {data.items.map((exercise) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                onClick={() => onExerciseClick?.(exercise)}
                                action={renderCardAction?.(exercise)}
                            />
                        ))}
                    </div>
                    {/* Paginación */}
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                            {data.total === 0
                                ? '0 ejercicios'
                                : `${data.offset + 1}–${data.offset + data.items.length} de ${data.total}`}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={data.offset === 0}
                                onClick={() => setOffset(Math.max(0, data.offset - PAGE_SIZE))}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={data.offset + data.items.length >= data.total}
                                onClick={() => setOffset(data.offset + PAGE_SIZE)}
                            >
                                Siguiente
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}
