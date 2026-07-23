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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { sileo } from 'sileo';
import { cn } from '@/lib/utils';

import { useTrainers } from '../hooks';
import type { ClassFormData, ClassStatus, GymClass, WeekDay } from '../types';
import { WEEK_DAYS } from '../utils';

interface ClassFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item?: GymClass | null;
    onSubmit: (data: ClassFormData) => Promise<{ success: boolean; error?: string }>;
}

const emptyForm: ClassFormData = {
    name: '',
    description: '',
    trainerId: '',
    days: [],
    time: '08:00',
    durationMin: 60,
    capacity: 10,
    allowWaitlist: true,
    status: 'active',
};

export function ClassFormDialog({ open, onOpenChange, item, onSubmit }: ClassFormDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ClassFormData>(emptyForm);
    const { data: trainers = [] } = useTrainers();

    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData(emptyForm);
        }
    }, [item, open]);

    const isEditing = !!item;

    const toggleDay = (day: WeekDay) =>
        setFormData((prev) => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
        }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.days.length === 0) {
            sileo.warning({ title: 'Seleccioná al menos un día' });
            return;
        }
        if (!formData.trainerId) {
            sileo.warning({ title: 'Seleccioná un entrenador' });
            return;
        }
        setLoading(true);
        try {
            const result = await onSubmit(formData);
            if (result.success) {
                onOpenChange(false);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{isEditing ? 'Editar clase' : 'Nueva clase'}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEditing
                            ? 'Los cambios de horario se aplican a todas las sesiones futuras de la clase.'
                            : 'Definí la clase y su recurrencia semanal; las sesiones se generan solas.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="class-name">Nombre de la clase</Label>
                        <Input
                            id="class-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. HIIT Power"
                            required
                            className="bg-secondary/50 border-border"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="class-description">Descripción</Label>
                        <Textarea
                            id="class-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe la clase..."
                            className="bg-secondary/50 border-border min-h-[72px]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Días de la semana</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {WEEK_DAYS.map((day) => {
                                const selected = formData.days.includes(day);
                                return (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        aria-pressed={selected}
                                        className={cn(
                                            'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                                            selected
                                                ? 'border-primary/60 bg-primary/15 text-primary'
                                                : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="class-trainer">Entrenador</Label>
                            <Select
                                value={formData.trainerId}
                                onValueChange={(value) => setFormData({ ...formData, trainerId: value })}
                            >
                                <SelectTrigger id="class-trainer" className="w-full bg-secondary/50 border-border">
                                    <SelectValue placeholder="Seleccionar entrenador" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {trainers.map((trainer) => (
                                        <SelectItem key={trainer.id} value={trainer.id}>
                                            {trainer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="class-time">Hora</Label>
                            <Input
                                id="class-time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="class-duration">Duración (min)</Label>
                            <Input
                                id="class-duration"
                                type="number"
                                min={1}
                                value={formData.durationMin}
                                onChange={(e) =>
                                    setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })
                                }
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="class-capacity">Cupo máximo</Label>
                            <Input
                                id="class-capacity"
                                type="number"
                                min={1}
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                        <div className="flex flex-col">
                            <Label htmlFor="class-waitlist" className="cursor-pointer">
                                Permite lista de espera
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                Los miembros podrán anotarse cuando el cupo esté lleno.
                            </span>
                        </div>
                        <Switch
                            id="class-waitlist"
                            checked={formData.allowWaitlist}
                            onCheckedChange={(checked) => setFormData({ ...formData, allowWaitlist: checked })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="class-status">Estado</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value as ClassStatus })}
                        >
                            <SelectTrigger id="class-status" className="w-full bg-secondary/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="active">Activa</SelectItem>
                                <SelectItem value="inactive">Inactiva</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-2">
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
                            {isEditing ? 'Guardar cambios' : 'Crear clase'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
