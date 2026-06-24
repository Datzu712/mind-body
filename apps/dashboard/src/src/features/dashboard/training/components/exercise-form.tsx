'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Exercise } from '../lib/training-types';

interface ExerciseFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercise?: Exercise | null;
    onSubmit: (data: Partial<Exercise>) => Promise<{ success: boolean; error?: string }>;
}

export function ExerciseForm({ open, onOpenChange, exercise, onSubmit }: ExerciseFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Exercise>>({
        name: '',
        muscleGroup: '',
        description: '',
        status: 'ACTIVE',
    });

    const isEditing = !!exercise;

    useEffect(() => {
        if (open) {
            setFormData({
                name: exercise?.name || '',
                muscleGroup: exercise?.muscleGroup || '',
                description: exercise?.description || '',
                status: exercise?.status || 'ACTIVE',
            });
            setError(null);
        }
    }, [open, exercise]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            setError('El nombre del ejercicio es obligatorio.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await onSubmit(formData);
            if (result.success) {
                onOpenChange(false);
                setFormData({ name: '', muscleGroup: '', description: '', status: 'ACTIVE' });
            } else {
                setError(result.error || 'Ocurrió un error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {isEditing ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEditing
                            ? 'Modifica la información del ejercicio.'
                            : 'Registra un ejercicio para usarlo en rutinas.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="exercise-name">Nombre</Label>
                        <Input
                            id="exercise-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Sentadilla con barra"
                            className="bg-secondary/50 border-border"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="exercise-muscle">Grupo muscular</Label>
                        <Input
                            id="exercise-muscle"
                            value={formData.muscleGroup}
                            onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                            placeholder="Ej. Piernas"
                            className="bg-secondary/50 border-border"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="exercise-status">Estado</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value as Exercise['status'] })}
                        >
                            <SelectTrigger className="bg-secondary/50 border-border">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="ACTIVE">Activo</SelectItem>
                                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="exercise-description">Descripción</Label>
                        <Textarea
                            id="exercise-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Notas técnicas o descripción corta"
                            className="bg-secondary/50 border-border"
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-border"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar cambios' : 'Crear ejercicio'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
