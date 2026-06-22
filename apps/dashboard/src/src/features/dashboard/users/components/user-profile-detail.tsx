import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Calendar, Shield, Pencil, X } from 'lucide-react';
import { sileo } from 'sileo';
import type { UserBase, ProfileType, KCRole } from '../types';
import { MemberDetailSection } from './member-detail-section';
import { TrainerDetailSection } from './trainer-detail-section';
import { StaffDetailSection } from './staff-detail-section';
import { mockMemberProfiles, mockTrainerProfiles, mockStaffProfiles } from '../mock-data';

interface UserProfileDetailProps {
    user: UserBase;
    profileType: ProfileType;
    isOwnProfile?: boolean;
}

const roleLabels: Record<KCRole, string> = {
    admin: 'Admin',
    trainer: 'Trainer',
    member: 'Member',
};

const statusLabels: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    ARCHIVED: 'Archivado',
};

const statusColors: Record<string, string> = {
    ACTIVE: 'border-success/30 bg-success/20 text-success',
    INACTIVE: 'border-border bg-muted/50 text-muted-foreground',
    ARCHIVED: 'border-warning/30 bg-warning/20 text-warning',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function UserProfileDetail({ user, profileType, isOwnProfile = false }: UserProfileDetailProps) {
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const editable = isOwnProfile || editing;

    const handleSave = () => {
        sileo.action({
            title: '¿Guardar los cambios?',
            description: 'Se actualizaran los datos del perfil.',
            button: {
                title: 'Confirmar',
                onClick: () => {
                    setIsSaving(true);
                    const savePromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));

                    sileo
                        .promise(savePromise, {
                            loading: { title: 'Guardando cambios...' },
                            success: { title: 'Cambios guardados exitosamente' },
                            error: { title: 'Error al guardar los cambios' },
                        })
                        .catch(console.error);

                    void savePromise.then(() => {
                        setEditing(false);
                        setIsSaving(false);
                    });
                },
            },
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Left column: User summary */}
            <Card className="border-border bg-card h-fit">
                <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                                {getInitials(user.fullName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                            <p className="text-lg font-semibold text-foreground">{user.fullName}</p>
                            <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
                        </div>
                        <Badge variant="outline" className={statusColors[user.status]}>
                            {statusLabels[user.status]}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-foreground">Informacion de contacto</p>
                        <dl className="flex flex-col gap-2.5 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <dd className="text-foreground">{user.email}</dd>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <dd className="text-foreground">{user.phone || '—'}</dd>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <dd className="text-muted-foreground">Registrado: {user.createdAt}</dd>
                            </div>
                        </dl>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            Roles (Keycloak)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {user.roles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                    {roleLabels[role]}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <>
                            <Separator />
                            {editing ? (
                                <Button
                                    variant="outline"
                                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setEditing(false)}
                                    disabled={isSaving}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar edicion
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setEditing(true)}
                                    disabled={isSaving}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar perfil
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Right column: Profile-specific section */}
            <div>
                {profileType === 'MEMBER' && (
                    <MemberDetailSection
                        profile={mockMemberProfiles.find((p) => p.userId === user.id)}
                        isOwnProfile={editable}
                        isSaving={isSaving}
                        onSave={handleSave}
                    />
                )}
                {profileType === 'TRAINER' && (
                    <TrainerDetailSection
                        profile={mockTrainerProfiles.find((p) => p.userId === user.id)}
                        isOwnProfile={editable}
                        isSaving={isSaving}
                        onSave={handleSave}
                    />
                )}
                {profileType === 'STAFF' && (
                    <StaffDetailSection
                        profile={mockStaffProfiles.find((p) => p.userId === user.id)}
                        isOwnProfile={editable}
                        isSaving={isSaving}
                        onSave={handleSave}
                    />
                )}
            </div>
        </div>
    );
}
