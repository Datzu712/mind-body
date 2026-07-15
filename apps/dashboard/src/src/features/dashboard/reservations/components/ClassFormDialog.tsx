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
import { MOCK_TRAINERS, WEEK_DAYS, type ManagedClass, type WeekDay } from '../mock-classes';

export interface ClassFormData {
    name: string;
    description: string;
    trainer: string;
    day: WeekDay;
    time: string;
    durationMin: number;
    capacity: number;
    allowWaitlist: boolean;
    status: 'active' | 'inactive';
}

interface ClassFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item?: ManagedClass | null;
    onSubmit: (data: ClassFormData) => Promise<{ success: boolean; error?: string }>;
}

const emptyForm: ClassFormData = {
    name: '',
    description: '',
    trainer: MOCK_TRAINERS[0],
    day: 'Lunes',
    time: '08:00',
    durationMin: 60,
    capacity: 10,
    allowWaitlist: true,
    status: 'active',
};

export function ClassFormDialog({ open, onOpenChange, item, onSubmit }: ClassFormDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ClassFormData>(emptyForm);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                description: item.description,
                trainer: item.trainer,
                day: item.day,
                time: item.time,
                durationMin: item.durationMin,
                capacity: item.capacity,
                allowWaitlist: item.allowWaitlist,
                // full / waitlist are derived states — the form only toggles active/inactive.
                status: item.status === 'inactive' ? 'inactive' : 'active',
            });
        } else {
            setFormData(emptyForm);
        }
    }, [item, open]);

    const isEditing = !!item;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                            ? 'Modifica la información, horario y cupos de la clase.'
                            : 'Completa los datos para crear una nueva clase disponible.'}
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

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="class-trainer">Entrenador</Label>
                            <Select
                                value={formData.trainer}
                                onValueChange={(value) => setFormData({ ...formData, trainer: value })}
                            >
                                <SelectTrigger id="class-trainer" className="bg-secondary/50 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {MOCK_TRAINERS.map((trainer) => (
                                        <SelectItem key={trainer} value={trainer}>
                                            {trainer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="class-day">Día</Label>
                            <Select
                                value={formData.day}
                                onValueChange={(value) => setFormData({ ...formData, day: value as WeekDay })}
                            >
                                <SelectTrigger id="class-day" className="bg-secondary/50 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {WEEK_DAYS.map((day) => (
                                        <SelectItem key={day} value={day}>
                                            {day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
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
                            onValueChange={(value) =>
                                setFormData({ ...formData, status: value as 'active' | 'inactive' })
                            }
                        >
                            <SelectTrigger id="class-status" className="bg-secondary/50 border-border">
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
