import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dumbbell, Save, AlertCircle } from 'lucide-react';
import type { TrainerProfile } from '../types';

interface TrainerDetailSectionProps {
    profile?: TrainerProfile;
    isOwnProfile?: boolean;
    isSaving?: boolean;
    onSave?: () => void;
}

export function TrainerDetailSection({
    profile,
    isOwnProfile = false,
    isSaving = false,
    onSave,
}: TrainerDetailSectionProps) {
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
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs">Especialidad</Label>
                        {isOwnProfile ? (
                            <Input defaultValue={profile.specialty || ''} className="bg-secondary/50 border-border" />
                        ) : (
                            <p className="text-sm text-foreground h-9 flex items-center">{profile.specialty || '—'}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs">Biografia</Label>
                        {isOwnProfile ? (
                            <Textarea
                                defaultValue={profile.biography || ''}
                                className="bg-secondary/50 border-border min-h-[100px]"
                            />
                        ) : (
                            <p className="text-sm text-foreground h-9 flex items-center">{profile.biography || '—'}</p>
                        )}
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
