import { Fragment, cloneElement, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { sileo } from 'sileo';
import { ArrowLeft, ArrowRight, Cake, Check, IdCard, Loader2, ShieldCheck, Search } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DateField } from '@/components/ui/date-field';
import { cn, formatDate } from '@/lib/utils';
import type { DniType, ProfileType } from '../types';
import { useCreateUser, useTseLookup, type TsePersonData } from '../hooks';

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STEPS = [
    { n: 1, label: 'Identificacion' },
    { n: 2, label: 'Datos del usuario' },
];

function Stepper({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-3">
            {STEPS.map((s, i) => (
                <Fragment key={s.n}>
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                                current >= s.n
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-muted-foreground',
                            )}
                        >
                            {current > s.n ? <Check className="h-4 w-4" /> : s.n}
                        </div>
                        <span
                            className={cn(
                                'text-sm font-medium whitespace-nowrap',
                                current >= s.n ? 'text-foreground' : 'text-muted-foreground',
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={cn('h-px flex-1', current > s.n ? 'bg-primary' : 'bg-border')} />
                    )}
                </Fragment>
            ))}
        </div>
    );
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function Field({
    label,
    required,
    full,
    children,
}: {
    label: string;
    required?: boolean;
    full?: boolean;
    // Element children get `id` injected for label association; pass a function
    // to wire the id onto a nested control (e.g. a Select trigger).
    children: ReactElement<{ id?: string }> | ((id: string) => ReactNode);
}) {
    const id = useId();
    return (
        <div className={cn('flex flex-col gap-1.5', full && 'col-span-2')}>
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
                {required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {typeof children === 'function' ? children(id) : cloneElement(children, { id })}
        </div>
    );
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
    const [step, setStep] = useState(1);
    const [dniType, setDniType] = useState<DniType>('CEDULA_NACIONAL');
    const [dni, setDni] = useState('');
    const [tseData, setTseData] = useState<TsePersonData | null>(null);
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [profileType, setProfileType] = useState<ProfileType | ''>('');
    const formRef = useRef<HTMLFormElement>(null);
    const createUser = useCreateUser();
    const rawDni = dni.replace(/\D/g, '');
    const tseLookup = useTseLookup(rawDni);

    // Clears everything captured in step 2 (TSE autocomplete + profile choice).
    // Called whenever the document changes so a stale lookup never carries over.
    const resetUserDataStep = () => {
        setTseData(null);
        setFullName('');
        setBirthDate('');
        setProfileType('');
    };

    const reset = () => {
        setStep(1);
        setDniType('CEDULA_NACIONAL');
        setDni('');
        resetUserDataStep();
    };

    const handleDniTypeChange = (next: DniType) => {
        setDniType(next);
        setDni(''); // formato distinto por tipo → re-ingresar el numero
        resetUserDataStep();
    };

    const handleDniChange = (raw: string) => {
        if (dniType === 'CEDULA_NACIONAL') {
            const digits = raw.replace(/\D/g, '').slice(0, 9);
            setDni([digits.slice(0, 1), digits.slice(1, 5), digits.slice(5, 9)].filter(Boolean).join('-'));
        } else {
            setDni(raw);
        }
        resetUserDataStep();
    };

    const handleClose = (open: boolean) => {
        if (!open) reset();
        onOpenChange(open);
    };

    const handleConsultTse = async () => {
        if (!dni.trim()) return;
        const { data, error } = await tseLookup.refetch();
        if (error) {
            sileo.error({
                title: 'Cedula no encontrada',
                description: 'No se encontraron datos en el TSE para esta cedula.',
            });
            return;
        }
        if (data) {
            setTseData(data);
            setFullName(data.fullName);
            setBirthDate(data.dateOfBirth);
            setStep(2);
        }
    };

    const handleNext = () => {
        if (!dniType || !dni.trim()) return;
        if (dniType === 'CEDULA_NACIONAL') {
            void handleConsultTse();
        } else {
            setStep(2);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form || !profileType || !dniType || !rawDni) return;

        const fd = new FormData(form);
        const get = (key: string) => (fd.get(key) as string) || undefined;

        createUser.mutate(
            {
                fullName: fullName || get('fullName')!,
                email: get('email')!,
                phone: get('phone'),
                dniType,
                dni: rawDni,
                birthDate: birthDate || get('birthDate'),
                profileType,
                memberFields:
                    profileType === 'MEMBER'
                        ? {
                              joinedAt: get('joinedAt'),
                              emergencyContactName: get('emergencyContactName'),
                              emergencyContactPhone: get('emergencyContactPhone'),
                          }
                        : undefined,
                trainerFields:
                    profileType === 'TRAINER'
                        ? { specialty: get('specialty'), biography: get('biography') }
                        : undefined,
                staffFields: profileType === 'STAFF' ? { hiredAt: get('hiredAt') } : undefined,
            },
            {
                onSuccess: () => {
                    sileo.success({ title: 'Usuario creado exitosamente' });
                    handleClose(false);
                },
                onError: (error) => {
                    sileo.error({ title: 'Error al crear usuario', description: error.message });
                },
            },
        );
    };

    const dniTypeLabels: Record<DniType, string> = {
        CEDULA_NACIONAL: 'Cedula Nacional',
        DIMEX: 'DIMEX',
        PASAPORTE: 'Pasaporte',
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="bg-card border-border sm:max-w-[520px] max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="gap-4">
                    <DialogTitle className="text-foreground">Nuevo usuario</DialogTitle>
                    <Stepper current={step} />
                </DialogHeader>

                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <Field label="Tipo de documento" required>
                            {(id) => (
                                <Select value={dniType} onValueChange={(v) => handleDniTypeChange(v as DniType)}>
                                    <SelectTrigger id={id} className="w-full bg-secondary/50 border-border">
                                        <SelectValue placeholder="Seleccionar tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        <SelectItem value="CEDULA_NACIONAL">Cedula Nacional</SelectItem>
                                        <SelectItem value="DIMEX">DIMEX</SelectItem>
                                        <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </Field>

                        <Field label="Numero de documento" required>
                            <Input
                                value={dni}
                                onChange={(e) => handleDniChange(e.target.value)}
                                maxLength={dniType === 'CEDULA_NACIONAL' ? 11 : undefined}
                                placeholder={dniType === 'CEDULA_NACIONAL' ? '0-0000-0000' : 'Numero de documento'}
                                className="bg-secondary/50 border-border"
                            />
                        </Field>

                        {dniType === 'CEDULA_NACIONAL' && (
                            <p className="text-xs text-muted-foreground">
                                Se consultara el Tribunal Supremo de Elecciones para verificar y autocompletar los
                                datos.
                            </p>
                        )}

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={!dniType || !dni.trim() || tseLookup.isFetching}
                            >
                                {tseLookup.isFetching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Consultando TSE...
                                    </>
                                ) : dniType === 'CEDULA_NACIONAL' ? (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Consultar y continuar
                                    </>
                                ) : (
                                    <>
                                        Siguiente
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 2 && (
                    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        {tseData ? (
                            <div className="col-span-2 rounded-xl border border-border bg-secondary/30 p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                                        {getInitials(fullName)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-base font-semibold text-foreground">{fullName}</p>
                                        <p className="text-sm text-muted-foreground">Identidad verificada</p>
                                    </div>
                                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        TSE
                                    </span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <IdCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">{dniTypeLabels[dniType]}</p>
                                            <p className="truncate font-medium text-foreground">{dni}</p>
                                        </div>
                                    </div>
                                    {birthDate && (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Cake className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                                                <p className="truncate font-medium text-foreground">
                                                    {formatDate(birthDate)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <Field label="Nombre completo" required full>
                                    <Input
                                        name="fullName"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Ej: Juan Perez"
                                        className="bg-secondary/50 border-border"
                                    />
                                </Field>
                                <Field label="Fecha de nacimiento" full>
                                    <DateField
                                        name="birthDate"
                                        value={birthDate}
                                        onChange={setBirthDate}
                                        disableFuture
                                        inputClassName="bg-secondary/50 border-border"
                                    />
                                </Field>
                            </>
                        )}

                        <Field label="Email" required>
                            <Input
                                name="email"
                                type="email"
                                required
                                placeholder="usuario@email.com"
                                className="bg-secondary/50 border-border"
                            />
                        </Field>

                        <Field label="Telefono">
                            <Input name="phone" placeholder="+506 ..." className="bg-secondary/50 border-border" />
                        </Field>

                        <Separator className="col-span-2" />

                        <Field label="Perfil inicial" full>
                            {(id) => (
                                <Select value={profileType} onValueChange={(v) => setProfileType(v as ProfileType)}>
                                    <SelectTrigger id={id} className="w-full bg-secondary/50 border-border">
                                        <SelectValue placeholder="Seleccionar tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        <SelectItem value="MEMBER">Miembro</SelectItem>
                                        <SelectItem value="TRAINER">Entrenador</SelectItem>
                                        <SelectItem value="STAFF">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </Field>

                        {profileType === 'MEMBER' && (
                            <>
                                <Field label="Fecha de ingreso" full>
                                    <DateField
                                        name="joinedAt"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        fromYear={2010}
                                        inputClassName="bg-secondary/50 border-border"
                                    />
                                </Field>
                                <Field label="Contacto de emergencia">
                                    <Input
                                        name="emergencyContactName"
                                        placeholder="Nombre"
                                        className="bg-secondary/50 border-border"
                                    />
                                </Field>
                                <Field label="Tel. emergencia">
                                    <Input
                                        name="emergencyContactPhone"
                                        placeholder="+506 ..."
                                        className="bg-secondary/50 border-border"
                                    />
                                </Field>
                            </>
                        )}

                        {profileType === 'TRAINER' && (
                            <>
                                <Field label="Especialidad" full>
                                    <Input
                                        name="specialty"
                                        placeholder="Ej: Funcional, Yoga, Fuerza..."
                                        className="bg-secondary/50 border-border"
                                    />
                                </Field>
                                <Field label="Biografia" full>
                                    <Textarea
                                        name="biography"
                                        placeholder="Breve descripcion..."
                                        className="bg-secondary/50 border-border min-h-[80px]"
                                    />
                                </Field>
                            </>
                        )}

                        {profileType === 'STAFF' && (
                            <Field label="Fecha de contratacion" full>
                                <DateField
                                    name="hiredAt"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    fromYear={2010}
                                    inputClassName="bg-secondary/50 border-border"
                                />
                            </Field>
                        )}

                        <DialogFooter className="col-span-2 gap-2">
                            <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Atras
                            </Button>
                            <Button type="submit" disabled={!profileType || createUser.isPending}>
                                {createUser.isPending ? 'Creando...' : 'Crear usuario'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
