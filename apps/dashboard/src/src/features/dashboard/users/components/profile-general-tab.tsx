import { useEffect, useId, useRef, useState } from 'react';
import { sileo } from 'sileo';
import { Dumbbell, IdCard, Loader2, Save, ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateField } from '@/components/ui/date-field';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { DniType, ProfileType, UserDetail } from '../types';
import { useTseLookup } from '../hooks';
import { useDebouncedValue } from '../use-debounced-value';
import { ProfileField } from './profile-field';

const DNI_TYPE_LABELS: Record<DniType, string> = {
    CEDULA_NACIONAL: 'Cédula Nacional',
    DIMEX: 'DIMEX',
    PASAPORTE: 'Pasaporte',
};

const LOOKUP_DEBOUNCE_MS = 600;

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

/** Raw cédula a record's name/DOB are registry-verified against, or '' if not a cédula. */
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

/** Editable/read-only name + birth date pair. Used for non-national docs and the
 *  manual fallback when the registry has no record for a cédula. */
function NameDobInputs({
    uid,
    editing,
    fullName,
    onFullName,
    birthDate,
    onBirthDate,
    viewName,
    viewBirthDate,
}: {
    uid: string;
    editing: boolean;
    fullName: string;
    onFullName: (v: string) => void;
    birthDate: string;
    onBirthDate: (v: string) => void;
    viewName: string | null;
    viewBirthDate: string | null;
}) {
    return (
        <>
            <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor={`${uid}-fullName`} className="text-muted-foreground text-xs">
                    Nombre completo
                </Label>
                {editing ? (
                    <Input
                        id={`${uid}-fullName`}
                        value={fullName}
                        onChange={(e) => onFullName(e.target.value)}
                        placeholder="Nombre completo"
                        className="bg-secondary/50 border-border"
                    />
                ) : (
                    <p className="text-sm text-foreground h-9 flex items-center">{viewName || '—'}</p>
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
                        onChange={onBirthDate}
                        disableFuture
                        inputClassName="bg-secondary/50 border-border"
                    />
                ) : (
                    <p className="text-sm text-foreground h-9 flex items-center">{formatDate(viewBirthDate)}</p>
                )}
            </div>
        </>
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
 * registry-driven for a national ID via TSE/Padrón), contact, and profile-specific
 * fields, grouped into titled sections and saved with one action.
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

    // Registry resolution state. An existing cédula record is assumed already
    // verified, so opening the editor does NOT re-trigger a lookup.
    const initCedula = syncedCedulaOf(user);
    const [identitySource, setIdentitySource] = useState<'TSE' | 'PADRON' | null>(
        user.dniType === 'CEDULA_NACIONAL' && user.dni ? (user.birthDate ? 'TSE' : 'PADRON') : null,
    );
    const [registryDobProvided, setRegistryDobProvided] = useState(Boolean(user.birthDate));
    const [resolvedCedula, setResolvedCedula] = useState(initCedula);
    const [lookupFailed, setLookupFailed] = useState(false);

    const rawDni = dni.replace(/\D/g, '');
    const isCedula = dniType === 'CEDULA_NACIONAL';
    const tseLookup = useTseLookup(rawDni);
    const debouncedDni = useDebouncedValue(rawDni, LOOKUP_DEBOUNCE_MS);

    // `refetch` read through a ref so the lookup effect needn't depend on the
    // unstable query object (TanStack Query returns a new object each render).
    const refetchRef = useRef(tseLookup.refetch);
    refetchRef.current = tseLookup.refetch;

    // `resolvedCedula` is read inside the lookup effect but must not be a dependency
    // (it would re-run the effect after we set it). A ref keeps it fresh.
    const resolvedCedulaRef = useRef(resolvedCedula);
    resolvedCedulaRef.current = resolvedCedula;

    const nameLocked = editing && isCedula && identitySource !== null;
    const dobLocked = nameLocked && registryDobProvided;
    const dobRequired = nameLocked && !registryDobProvided;
    const missingRequiredDob = dobRequired && !birthDate.trim();
    const awaitingResolution = isCedula && rawDni.length === 9 && identitySource === null && !lookupFailed;

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
        setIdentitySource(user.dniType === 'CEDULA_NACIONAL' && user.dni ? (user.birthDate ? 'TSE' : 'PADRON') : null);
        setRegistryDobProvided(Boolean(user.birthDate));
        setResolvedCedula(syncedCedulaOf(user));
        setLookupFailed(false);
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

    // Auto-lookup: when a complete, unseen cédula settles, query the registry.
    useEffect(() => {
        if (!editing || !isCedula) return;
        if (debouncedDni.length !== 9 || debouncedDni === resolvedCedulaRef.current) return;

        let cancelled = false;
        void (async () => {
            const { data, error } = await refetchRef.current();
            if (cancelled) return;

            if (error || !data) {
                setIdentitySource(null);
                setRegistryDobProvided(false);
                setResolvedCedula(debouncedDni);
                setLookupFailed(true);
                const notFound = error instanceof ApiError && error.status === 404;
                sileo.error(
                    notFound
                        ? {
                              title: 'Cédula no encontrada',
                              description: 'No está en el registro nacional. Podés ingresar los datos manualmente.',
                          }
                        : {
                              title: 'Registro nacional no disponible',
                              description: 'No se pudo consultar. Podés ingresar los datos manualmente.',
                          },
                );
                return;
            }

            const source = data.source ?? 'TSE';
            setFullName(data.fullName);
            setBirthDate(data.dateOfBirth || '');
            setIdentitySource(source);
            setRegistryDobProvided(Boolean(data.dateOfBirth));
            setResolvedCedula(debouncedDni);
            setLookupFailed(false);
            if (source === 'PADRON') {
                sileo.info({
                    title: 'Datos del padrón',
                    description: 'El padrón no incluye la fecha de nacimiento. Completala para continuar.',
                });
            }
        })();

        return () => {
            cancelled = true;
        };
        // resolvedCedula is intentionally read via ref, not listed as a dependency.
    }, [debouncedDni, editing, isCedula]);

    const handleDniTypeChange = (next: DniType) => {
        setDniType(next);
        setDni((cur) => (next === 'CEDULA_NACIONAL' ? formatCedula(cur) : cur.replace(/-/g, '')));
        // Switching document type discards any prior registry resolution.
        setIdentitySource(null);
        setRegistryDobProvided(false);
        setResolvedCedula('');
        setLookupFailed(false);
    };

    const handleDniChange = (raw: string) => setDni(isCedula ? formatCedula(raw) : raw);

    const handleSave = () => {
        if (tseLookup.isFetching || awaitingResolution) {
            sileo.warning({
                title: 'Esperá la verificación',
                description: 'Estamos consultando el registro nacional para esa cédula.',
            });
            return;
        }
        if (missingRequiredDob) {
            sileo.warning({
                title: 'Falta la fecha de nacimiento',
                description: 'El padrón no la incluye; ingresala para guardar.',
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

    const badgeLabel = identitySource === 'PADRON' ? 'Padrón' : 'TSE';

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
                                <div className="relative">
                                    <Input
                                        id={`${uid}-dni`}
                                        value={dni}
                                        onChange={(e) => handleDniChange(e.target.value)}
                                        maxLength={isCedula ? 11 : 20}
                                        placeholder={isCedula ? '0-0000-0000' : 'Número de documento'}
                                        className="bg-secondary/50 border-border"
                                    />
                                    {isCedula && tseLookup.isFetching && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-foreground h-9 flex items-center">
                                    {dniForDisplay(user.dni, user.dniType) || '—'}
                                </p>
                            )}
                        </div>

                        {/* Teléfono — único campo de contacto editable (email es read-only, va en el profile card). */}
                        <ProfileField
                            id={`${uid}-phone`}
                            label="Teléfono"
                            editing={editing}
                            value={phone}
                            onChange={setPhone}
                            readonlyValue={user.phone}
                            placeholder="+506 ..."
                        />

                        {/* Documento no nacional: nombre + fecha manuales (en el mismo grid). */}
                        {!isCedula && (
                            <NameDobInputs
                                uid={uid}
                                editing={editing}
                                fullName={fullName}
                                onFullName={setFullName}
                                birthDate={birthDate}
                                onBirthDate={setBirthDate}
                                viewName={user.fullName}
                                viewBirthDate={user.birthDate}
                            />
                        )}
                    </div>

                    {/* Cédula en edición: panel source-aware (loading / verificado / padrón / fallback / prompt). */}
                    {editing && isCedula && (
                        <>
                            {tseLookup.isFetching ? (
                                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Consultando registro nacional…
                                </div>
                            ) : lookupFailed ? (
                                <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-3">
                                    <p className="flex items-center gap-1.5 text-sm text-warning">
                                        <ShieldAlert className="h-4 w-4 shrink-0" />
                                        No encontramos la cédula en el registro nacional. Ingresá los datos manualmente.
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <NameDobInputs
                                            uid={`${uid}-manual`}
                                            editing
                                            fullName={fullName}
                                            onFullName={setFullName}
                                            birthDate={birthDate}
                                            onBirthDate={setBirthDate}
                                            viewName={fullName}
                                            viewBirthDate={birthDate}
                                        />
                                    </div>
                                </div>
                            ) : identitySource !== null ? (
                                <div className="flex flex-col gap-2.5 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5">
                                    <div className="flex items-center gap-2 text-sm">
                                        <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                                        <span className="truncate font-medium text-foreground">{fullName || '—'}</span>
                                        <Badge variant="outline" className="ml-auto border-success/30 text-success">
                                            {badgeLabel}
                                        </Badge>
                                    </div>
                                    {dobLocked ? (
                                        <p className="pl-6 text-sm text-muted-foreground">
                                            Nac. {formatDate(birthDate)}
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-1.5 pl-6">
                                            <Label
                                                htmlFor={`${uid}-padronDob`}
                                                className="flex items-center gap-1 text-xs text-warning"
                                            >
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                El padrón no incluye fecha de nacimiento — ingresala *
                                            </Label>
                                            <DateField
                                                id={`${uid}-padronDob`}
                                                value={birthDate}
                                                onChange={setBirthDate}
                                                disableFuture
                                                inputClassName={`bg-secondary/50 ${
                                                    missingRequiredDob ? 'border-warning' : 'border-border'
                                                }`}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                                    Ingresá la cédula para traer el nombre y la fecha de nacimiento del registro
                                    nacional.
                                </p>
                            )}
                        </>
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
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || tseLookup.isFetching || awaitingResolution || missingRequiredDob}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar cambios
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
