import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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

    const hasFilters = q !== '' || bodyPart !== ALL || equipment !== ALL;
    const resetAnd = (fn: () => void) => {
        fn();
        setOffset(0);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(e) => resetAnd(() => setQ(e.target.value))}
                        placeholder="Buscar ejercicio..."
                        className="pl-8"
                    />
                </div>
                <Select value={bodyPart} onValueChange={(v) => resetAnd(() => setBodyPart(v))}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Grupo muscular" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Todos los grupos</SelectItem>
                        {facets?.bodyParts.map((bp) => (
                            <SelectItem key={bp} value={bp}>
                                {bodyPartLabel(bp)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={equipment} onValueChange={(v) => resetAnd(() => setEquipment(v))}>
                    <SelectTrigger className="w-full sm:w-44">
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
                        size="sm"
                        onClick={() =>
                            resetAnd(() => {
                                setQ('');
                                setBodyPart(ALL);
                                setEquipment(ALL);
                            })
                        }
                    >
                        <X className="mr-1 h-4 w-4" />
                        Limpiar
                    </Button>
                )}
            </div>

            {/* Grid */}
            {isPending ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
