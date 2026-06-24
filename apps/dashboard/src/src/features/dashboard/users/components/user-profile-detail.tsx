import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Calendar, Cake, Pencil, X } from 'lucide-react';
import { sileo } from 'sileo';
import { hasChanges, formatDate, getInitials } from '@/lib/utils';
import type { UserDetail, ProfileType } from '../types';
import { MemberDetailSection } from './member-detail-section';
import { TrainerDetailSection } from './trainer-detail-section';
import { StaffDetailSection } from './staff-detail-section';
import { useUpdateUser, useUpdateMemberProfile, useUpdateTrainerProfile, useUpdateStaffProfile } from '../hooks';

interface UserProfileDetailProps {
    user: UserDetail;
    profileType: ProfileType;
    isOwnProfile?: boolean;
}

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

export function UserProfileDetail({ user, profileType, isOwnProfile = false }: UserProfileDetailProps) {
    const [editing, setEditing] = useState(false);
    const editable = isOwnProfile || editing;

    const updateUser = useUpdateUser(user.id);
    const updateMember = useUpdateMemberProfile(user.id);
    const updateTrainer = useUpdateTrainerProfile(user.id);
    const updateStaff = useUpdateStaffProfile(user.id);

    const isSaving = updateUser.isPending || updateMember.isPending || updateTrainer.isPending || updateStaff.isPending;

    const runSave = (opts: {
        label: string;
        phone: string;
        profileChanged: boolean;
        profileMutate?: (cb: { onSuccess: () => void; onError: (e: Error) => void }) => void;
    }) => {
        const phoneChanged = opts.phone !== (user.phone || '');
        if (!phoneChanged && !opts.profileChanged) {
            sileo.warning({ title: 'No hay cambios para guardar' });
            return;
        }
        sileo.action({
            title: '¿Guardar los cambios?',
            description: 'Se actualizaran los datos del perfil.',
            button: {
                title: 'Confirmar',
                onClick: () => {
                    const onError = (error: Error) => {
                        sileo.error({ title: 'Error al guardar', description: error.message });
                    };
                    const done = () => {
                        sileo.success({ title: `${opts.label} actualizado` });
                        setEditing(false);
                    };

                    // Send the raw value (including '') so a cleared field is actually saved.
                    if (phoneChanged) {
                        updateUser.mutate({ phone: opts.phone }, { onSuccess: () => {}, onError });
                    }
                    if (opts.profileChanged && opts.profileMutate) {
                        opts.profileMutate({ onSuccess: done, onError });
                    } else {
                        done();
                    }
                },
            },
        });
    };

    const handleMemberSave = (v: { phone: string; emergencyContactName: string; emergencyContactPhone: string }) => {
        const profileChanged =
            !!user.memberProfile &&
            hasChanges(
                { emergencyContactName: v.emergencyContactName, emergencyContactPhone: v.emergencyContactPhone },
                user.memberProfile,
            );
        runSave({
            label: 'Perfil de miembro',
            phone: v.phone,
            profileChanged,
            profileMutate: (cb) =>
                updateMember.mutate(
                    { emergencyContactName: v.emergencyContactName, emergencyContactPhone: v.emergencyContactPhone },
                    cb,
                ),
        });
    };

    const handleTrainerSave = (v: { phone: string; specialty: string; biography: string }) => {
        const profileChanged =
            !!user.trainerProfile &&
            hasChanges({ specialty: v.specialty, biography: v.biography }, user.trainerProfile);
        runSave({
            label: 'Perfil de entrenador',
            phone: v.phone,
            profileChanged,
            profileMutate: (cb) => updateTrainer.mutate({ specialty: v.specialty, biography: v.biography }, cb),
        });
    };

    const handleStaffSave = (v: { phone: string }) => {
        runSave({ label: 'Perfil de staff', phone: v.phone, profileChanged: false });
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
                        </div>
                        <Badge variant="outline" className={statusColors[user.status]}>
                            {statusLabels[user.status]}
                        </Badge>
                    </div>

                    <Separator />

                    <dl className="flex flex-col gap-2.5 text-sm">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <dd className="text-foreground">{user.email || '—'}</dd>
                        </div>
                        {user.birthDate && (
                            <div className="flex items-center gap-2">
                                <Cake className="h-4 w-4 text-muted-foreground" />
                                <dd className="text-foreground">{formatDate(user.birthDate)}</dd>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <dd className="text-muted-foreground">
                                {profileType === 'MEMBER' && user.memberProfile
                                    ? `Ingreso: ${formatDate(user.memberProfile.joinedAt)}`
                                    : profileType === 'STAFF' && user.staffProfile
                                      ? `Contratado: ${formatDate(user.staffProfile.hiredAt)}`
                                      : `Registro: ${formatDate(user.createdAt)}`}
                            </dd>
                        </div>
                    </dl>

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
                        profile={user.memberProfile}
                        phone={user.phone}
                        isOwnProfile={editable}
                        isSaving={isSaving}
                        onSave={handleMemberSave}
                    />
                )}
                {profileType === 'TRAINER' && (
                    <TrainerDetailSection
                        profile={user.trainerProfile}
                        phone={user.phone}
                        isOwnProfile={editable}
                        isSaving={isSaving}
                        onSave={handleTrainerSave}
                    />
                )}
                {profileType === 'STAFF' && (
                    <StaffDetailSection
                        profile={user.staffProfile}
                        phone={user.phone}
                        isOwnProfile={editable}
                        isSaving={isSaving}
                        onSave={handleStaffSave}
                    />
                )}
            </div>
        </div>
    );
}
