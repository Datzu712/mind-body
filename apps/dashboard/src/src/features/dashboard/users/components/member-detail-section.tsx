import { useEffect, useId, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { IdCard, Save, UserRound, AlertCircle, RefreshCw } from 'lucide-react';
import { sileo } from 'sileo';
import type { MemberProfile } from '../types';

interface MemberDetailSectionProps {
    profile?: MemberProfile;
    phone?: string | null;
    isOwnProfile?: boolean;
    isSaving?: boolean;
    onSave?: (data: { phone: string; emergencyContactName: string; emergencyContactPhone: string }) => void;
}

const membershipStatusLabels: Record<string, string> = {
    ACTIVE: 'Activa',
    SUSPENDED: 'Suspendida',
    EXPIRED: 'Vencida',
};

const membershipStatusColors: Record<string, string> = {
    ACTIVE: 'border-success/30 bg-success/20 text-success',
    SUSPENDED: 'border-warning/30 bg-warning/20 text-warning',
    EXPIRED: 'border-destructive/30 bg-destructive/20 text-destructive',
};

export function MemberDetailSection({
    profile,
    phone,
    isOwnProfile = false,
    isSaving = false,
    onSave,
}: MemberDetailSectionProps) {
    const uid = useId();
    const [phoneVal, setPhoneVal] = useState(phone ?? '');
    const [ecName, setEcName] = useState(profile?.emergencyContactName ?? '');
    const [ecPhone, setEcPhone] = useState(profile?.emergencyContactPhone ?? '');

    // Re-sync local fields when the profile reloads (e.g. after a successful save).
    useEffect(() => {
        setPhoneVal(phone ?? '');
        setEcName(profile?.emergencyContactName ?? '');
        setEcPhone(profile?.emergencyContactPhone ?? '');
    }, [phone, profile?.emergencyContactName, profile?.emergencyContactPhone]);

    if (!profile) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No se encontro el perfil de miembro.</p>
                </CardContent>
            </Card>
        );
    }

    const handleSave = () =>
        onSave?.({ phone: phoneVal, emergencyContactName: ecName, emergencyContactPhone: ecPhone });

    return (
        <div className="flex flex-col gap-6">
            {/* Personal info */}
            <Card
                className={`transition-all duration-300 ${isOwnProfile ? 'edit-mode-card' : 'border-border bg-card'}`}
            >
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <UserRound className="h-5 w-5" />
                        Informacion personal
                    </CardTitle>
                    {isOwnProfile && (
                        <Badge variant="outline" className="edit-mode-badge text-sm px-3 py-1">
                            Editando
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-phone`} className="text-muted-foreground text-xs">
                                Telefono
                            </Label>
                            {isOwnProfile ? (
                                <Input
                                    id={`${uid}-phone`}
                                    value={phoneVal}
                                    onChange={(e) => setPhoneVal(e.target.value)}
                                    placeholder="+52 55 ..."
                                    className="bg-secondary/50 border-border"
                                />
                            ) : (
                                <p className="text-sm text-foreground h-9 flex items-center">{phone || '—'}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-emergencyName`} className="text-muted-foreground text-xs">
                                Contacto de emergencia
                            </Label>
                            {isOwnProfile ? (
                                <Input
                                    id={`${uid}-emergencyName`}
                                    value={ecName}
                                    onChange={(e) => setEcName(e.target.value)}
                                    className="bg-secondary/50 border-border"
                                />
                            ) : (
                                <p className="text-sm text-foreground h-9 flex items-center">
                                    {profile.emergencyContactName || '—'}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-emergencyPhone`} className="text-muted-foreground text-xs">
                                Telefono de emergencia
                            </Label>
                            {isOwnProfile ? (
                                <Input
                                    id={`${uid}-emergencyPhone`}
                                    value={ecPhone}
                                    onChange={(e) => setEcPhone(e.target.value)}
                                    className="bg-secondary/50 border-border"
                                />
                            ) : (
                                <p className="text-sm text-foreground h-9 flex items-center">
                                    {profile.emergencyContactPhone || '—'}
                                </p>
                            )}
                        </div>
                        {profile.notes && (
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <Label className="text-muted-foreground text-xs">Notas</Label>
                                <p className="text-sm text-foreground h-9 flex items-center">{profile.notes}</p>
                            </div>
                        )}
                    </div>
                    <div
                        className={`flex justify-end mt-4 transition-all duration-300 ${isOwnProfile ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                    >
                        <Button type="button" onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Membership */}
            <MembershipCard membership={profile.activeMembership} />
        </div>
    );
}

function MembershipCard({ membership }: { membership?: MemberProfile['activeMembership'] }) {
    const uid = useId();
    const [renewOpen, setRenewOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duration, setDuration] = useState('30');

    const handleRenew = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const renewPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
        sileo
            .promise(renewPromise, {
                loading: { title: 'Procesando renovacion...' },
                success: { title: `Membresia extendida ${duration} dias` },
                error: { title: 'Error al renovar la membresia' },
            })
            .catch(console.error);
        void renewPromise.then(() => {
            setRenewOpen(false);
            setIsSubmitting(false);
        });
    };

    return (
        <>
            <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <IdCard className="h-5 w-5" />
                        Membresia
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renovar
                    </Button>
                </CardHeader>
                <CardContent>
                    {membership ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{membership.planName}</span>
                                <Badge variant="outline" className={membershipStatusColors[membership.status]}>
                                    {membershipStatusLabels[membership.status]}
                                </Badge>
                            </div>
                            <Separator />
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Inicio</dt>
                                    <dd className="text-foreground">{formatDate(membership.startDate)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Vencimiento</dt>
                                    <dd className="text-foreground">{formatDate(membership.endDate)}</dd>
                                </div>
                            </dl>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Sin membresia activa.</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Renovar membresia</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Extiende la membresia del miembro tras confirmar el pago en recepcion.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRenew} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-duration`} className="text-sm font-medium">
                                Duracion
                            </Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger id={`${uid}-duration`} className="bg-secondary/50 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="30">1 mes (30 dias)</SelectItem>
                                    <SelectItem value="90">3 meses (90 dias)</SelectItem>
                                    <SelectItem value="180">6 meses (180 dias)</SelectItem>
                                    <SelectItem value="365">1 año (365 dias)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-payment`} className="text-sm font-medium">
                                Metodo de pago
                            </Label>
                            <Input
                                id={`${uid}-payment`}
                                placeholder="Ej: Efectivo, Tarjeta, Transferencia..."
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-notes`} className="text-sm font-medium">
                                Notas (opcional)
                            </Label>
                            <Input
                                id={`${uid}-notes`}
                                placeholder="Observaciones del pago..."
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRenewOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                Confirmar renovacion
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
