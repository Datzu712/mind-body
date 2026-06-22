import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { sileo } from 'sileo';
import type { ProfileType } from '../types';

interface CreateProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userName?: string;
    suggestedType?: ProfileType;
}

export function CreateProfileModal({ open, onOpenChange, userName, suggestedType }: CreateProfileModalProps) {
    const [profileType, setProfileType] = useState<ProfileType | ''>(suggestedType || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sileo.success({
            title: `Perfil de ${profileType === 'MEMBER' ? 'miembro' : profileType === 'TRAINER' ? 'entrenador' : 'staff'} creado exitosamente`,
        });
        onOpenChange(false);
        setProfileType(suggestedType || '');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        Crear perfil{userName ? ` para ${userName}` : ''}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Tipo de perfil</Label>
                        <Select value={profileType} onValueChange={(v) => setProfileType(v as ProfileType)}>
                            <SelectTrigger className="bg-secondary/50 border-border">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="MEMBER">Miembro</SelectItem>
                                <SelectItem value="TRAINER">Entrenador</SelectItem>
                                <SelectItem value="STAFF">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {profileType === 'MEMBER' && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Fecha de nacimiento</Label>
                                <Input type="date" className="bg-secondary/50 border-border" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Fecha de ingreso</Label>
                                <Input
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Contacto de emergencia</Label>
                                <Input placeholder="Nombre" className="bg-secondary/50 border-border" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Tel. emergencia</Label>
                                <Input placeholder="+52 55 ..." className="bg-secondary/50 border-border" />
                            </div>
                        </div>
                    )}

                    {profileType === 'TRAINER' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Especialidad</Label>
                                <Input
                                    placeholder="Ej: Funcional, Yoga, Fuerza..."
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Biografia</Label>
                                <Textarea
                                    placeholder="Breve descripcion..."
                                    className="bg-secondary/50 border-border min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}

                    {profileType === 'STAFF' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Fecha de contratacion</Label>
                                <Input
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                        </div>
                    )}

                    {!profileType && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Selecciona un tipo de perfil para ver los campos.
                        </p>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!profileType}>
                            Crear perfil
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
