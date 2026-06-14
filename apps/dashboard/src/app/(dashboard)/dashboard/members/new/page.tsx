import { CircleAlert, CircleCheck, Info, Save, TriangleAlert, Upload, UserPlus, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';

const requiredMark = <span className="text-destructive">*</span>;

export default function NewMemberPage() {
    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Inicio', href: '/dashboard' },
                    { label: 'Miembros', href: '/dashboard/members' },
                    { label: 'Registrar nuevo miembro' },
                ]}
            />

            <main className="flex-1 overflow-auto p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1600px]">
                    <div className="mb-6 flex items-start gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary sm:flex">
                            <UserPlus className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <PageHeader
                            title="HU-CLI-001 · Registrar nuevo miembro"
                            description="Completa la información para crear el perfil administrativo de un miembro."
                            actions={
                                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                                    Administrador
                                </Badge>
                            }
                            className="min-w-0 flex-1"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Formulario visual del miembro */}
                        <Card className="border-border bg-card">
                            <CardHeader className="border-b border-border">
                                <CardTitle className="text-xl">Información del miembro</CardTitle>
                                <CardDescription>
                                    Ingresa los datos personales y la configuración inicial de la membresía.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <form className="space-y-6">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="member-name">Nombre {requiredMark}</Label>
                                            <Input
                                                id="member-name"
                                                name="name"
                                                placeholder="Ej. María"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="member-last-name">Apellidos {requiredMark}</Label>
                                            <Input
                                                id="member-last-name"
                                                name="lastName"
                                                placeholder="Ej. Gómez Rodríguez"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="member-email">Correo {requiredMark}</Label>
                                            <Input
                                                id="member-email"
                                                name="email"
                                                type="email"
                                                placeholder="nombre@correo.com"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="member-phone">Teléfono {requiredMark}</Label>
                                            <Input
                                                id="member-phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="+506 8888-8888"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="member-identification">Identificación {requiredMark}</Label>
                                            <Input
                                                id="member-identification"
                                                name="identification"
                                                placeholder="Número de identificación"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="member-birth-date">
                                                Fecha de nacimiento {requiredMark}
                                            </Label>
                                            <Input
                                                id="member-birth-date"
                                                name="birthDate"
                                                type="date"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="member-address">Dirección {requiredMark}</Label>
                                            <Textarea
                                                id="member-address"
                                                name="address"
                                                placeholder="Dirección completa del miembro"
                                                className="min-h-24 resize-none bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="membership-type">Tipo de membresía {requiredMark}</Label>
                                            <Select name="membershipType">
                                                <SelectTrigger id="membership-type" className="w-full bg-secondary/50">
                                                    <SelectValue placeholder="Selecciona una membresía" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Mensual</SelectItem>
                                                    <SelectItem value="quarterly">Trimestral</SelectItem>
                                                    <SelectItem value="semiannual">Semestral</SelectItem>
                                                    <SelectItem value="annual">Anual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="membership-start-date">
                                                Fecha de inicio {requiredMark}
                                            </Label>
                                            <Input
                                                id="membership-start-date"
                                                name="startDate"
                                                type="date"
                                                className="bg-secondary/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="member-status">Estado inicial {requiredMark}</Label>
                                            <Select name="initialStatus" defaultValue="active">
                                                <SelectTrigger id="member-status" className="w-full bg-secondary/50">
                                                    <SelectValue placeholder="Selecciona un estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Activo</SelectItem>
                                                    <SelectItem value="pending">Pendiente</SelectItem>
                                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="member-photo">Foto opcional</Label>
                                            <label
                                                htmlFor="member-photo"
                                                className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center transition-colors hover:border-primary/60 hover:bg-secondary/50"
                                            >
                                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                                                    <Upload className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                                <span className="space-y-1">
                                                    <span className="block text-sm font-medium text-foreground">
                                                        Selecciona una foto
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        Archivo local de referencia. No se realizará ninguna subida.
                                                    </span>
                                                </span>
                                                <Input
                                                    id="member-photo"
                                                    name="photo"
                                                    type="file"
                                                    accept="image/*"
                                                    className="sr-only"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            Los campos marcados con <span className="text-destructive">*</span> son
                                            obligatorios.
                                        </p>

                                        <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                            <Button type="button" variant="outline">
                                                <X className="h-4 w-4" aria-hidden="true" />
                                                Cancelar
                                            </Button>
                                            <Button type="button">
                                                <Save className="h-4 w-4" aria-hidden="true" />
                                                Guardar miembro
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Estados visuales simulados */}
                        <aside className="space-y-4" aria-label="Estados visuales simulados">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Estados visuales</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Referencia de los criterios de aceptación.
                                </p>
                            </div>

                            <Card className="gap-4 border-success/30 bg-success/5">
                                <CardHeader className="gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                                        <CircleCheck className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <CardTitle className="text-success">Registro exitoso</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    <p className="text-foreground">Miembro registrado correctamente.</p>
                                    <p className="font-semibold text-success">ID generado: MB-000123</p>
                                </CardContent>
                            </Card>

                            <Card className="gap-4 border-destructive/30 bg-destructive/5">
                                <CardHeader className="gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                                        <CircleAlert className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <CardTitle className="text-destructive">Correo duplicado</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-foreground">El correo ya se encuentra registrado</p>
                                </CardContent>
                            </Card>

                            <Card className="gap-4 border-warning/30 bg-warning/5">
                                <CardHeader className="gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning">
                                        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <CardTitle className="text-warning">Datos incompletos</CardTitle>
                                    <CardDescription>Ejemplo de campos obligatorios sin completar.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="invalid-name">Nombre {requiredMark}</Label>
                                        <Input
                                            id="invalid-name"
                                            aria-invalid="true"
                                            aria-describedby="invalid-name-error"
                                            className="border-warning bg-warning/5 focus-visible:border-warning focus-visible:ring-warning/20"
                                        />
                                        <p id="invalid-name-error" className="text-xs text-warning">
                                            Este campo es obligatorio
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="invalid-email">Correo {requiredMark}</Label>
                                        <Input
                                            id="invalid-email"
                                            type="email"
                                            aria-invalid="true"
                                            aria-describedby="invalid-email-error"
                                            className="border-warning bg-warning/5 focus-visible:border-warning focus-visible:ring-warning/20"
                                        />
                                        <p id="invalid-email-error" className="text-xs text-warning">
                                            Este campo es obligatorio
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="invalid-membership">Tipo de membresía {requiredMark}</Label>
                                        <Select>
                                            <SelectTrigger
                                                id="invalid-membership"
                                                aria-invalid="true"
                                                aria-describedby="invalid-membership-error"
                                                className="w-full border-warning bg-warning/5 focus-visible:border-warning focus-visible:ring-warning/20"
                                            >
                                                <SelectValue placeholder="Selecciona una membresía" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Mensual</SelectItem>
                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                <SelectItem value="semiannual">Semestral</SelectItem>
                                                <SelectItem value="annual">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p id="invalid-membership-error" className="text-xs text-warning">
                                            Este campo es obligatorio
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
