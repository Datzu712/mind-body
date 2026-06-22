import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Briefcase, Save, AlertCircle } from 'lucide-react';
import type { StaffProfile } from '../types';

interface StaffDetailSectionProps {
    profile?: StaffProfile;
    isOwnProfile?: boolean;
    isSaving?: boolean;
    onSave?: () => void;
}

export function StaffDetailSection({
    profile,
    isOwnProfile = false,
    isSaving = false,
    onSave,
}: StaffDetailSectionProps) {
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
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs">Fecha de contratacion</Label>
                        {isOwnProfile ? (
                            <Input
                                type="date"
                                defaultValue={profile.hiredAt}
                                className="bg-secondary/50 border-border"
                            />
                        ) : (
                            <p className="text-sm text-foreground h-9 flex items-center">{profile.hiredAt}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs">Estado</Label>
                        <p className="text-sm text-foreground h-9 flex items-center">
                            {profile.status === 'ACTIVE'
                                ? 'Activo'
                                : profile.status === 'INACTIVE'
                                  ? 'Inactivo'
                                  : 'Archivado'}
                        </p>
                    </div>
                    <div
                        className={`flex justify-end transition-all duration-300 ${isOwnProfile ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                    >
                        <Button type="button" onClick={onSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
