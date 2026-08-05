import { useState, type ReactNode } from 'react';
import { Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { bodyPartLabel, equipmentLabel } from '../exercise-labels';
import type { ExerciseSlim } from '../types';

interface ExerciseCardProps {
    exercise: ExerciseSlim;
    /** 'grid' para la biblioteca; 'row' compacta (lista de rutina del futuro builder). */
    variant?: 'grid' | 'row';
    onClick?: () => void;
    /** Slot arriba a la derecha (p.ej. botón "+" en el builder). */
    action?: ReactNode;
}

/**
 * El slot `action` vive dentro del área clickeable del card, así que su click
 * burbrujearía hasta `onClick` y abriría el detalle además de ejecutar la acción
 * (agregar el ejercicio al builder, por ejemplo). Se corta acá y no en cada
 * consumidor: el slot es "un control que no es el cuerpo del card", y esa
 * garantía la debe dar el card.
 */
function ActionSlot({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={className} onClick={(event) => event.stopPropagation()}>
            {children}
        </div>
    );
}

/** Miniatura con hover→GIF. El GIF recién se descarga cuando cambia el src. */
function Thumb({ exercise, className }: { exercise: ExerciseSlim; className?: string }) {
    const [hover, setHover] = useState(false);
    // Estados separados: un GIF roto solo deshabilita el hover (se queda la
    // imagen estática); solo la imagen estática rota muestra el ícono.
    const [imgBroken, setImgBroken] = useState(false);
    const [gifBroken, setGifBroken] = useState(false);

    const showGif = hover && !!exercise.gifUrl && !gifBroken;
    const src = showGif ? exercise.gifUrl : exercise.imageUrl;

    if (!src || (!showGif && imgBroken)) {
        return (
            // Mantiene los handlers de hover: si solo la estática está rota,
            // el GIF (si funciona) sigue disponible al hacer hover.
            <div
                className={cn('flex items-center justify-center bg-muted', className)}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
            </div>
        );
    }
    return (
        // Fondo blanco fijo: el media del dataset trae fondo blanco y en dark
        // mode quedaría un rectángulo recortado sobre fondo oscuro.
        <div
            className={cn('bg-white', className)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <img
                src={src}
                alt={exercise.name}
                loading="lazy"
                className="h-full w-full object-contain"
                onError={() => (showGif ? setGifBroken(true) : setImgBroken(true))}
            />
        </div>
    );
}

export function ExerciseCard({ exercise, variant = 'grid', onClick, action }: ExerciseCardProps) {
    if (variant === 'row') {
        return (
            <div
                className="group relative flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent/50"
                onClick={onClick}
            >
                <Thumb exercise={exercise} className="h-14 w-14 shrink-0 overflow-hidden rounded-md" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize">{exercise.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {bodyPartLabel(exercise.bodyPart)} · {equipmentLabel(exercise.equipment)}
                    </p>
                </div>
                {action && <ActionSlot className="shrink-0">{action}</ActionSlot>}
            </div>
        );
    }

    return (
        <div
            className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={onClick}
        >
            <Thumb exercise={exercise} className="aspect-square w-full" />
            <div className="space-y-2 p-3">
                <p className="line-clamp-2 min-h-10 text-sm font-medium capitalize leading-tight">{exercise.name}</p>
                <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                        {bodyPartLabel(exercise.bodyPart)}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        {equipmentLabel(exercise.equipment)}
                    </Badge>
                </div>
            </div>
            {action && <ActionSlot className="absolute right-2 top-2 z-10">{action}</ActionSlot>}
        </div>
    );
}
