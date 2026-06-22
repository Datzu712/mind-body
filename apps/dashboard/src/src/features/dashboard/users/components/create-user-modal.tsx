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

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
    const [profileType, setProfileType] = useState<ProfileType | ''>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sileo.success({ title: 'Usuario creado exitosamente' });
        onOpenChange(false);
        setProfileType('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo usuario</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Datos base del usuario */}
                    <div className="grid gap-4 grid-cols-2">
                        <div className="flex flex-col gap-1.5 col-span-2">
                            <Label className="text-sm font-medium">
                                Nombre completo <span className="text-destructive">*</span>
                            </Label>
                            <Input placeholder="Ej: Juan Perez" className="bg-secondary/50 border-border" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="email"
                                placeholder="usuario@email.com"
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">Telefono</Label>
                            <Input placeholder="+52 55 ..." className="bg-secondary/50 border-border" />
                        </div>
                    </div>

                    <Separator />

                    {/* Perfil inicial */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-sm font-medium">Perfil inicial</Label>
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

                    {profileType === 'MEMBER' && (
                        <div className="grid gap-4 grid-cols-2">
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
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Fecha de contratacion</Label>
                            <Input
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Crear usuario</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
