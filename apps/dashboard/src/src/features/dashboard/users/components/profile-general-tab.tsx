import { useEffect, useId, useState } from 'react';
import { sileo } from 'sileo';
import { Dumbbell, IdCard, Loader2, RefreshCw, Save, ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateField } from '@/components/ui/date-field';
import { formatDate } from '@/lib/utils';
import type { DniType, ProfileType, UserDetail } from '../types';
import { useTseLookup } from '../hooks';
import { ProfileField } from './profile-field';

const DNI_TYPE_LABELS: Record<DniType, string> = {
    CEDULA_NACIONAL: 'Cédula Nacional',
    DIMEX: 'DIMEX',
    PASAPORTE: 'Pasaporte',
};

export interface GeneralFormValues {
    fullName: string;
    dni: string;
    dniType: DniType | '';
    birthDate: string;
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    notes: string;
    specialty: string;
    biography: string;
}

/** Format raw cédula digits into the canonical `0-0000-0000` display form. */
function formatCedula(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    return [digits.slice(0, 1), digits.slice(1, 5), digits.slice(5, 9)].filter(Boolean).join('-');
}

function dniForDisplay(dni: string | null, dniType: DniType | null): string {
    if (!dni) return '';
    return dniType === 'CEDULA_NACIONAL' ? formatCedula(dni) : dni;
}

/** Raw cédula a record's name/DOB are TSE-verified against, or '' if not a cédula. */
function syncedCedulaOf(user: UserDetail): string {
    return user.dniType === 'CEDULA_NACIONAL' ? (user.dni ?? '').replace(/\D/g, '') : '';
}

/** Section divider: icon chip + title + hairline rule. Gives the form structure. */
function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <span className="h-px flex-1 bg-border" />
        </div>
    );
}

interface ProfileGeneralTabProps {
    user: UserDetail;
    profileType: ProfileType;
    /** When true the fields become editable; otherwise they render read-only. */
    editing: boolean;
    isSaving: boolean;
    onSave: (values: GeneralFormValues) => void;
}

/**
 * The "General" tab: the user's identity (document type, DNI, name, birth date —
 * TSE-driven for a national ID), contact, and profile-specific fields, grouped
 * into titled sections and saved with one action.
 */
export function ProfileGeneralTab({ user, profileType, editing, isSaving, onSave }: ProfileGeneralTabProps) {
    const uid = useId();
    const { memberProfile, trainerProfile } = user;

    const [dniType, setDniType] = useState<DniType | ''>(user.dniType ?? '');
    const [dni, setDni] = useState(() => dniForDisplay(user.dni, user.dniType));
    const [fullName, setFullName] = useState(user.fullName);
    const [birthDate, setBirthDate] = useState(user.birthDate ?? '');
    const [phone, setPhone] = useState(user.phone ?? '');
    const [emergencyContactName, setEcName] = useState(memberProfile?.emergencyContactName ?? '');
    const [emergencyContactPhone, setEcPhone] = useState(memberProfile?.emergencyContactPhone ?? '');
    const [notes, setNotes] = useState(memberProfile?.notes ?? '');
    const [specialty, setSpecialty] = useState(trainerProfile?.specialty ?? '');
    const [biography, setBiography] = useState(trainerProfile?.biography ?? '');
    // The cédula the current name/DOB are TSE-verified against; editing past it makes them stale.
    const [tseSyncedFor, setTseSyncedFor] = useState(() => syncedCedulaOf(user));

    const rawDni = dni.replace(/\D/g, '');
    const tseLookup = useTseLookup(rawDni);
    const isCedula = dniType === 'CEDULA_NACIONAL';
    const cedulaNeedsSync = isCedula && rawDni !== tseSyncedFor;

    // Re-sync local state when the user reloads (e.g. after a successful save).
    useEffect(() => {
        setDniType(user.dniType ?? '');
        setDni(dniForDisplay(user.dni, user.dniType));
        setFullName(user.fullName);
        setBirthDate(user.birthDate ?? '');
        setPhone(user.phone ?? '');
        setEcName(memberProfile?.emergencyContactName ?? '');
        setEcPhone(memberProfile?.emergencyContactPhone ?? '');
        setNotes(memberProfile?.notes ?? '');
        setSpecialty(trainerProfile?.specialty ?? '');
        setBiography(trainerProfile?.biography ?? '');
        setTseSyncedFor(syncedCedulaOf(user));
    }, [
        user.dniType,
        user.dni,
        user.fullName,
        user.birthDate,
        user.phone,
        memberProfile?.emergencyContactName,
        memberProfile?.emergencyContactPhone,
        memberProfile?.notes,
        trainerProfile?.specialty,
        trainerProfile?.biography,
    ]);

    const handleDniTypeChange = (next: DniType) => {
        setDniType(next);
        setDni((cur) => (next === 'CEDULA_NACIONAL' ? formatCedula(cur) : cur.replace(/-/g, '')));
    };

    const handleDniChange = (raw: string) => setDni(isCedula ? formatCedula(raw) : raw);

    const handleSyncTse = async () => {
        if (!rawDni) return;
        const { data, error } = await tseLookup.refetch();
        if (error || !data) {
            sileo.error({
                title: 'Cédula no encontrada',
                description: 'No se encontraron datos en el TSE para esta cédula.',
            });
            return;
        }
        setFullName(data.fullName);
        setBirthDate(data.dateOfBirth);
        setTseSyncedFor(rawDni);
        sileo.success({ title: 'Datos sincronizados con el TSE' });
    };

    const handleSave = () => {
        if (cedulaNeedsSync) {
            sileo.warning({
                title: 'Sincronizá con el TSE',
                description: 'Cambiaste el número de cédula. Sincronizá para actualizar nombre y fecha de nacimiento.',
            });
            return;
        }
        onSave({
            fullName: fullName.trim(),
            dni: isCedula ? rawDni : dni.trim(),
            dniType,
            birthDate,
            phone,
            emergencyContactName,
            emergencyContactPhone,
            notes,
            specialty,
            biography,
        });
    };

    return (
        <Card className={`transition-all duration-300 ${editing ? 'edit-mode-card' : 'border-border bg-card'}`}>
            <CardHeader>
                <CardTitle>Información del perfil</CardTitle>
                {editing && (
                    <CardAction>
                        <Badge variant="outline" className="edit-mode-badge">
                            Editando
                        </Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="flex flex-col gap-7">
                {/* Identificación */}
                <section className="flex flex-col gap-4">
                    <SectionHeader icon={IdCard} title="Identificación" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Tipo de documento */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-dniType`} className="text-muted-foreground text-xs">
                                Tipo de documento
                            </Label>
                            {editing ? (
                                <Select value={dniType} onValueChange={(v) => handleDniTypeChange(v as DniType)}>
                                    <SelectTrigger
                                        id={`${uid}-dniType`}
                                        className="w-full bg-secondary/50 border-border"
                                    >
                                        <SelectValue placeholder="Seleccionar tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        <SelectItem value="CEDULA_NACIONAL">Cédula Nacional</SelectItem>
                                        <SelectItem value="DIMEX">DIMEX</SelectItem>
                                        <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-sm text-foreground h-9 flex items-center">
                                    {user.dniType ? DNI_TYPE_LABELS[user.dniType] : '—'}
                                </p>
                            )}
                        </div>

                        {/* Número de documento */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${uid}-dni`} className="text-muted-foreground text-xs">
                                Número de documento
                            </Label>
                            {editing ? (
                                <Input
                                    id={`${uid}-dni`}
                                    value={dni}
                                    onChange={(e) => handleDniChange(e.target.value)}
                                    maxLength={isCedula ? 11 : 20}
                                    placeholder={isCedula ? '0-0000-0000' : 'Número de documento'}
                                    className="bg-secondary/50 border-border"
                                />
                            ) : (
                                <p className="text-sm text-foreground h-9 flex items-center">
                                    {dniForDisplay(user.dni, user.dniType) || '—'}
                                </p>
                            )}
                        </div>

                        {/* Teléfono — único campo de contacto editable (el email es read-only y va en el profile card). */}
                        <ProfileField
                            id={`${uid}-phone`}
                            label="Teléfono"
                            editing={editing}
                            value={phone}
                            onChange={setPhone}
                            readonlyValue={user.phone}
                            placeholder="+506 ..."
                        />

                        {/* Nombre y fecha solo si NO es cédula. Para cédula vienen del TSE y se
                            muestran en el profile card / en la línea de verificación de abajo. */}
                        {!isCedula && (
                            <>
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <Label htmlFor={`${uid}-fullName`} className="text-muted-foreground text-xs">
                                        Nombre completo
                                    </Label>
                                    {editing ? (
                                        <Input
                                            id={`${uid}-fullName`}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Nombre completo"
                                            className="bg-secondary/50 border-border"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground h-9 flex items-center">
                                            {user.fullName || '—'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor={`${uid}-birthDate`} className="text-muted-foreground text-xs">
                                        Fecha de nacimiento
                                    </Label>
                                    {editing ? (
                                        <DateField
                                            id={`${uid}-birthDate`}
                                            value={birthDate}
                                            onChange={setBirthDate}
                                            disableFuture
                                            inputClassName="bg-secondary/50 border-border"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground h-9 flex items-center">
                                            {formatDate(user.birthDate)}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cédula en edición: acción de sincronizar + match del TSE (en vez de los dos campos). */}
                    {editing && isCedula && (
                        <div
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                                cedulaNeedsSync ? 'border-warning/30 bg-warning/10' : 'border-border bg-secondary/30'
                            }`}
                        >
                            <Button
                                type="button"
                                size="sm"
                                variant={cedulaNeedsSync ? 'default' : 'outline'}
                                onClick={() => void handleSyncTse()}
                                disabled={!rawDni || tseLookup.isFetching}
                            >
                                {tseLookup.isFetching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                <span className="ml-2">Sincronizar</span>
                            </Button>
                            <div className="min-w-0 flex-1">
                                {cedulaNeedsSync ? (
                                    <span className="text-warning">
                                        Sincronizá para traer el nombre y la fecha de nacimiento.
                                    </span>
                                ) : fullName ? (
                                    <span className="flex items-center gap-1.5 truncate">
                                        <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                                        <span className="truncate font-medium text-foreground">{fullName}</span>
                                        {birthDate && (
                                            <span className="shrink-0 text-muted-foreground">
                                                · {formatDate(birthDate)}
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Sincronizá la cédula con el TSE para traer los datos.
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Contacto de emergencia (member) */}
                {profileType === 'MEMBER' && (
                    <section className="flex flex-col gap-4">
                        <SectionHeader icon={ShieldAlert} title="Contacto de emergencia" />
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <ProfileField
                                    id={`${uid}-ecName`}
                                    label="Nombre"
                                    editing={editing}
                                    value={emergencyContactName}
                                    onChange={setEcName}
                                    readonlyValue={memberProfile?.emergencyContactName}
                                />
                            </div>
                            <ProfileField
                                id={`${uid}-ecPhone`}
                                label="Teléfono"
                                editing={editing}
                                value={emergencyContactPhone}
                                onChange={setEcPhone}
                                readonlyValue={memberProfile?.emergencyContactPhone}
                            />
                            <div className="md:col-span-3">
                                <ProfileField
                                    id={`${uid}-notes`}
                                    label="Notas"
                                    editing={editing}
                                    value={notes}
                                    onChange={setNotes}
                                    readonlyValue={memberProfile?.notes}
                                    multiline
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* Información profesional (trainer) */}
                {profileType === 'TRAINER' && (
                    <section className="flex flex-col gap-4">
                        <SectionHeader icon={Dumbbell} title="Información profesional" />
                        <div className="grid gap-4">
                            <ProfileField
                                id={`${uid}-specialty`}
                                label="Especialidad"
                                editing={editing}
                                value={specialty}
                                onChange={setSpecialty}
                                readonlyValue={trainerProfile?.specialty}
                            />
                            <ProfileField
                                id={`${uid}-biography`}
                                label="Biografía"
                                editing={editing}
                                value={biography}
                                onChange={setBiography}
                                readonlyValue={trainerProfile?.biography}
                                multiline
                            />
                        </div>
                    </section>
                )}

                {editing && (
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleSave} disabled={isSaving || cedulaNeedsSync}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar cambios
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
