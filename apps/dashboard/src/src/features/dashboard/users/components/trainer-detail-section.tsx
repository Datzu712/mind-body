import { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Save, AlertCircle } from 'lucide-react';
import type { TrainerProfile } from '../types';
import { ProfileField } from './profile-field';

interface TrainerDetailSectionProps {
    profile?: TrainerProfile;
    phone?: string | null;
    isOwnProfile?: boolean;
    isSaving?: boolean;
    onSave?: (data: { phone: string; specialty: string; biography: string }) => void;
}

export function TrainerDetailSection({
    profile,
    phone,
    isOwnProfile = false,
    isSaving = false,
    onSave,
}: TrainerDetailSectionProps) {
    const uid = useId();
    const [phoneVal, setPhoneVal] = useState(phone ?? '');
    const [specialty, setSpecialty] = useState(profile?.specialty ?? '');
    const [biography, setBiography] = useState(profile?.biography ?? '');

    // Re-sync local fields when the profile reloads (e.g. after a successful save).
    useEffect(() => {
        setPhoneVal(phone ?? '');
        setSpecialty(profile?.specialty ?? '');
        setBiography(profile?.biography ?? '');
    }, [phone, profile?.specialty, profile?.biography]);

    if (!profile) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No se encontro el perfil de entrenador.</p>
                </CardContent>
            </Card>
        );
    }

    const handleSave = () => onSave?.({ phone: phoneVal, specialty, biography });

    return (
        <Card className={`transition-all duration-300 ${isOwnProfile ? 'edit-mode-card' : 'border-border bg-card'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Dumbbell className="h-5 w-5" />
                    Perfil de Entrenador
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
                    <ProfileField
                        id={`${uid}-specialty`}
                        label="Especialidad"
                        editing={isOwnProfile}
                        value={specialty}
                        onChange={setSpecialty}
                        readonlyValue={profile.specialty}
                    />
                    <ProfileField
                        id={`${uid}-biography`}
                        label="Biografia"
                        editing={isOwnProfile}
                        value={biography}
                        onChange={setBiography}
                        readonlyValue={profile.biography}
                        multiline
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
