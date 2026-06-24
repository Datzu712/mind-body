import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Calendar, Cake, Pencil, X } from 'lucide-react';
import { sileo } from 'sileo';
import { hasChanges, formatDate, getInitials } from '@/lib/utils';
import type { UserDetail, ProfileType, DniType } from '../types';
import { ProfileGeneralTab, type GeneralFormValues } from './profile-general-tab';
import { MembershipCard } from './membership-card';
import { MemberProgressTab } from './progress/member-progress-tab';
import { useUpdateUser, useUpdateMemberProfile, useUpdateTrainerProfile } from '../hooks';

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

// Entering-tab fade (Radix unmounts the leaving tab, so only the entry is animated).
const tabContentAnim = 'animate-in fade-in-0 duration-300 ease-out';

export function UserProfileDetail({ user, profileType, isOwnProfile = false }: UserProfileDetailProps) {
    const [editing, setEditing] = useState(false);

    const updateUser = useUpdateUser(user.id);
    const updateMember = useUpdateMemberProfile(user.id);
    const updateTrainer = useUpdateTrainerProfile(user.id);

    const isSaving = updateUser.isPending || updateMember.isPending || updateTrainer.isPending;

    const handleGeneralSave = (v: GeneralFormValues) => {
        // Identity / contact changes go to the user; profile-specific changes to its
        // own endpoint. Collect the diffs so an unchanged field is never re-sent.
        const userPayload: { fullName?: string; phone?: string; dni?: string; dniType?: DniType; birthDate?: string } =
            {};
        if (v.fullName !== user.fullName) userPayload.fullName = v.fullName;
        if (v.phone !== (user.phone ?? '')) userPayload.phone = v.phone;
        if (v.dni !== (user.dni ?? '')) userPayload.dni = v.dni;
        if (v.dniType && v.dniType !== (user.dniType ?? '')) userPayload.dniType = v.dniType;
        if ((v.birthDate || '') !== (user.birthDate ?? '')) userPayload.birthDate = v.birthDate;

        let profileMutate: (() => Promise<unknown>) | null = null;
        if (profileType === 'MEMBER' && user.memberProfile) {
            const data = {
                emergencyContactName: v.emergencyContactName,
                emergencyContactPhone: v.emergencyContactPhone,
                notes: v.notes,
            };
            if (hasChanges(data, user.memberProfile)) profileMutate = () => updateMember.mutateAsync(data);
        } else if (profileType === 'TRAINER' && user.trainerProfile) {
            const data = { specialty: v.specialty, biography: v.biography };
            if (hasChanges(data, user.trainerProfile)) profileMutate = () => updateTrainer.mutateAsync(data);
        }

        const userChanged = Object.keys(userPayload).length > 0;
        if (!userChanged && !profileMutate) {
            sileo.warning({ title: 'No hay cambios para guardar' });
            return;
        }

        sileo.action({
            title: '¿Guardar los cambios?',
            description: 'Se actualizaran los datos del perfil.',
            button: {
                title: 'Confirmar',
                onClick: () => {
                    void (async () => {
                        try {
                            if (userChanged) await updateUser.mutateAsync(userPayload);
                            if (profileMutate) await profileMutate();
                            sileo.success({ title: 'Perfil actualizado' });
                            setEditing(false);
                        } catch (error) {
                            sileo.error({ title: 'Error al guardar', description: (error as Error).message });
                        }
                    })();
                },
            },
        });
    };

    const showMembershipTab = profileType === 'MEMBER';

    return (
        <Tabs defaultValue="general" className="w-full">
            {/* Tabs sit above both columns so the profile card and the data card top-align. */}
            {showMembershipTab && (
                <TabsList variant="line" className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="membership">Membresía</TabsTrigger>
                    <TabsTrigger value="progress">Progreso</TabsTrigger>
                </TabsList>
            )}
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Left: distinctive profile card (identity at a glance + edit toggle). */}
                <Card className="border-border bg-card h-fit">
                    <CardContent className="flex flex-col gap-4 p-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <Avatar className="h-20 w-20">
                                <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                                    {getInitials(user.fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-lg font-semibold text-foreground">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground">{profileTypeLabels[profileType]}</p>
                            </div>
                            <Badge variant="outline" className={statusColors[user.status]}>
                                {statusLabels[user.status]}
                            </Badge>
                        </div>

                        <Separator />

                        <dl className="flex flex-col gap-2.5 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <dd className="truncate text-foreground">{user.email || '—'}</dd>
                            </div>
                            {user.birthDate && (
                                <div className="flex items-center gap-2">
                                    <Cake className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <dd className="text-foreground">{formatDate(user.birthDate)}</dd>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
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

                {/* Right: tab content — General (the 2-col grid) or Membresía. */}
                <div className="min-w-0">
                    {/* Subtle fade-in on tab switch — Radix unmounts the inactive tab,
                        so animating the entering content is what gives the smooth feel. */}
                    <TabsContent value="general" className={tabContentAnim}>
                        {/* Remount per edit session so cancelling discards unsaved local edits. */}
                        <ProfileGeneralTab
                            key={editing ? 'editing' : 'view'}
                            user={user}
                            profileType={profileType}
                            editing={editing}
                            isSaving={isSaving}
                            onSave={handleGeneralSave}
                        />
                    </TabsContent>

                    {showMembershipTab && (
                        <TabsContent value="membership" className={tabContentAnim}>
                            <MembershipCard membership={user.memberProfile?.activeMembership} />
                        </TabsContent>
                    )}

                    {showMembershipTab && (
                        <TabsContent value="progress" className={tabContentAnim}>
                            <MemberProgressTab userId={user.id} />
                        </TabsContent>
                    )}
                </div>
            </div>
        </Tabs>
    );
}

const profileTypeLabels: Record<ProfileType, string> = {
    MEMBER: 'Miembro',
    TRAINER: 'Entrenador',
    STAFF: 'Staff',
};
