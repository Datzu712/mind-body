import { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, UserRound, AlertCircle } from 'lucide-react';
import type { MemberProfile } from '../types';
import { ProfileField } from './profile-field';
import { MembershipCard } from './membership-card';

interface MemberDetailSectionProps {
    profile?: MemberProfile;
    phone?: string | null;
    isOwnProfile?: boolean;
    isSaving?: boolean;
    onSave?: (data: { phone: string; emergencyContactName: string; emergencyContactPhone: string }) => void;
}

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
                        <ProfileField
                            id={`${uid}-phone`}
                            label="Telefono"
                            editing={isOwnProfile}
                            value={phoneVal}
                            onChange={setPhoneVal}
                            readonlyValue={phone}
                            placeholder="+52 55 ..."
                        />
                        <ProfileField
                            id={`${uid}-emergencyName`}
                            label="Contacto de emergencia"
                            editing={isOwnProfile}
                            value={ecName}
                            onChange={setEcName}
                            readonlyValue={profile.emergencyContactName}
                        />
                        <ProfileField
                            id={`${uid}-emergencyPhone`}
                            label="Telefono de emergencia"
                            editing={isOwnProfile}
                            value={ecPhone}
                            onChange={setEcPhone}
                            readonlyValue={profile.emergencyContactPhone}
                        />
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
