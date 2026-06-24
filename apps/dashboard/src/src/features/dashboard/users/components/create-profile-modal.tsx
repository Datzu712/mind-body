import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DateField } from '@/components/ui/date-field';
import { sileo } from 'sileo';
import type { ProfileType } from '../types';
import { useCreateProfile } from '../hooks';

interface CreateProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName?: string;
    suggestedType?: ProfileType;
    /** Restrict the type selector to these options (e.g. only the profiles the user is missing). */
    availableTypes?: ProfileType[];
}

const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
    MEMBER: 'Miembro',
    TRAINER: 'Entrenador',
    STAFF: 'Staff',
};

export function CreateProfileModal({
    open,
    onOpenChange,
    userId,
    userName,
    suggestedType,
    availableTypes,
}: CreateProfileModalProps) {
    const [profileType, setProfileType] = useState<ProfileType | ''>(suggestedType || '');
    const typeOptions = availableTypes ?? (['MEMBER', 'TRAINER', 'STAFF'] as ProfileType[]);
    const formRef = useRef<HTMLFormElement>(null);
    const createProfile = useCreateProfile(userId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileType) return;

        const form = formRef.current;
        if (!form) return;

        const fd = new FormData(form);
        const get = (key: string) => (fd.get(key) as string) || undefined;

        createProfile.mutate(
            {
                profileType,
                joinedAt: get('joinedAt'),
                emergencyContactName: get('emergencyContactName'),
                emergencyContactPhone: get('emergencyContactPhone'),
                specialty: get('specialty'),
                biography: get('biography'),
                hiredAt: get('hiredAt'),
            },
            {
                onSuccess: () => {
                    const label =
                        profileType === 'MEMBER' ? 'miembro' : profileType === 'TRAINER' ? 'entrenador' : 'staff';
                    sileo.success({ title: `Perfil de ${label} creado exitosamente` });
                    onOpenChange(false);
                    setProfileType(suggestedType || '');
                    form.reset();
                },
                onError: (error) => {
                    sileo.error({ title: 'Error al crear perfil', description: error.message });
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-card border-border sm:max-w-[480px]"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        Crear perfil{userName ? ` para ${userName}` : ''}
                    </DialogTitle>
                </DialogHeader>

                <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <Label className="text-sm font-medium">Tipo de perfil</Label>
                        <Select value={profileType} onValueChange={(v) => setProfileType(v as ProfileType)}>
                            <SelectTrigger className="w-full bg-secondary/50 border-border">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {typeOptions.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {PROFILE_TYPE_LABELS[type]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="col-span-2" />

                    {profileType === 'MEMBER' && (
                        <>
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <Label className="text-sm font-medium">Fecha de ingreso</Label>
                                <DateField
                                    name="joinedAt"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    fromYear={2010}
                                    inputClassName="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium">Contacto de emergencia</Label>
                                <Input
                                    name="emergencyContactName"
                                    placeholder="Nombre"
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium">Tel. emergencia</Label>
                                <Input
                                    name="emergencyContactPhone"
                                    placeholder="+506 ..."
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                        </>
                    )}

                    {profileType === 'TRAINER' && (
                        <>
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <Label className="text-sm font-medium">Especialidad</Label>
                                <Input
                                    name="specialty"
                                    placeholder="Ej: Funcional, Yoga, Fuerza..."
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <Label className="text-sm font-medium">Biografia</Label>
                                <Textarea
                                    name="biography"
                                    placeholder="Breve descripcion..."
                                    className="bg-secondary/50 border-border min-h-[80px]"
                                />
                            </div>
                        </>
                    )}

                    {profileType === 'STAFF' && (
                        <div className="col-span-2 flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">Fecha de contratacion</Label>
                            <DateField
                                name="hiredAt"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                fromYear={2010}
                                inputClassName="bg-secondary/50 border-border"
                            />
                        </div>
                    )}

                    {!profileType && (
                        <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                            Selecciona un tipo de perfil para ver los campos.
                        </p>
                    )}

                    <DialogFooter className="col-span-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!profileType || createProfile.isPending}>
                            {createProfile.isPending ? 'Creando...' : 'Crear perfil'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
