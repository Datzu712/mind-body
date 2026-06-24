'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import type { RoutineVersion, Exercise } from '../lib/training-types';

interface RoutineVersionsProps {
    versions: RoutineVersion[];
    exercises: Exercise[];
}

export function RoutineVersions({ versions, exercises }: RoutineVersionsProps) {
    if (versions.length === 0) {
        return (
            <div className="rounded-md border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                <History className="mr-2 inline h-4 w-4" />
                Aún no hay versiones guardadas.
            </div>
        );
    }

    const findExercise = (id: string) => exercises.find((e) => e.id === id);

    return (
        <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Historial de versiones</h4>
            <Accordion type="single" collapsible className="w-full rounded-md border border-border">
                {versions.map((version, index) => (
                    <AccordionItem key={version.id} value={version.id} className="px-4">
                        <AccordionTrigger className="text-sm hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary">v{versions.length - index}</Badge>
                                <span className="text-muted-foreground">
                                    {format(new Date(version.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                                <span className="font-normal">{version.note}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="flex flex-col gap-1 pl-2">
                                {version.exercises.length === 0 && (
                                    <li className="text-sm text-muted-foreground">Sin ejercicios</li>
                                )}
                                {version.exercises.map((ex) => {
                                    const exercise = findExercise(ex.exerciseId);
                                    return (
                                        <li key={ex.id} className="text-sm">
                                            <span className="font-medium">
                                                {exercise?.name || 'Ejercicio eliminado'}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {' '}
                                                — {ex.sets} series x {ex.reps}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
