import { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Save, AlertCircle } from 'lucide-react';
import type { StaffProfile } from '../types';
import { ProfileField } from './profile-field';

interface StaffDetailSectionProps {
    profile?: StaffProfile;
    phone?: string | null;
    isOwnProfile?: boolean;
    isSaving?: boolean;
    onSave?: (data: { phone: string }) => void;
}

export function StaffDetailSection({
    profile,
    phone,
    isOwnProfile = false,
    isSaving = false,
    onSave,
}: StaffDetailSectionProps) {
    const uid = useId();
    const [phoneVal, setPhoneVal] = useState(phone ?? '');

    // Re-sync when the profile reloads (e.g. after a successful save).
    useEffect(() => {
        setPhoneVal(phone ?? '');
    }, [phone]);

    if (!profile) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No se encontro el perfil de staff.</p>
                </CardContent>
            </Card>
        );
    }

    const handleSave = () => onSave?.({ phone: phoneVal });

    return (
        <Card className={`transition-all duration-300 ${isOwnProfile ? 'edit-mode-card' : 'border-border bg-card'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Briefcase className="h-5 w-5" />
                    Perfil de Staff
                </CardTitle>
                {isOwnProfile && (
                    <Badge variant="outline" className="edit-mode-badge text-sm px-3 py-1">
                        Editando
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <ProfileField
                        id={`${uid}-phone`}
                        label="Telefono"
                        editing={isOwnProfile}
                        value={phoneVal}
                        onChange={setPhoneVal}
                        readonlyValue={phone}
                        placeholder="+52 55 ..."
                    />
                    <div
                        className={`flex justify-end transition-all duration-300 ${isOwnProfile ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                    >
                        <Button type="button" onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
