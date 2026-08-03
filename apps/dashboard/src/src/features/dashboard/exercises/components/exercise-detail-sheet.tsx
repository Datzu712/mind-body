import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useExercise } from '../hooks';
import { bodyPartLabel, equipmentLabel, targetLabel } from '../exercise-labels';

interface ExerciseDetailSheetProps {
    exerciseId: string | null;
    onOpenChange: (open: boolean) => void;
}

/** GIF animado con fallback al thumbnail estático si el GIF no carga. */
function DetailMedia({ gifUrl, imageUrl, name }: { gifUrl: string | null; imageUrl: string | null; name: string }) {
    const [gifBroken, setGifBroken] = useState(false);
    const src = !gifBroken && gifUrl ? gifUrl : imageUrl;
    if (!src) return null;
    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            <img
                src={src}
                alt={name}
                className="mx-auto aspect-square w-full max-w-72 object-contain"
                onError={() => (src === gifUrl ? setGifBroken(true) : undefined)}
            />
        </div>
    );
}

export function ExerciseDetailSheet({ exerciseId, onOpenChange }: ExerciseDetailSheetProps) {
    const { data: exercise, isLoading, isError } = useExercise(exerciseId);

    return (
        <Sheet open={exerciseId !== null} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                {isLoading && (
                    <div className="space-y-4 px-4 pb-4 pt-8">
                        <Skeleton className="aspect-square w-full rounded-xl" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                )}
                {isError && (
                    <p className="px-4 pt-10 text-center text-sm text-muted-foreground">
                        No se pudo cargar el ejercicio. Intentá de nuevo.
                    </p>
                )}
                {exercise && (
                    <>
                        <SheetHeader>
                            <SheetTitle className="capitalize">{exercise.name}</SheetTitle>
                            <SheetDescription>
                                {targetLabel(exercise.target)} · {equipmentLabel(exercise.equipment)}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-5 px-4 pb-4">
                            <DetailMedia
                                key={exercise.id}
                                gifUrl={exercise.gifUrl}
                                imageUrl={exercise.imageUrl}
                                name={exercise.name}
                            />

                            <div className="flex flex-wrap gap-1.5">
                                <Badge>{bodyPartLabel(exercise.bodyPart)}</Badge>
                                <Badge variant="secondary">{targetLabel(exercise.target)}</Badge>
                                <Badge variant="outline">{equipmentLabel(exercise.equipment)}</Badge>
                            </div>

                            {exercise.secondaryMuscles.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Músculos secundarios</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {exercise.secondaryMuscles.map((m) => (
                                            <Badge
                                                key={m}
                                                variant="outline"
                                                className="font-normal text-muted-foreground"
                                            >
                                                {targetLabel(m)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {exercise.instructions.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold">Instrucciones</h4>
                                    <ol className="space-y-3">
                                        {exercise.instructions.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm leading-relaxed">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                    {i + 1}
                                                </span>
                                                <span className="text-muted-foreground">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            <Separator />
                            <p className="pb-4 text-xs text-muted-foreground/70">
                                Media © Gym visual —{' '}
                                <a
                                    href="https://gymvisual.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    gymvisual.com
                                </a>
                            </p>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
