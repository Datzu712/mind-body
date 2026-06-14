'use client';

import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    UserRound,
    Save,
    X,
    Calendar,
    CreditCard,
    IdCard,
    CircleCheck,
    CircleAlert,
    Info,
    Clock,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';

export default function ProfilePage() {
    return (
        <>
            {/* Breadcrumb superior: Inicio / Mi perfil */}
            <DashboardHeader breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Mi perfil' }]} />

            <div className="flex-1 overflow-auto p-6">
                {/* Encabezado de página con título de la HU y badge de rol */}
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <UserRound className="h-7 w-7 text-primary" />
                            HU-CLI-004 · Mi perfil
                        </span>
                    }
                    description="Actualiza tu información personal en cualquier momento."
                    actions={
                        <Badge variant="secondary" className="text-sm">
                            Miembro
                        </Badge>
                    }
                    className="mb-6"
                />

                {/* Layout principal responsive: resumen · formulario · estados */}
                <div className="grid gap-6 lg:grid-cols-[320px_1fr_360px]">
                    {/* ── Columna izquierda: resumen del perfil ───────────────── */}
                    <Card className="border-border bg-card">
                        <CardContent className="flex flex-col gap-4 p-6">
                            {/* Identidad del miembro */}
                            <div className="flex flex-col items-center gap-3 text-center">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                                        CL
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1">
                                    <p className="text-lg font-semibold text-foreground">Carlos Andrés López</p>
                                    <p className="font-mono text-xs text-muted-foreground">MB-000123</p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-success/30 bg-success/20 text-success hover:bg-success/30"
                                >
                                    Miembro activo
                                </Badge>
                            </div>

                            <Separator />

                            {/* Resumen de membresía */}
                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-semibold text-foreground">Resumen de membresía</p>
                                <dl className="flex flex-col gap-2.5 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-muted-foreground">Tipo de membresía</dt>
                                        <dd className="font-medium text-foreground">Premium Mensual</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-muted-foreground">Fecha de inicio</dt>
                                        <dd className="font-medium text-foreground">15/04/2024</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-muted-foreground">Renovación</dt>
                                        <dd className="font-medium text-foreground">15/05/2025</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="flex items-center gap-1.5 text-muted-foreground">
                                            <CreditCard className="h-4 w-4" />
                                            Método de pago
                                        </dt>
                                        <dd className="font-medium text-foreground">Tarjeta terminada en 4242</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Botón visual: sin navegación real */}
                            <Button type="button" variant="outline" className="w-full">
                                <IdCard className="mr-2 h-4 w-4" />
                                Ver mi plan
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ── Columna central: formulario de información personal ──── */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">Información personal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Formulario visual: sin submit real, sin validación, sin red */}
                            <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Nombre */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="profile-name">
                                            Nombre <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-name"
                                            defaultValue="Carlos Andrés"
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>

                                    {/* Apellidos */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="profile-lastname">
                                            Apellidos <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-lastname"
                                            defaultValue="López Mendoza"
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>

                                    {/* Correo */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="profile-email" className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            Correo <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-email"
                                            type="email"
                                            defaultValue="carlos.lopez@example.com"
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>

                                    {/* Teléfono */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="profile-phone" className="flex items-center gap-1.5">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            Teléfono <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-phone"
                                            defaultValue="(551) 234-5678"
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>

                                    {/* Dirección — ancho completo */}
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <Label htmlFor="profile-address" className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            Dirección <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-address"
                                            defaultValue="Av. Insurgentes Sur 1234, Col. Del Valle, Benito Juárez, 03100, CDMX"
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>

                                    {/* Fecha de nacimiento */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="profile-birthdate" className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Fecha de nacimiento <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-birthdate"
                                            defaultValue="18/08/1992"
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>

                                    {/* Contacto de emergencia */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="profile-emergency">
                                            Contacto de emergencia <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="profile-emergency"
                                            defaultValue="María López – (55) 9876-5432"
                                            className="bg-secondary/50 border-border"
                                            aria-describedby="profile-emergency-help"
                                        />
                                        <p id="profile-emergency-help" className="text-xs text-muted-foreground">
                                            Nombre y teléfono de un contacto en caso de emergencia.
                                        </p>
                                    </div>
                                </div>

                                {/* Botonera: acciones sin efecto real */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <Button type="button" variant="outline">
                                        <X className="mr-2 h-4 w-4" />
                                        Cancelar
                                    </Button>
                                    <Button type="button">
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar cambios
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ── Columna derecha: estados simulados (documentación visual) ─ */}
                    <div className="flex flex-col gap-6">
                        {/* Estado 1: Actualización exitosa (success) */}
                        <Card className="border-success/30 bg-success/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-success">
                                    <CircleCheck className="h-5 w-5" />
                                    Actualización exitosa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-sm text-foreground">Datos actualizados correctamente.</p>
                                <p className="text-xs text-muted-foreground">Estado de éxito</p>
                            </CardContent>
                        </Card>

                        {/* Estado 2: Formato inválido (destructive) */}
                        <Card className="border-destructive/30 bg-destructive/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                                    <CircleAlert className="h-5 w-5" />
                                    Formato inválido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {/* Campo correo inválido */}
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="invalid-email">
                                        Correo <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="invalid-email"
                                        defaultValue="carlos.lopez@"
                                        aria-invalid="true"
                                        aria-describedby="invalid-email-error"
                                        className="bg-secondary/50"
                                    />
                                    <p id="invalid-email-error" className="text-xs text-destructive">
                                        Ingresa un correo válido. Ejemplo: usuario@correo.com
                                    </p>
                                </div>

                                {/* Campo teléfono inválido */}
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="invalid-phone">
                                        Teléfono <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="invalid-phone"
                                        defaultValue="55234"
                                        aria-invalid="true"
                                        aria-describedby="invalid-phone-error"
                                        className="bg-secondary/50"
                                    />
                                    <p id="invalid-phone-error" className="text-xs text-destructive">
                                        Ingresa 10 dígitos. Ejemplo: (55) 1234-5678
                                    </p>
                                </div>

                                <p className="text-xs text-muted-foreground">Estado de formato inválido</p>
                            </CardContent>
                        </Card>

                        {/* Estado 3: Cambio de correo con verificación (muted / primary + warning) */}
                        <Card className="border-border bg-muted/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                                    <Info className="h-5 w-5 text-primary" />
                                    Cambio de correo con verificación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <p className="text-sm text-foreground">
                                    Para cambiar tu correo, enviaremos un enlace de verificación al nuevo email.
                                </p>

                                {/* Campo correo nuevo */}
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="new-email">
                                        Correo <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="new-email"
                                        type="email"
                                        defaultValue="nuevo.correo@example.com"
                                        className="bg-secondary/50"
                                    />
                                </div>

                                {/* Badge de pendiente de verificación (warning) */}
                                <Badge
                                    variant="outline"
                                    className="w-fit gap-1.5 border-warning/30 bg-warning/20 text-warning hover:bg-warning/30"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Correo pendiente de verificación
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Notas inferiores */}
                <div className="mt-6 flex flex-col gap-1 text-center text-xs text-muted-foreground">
                    <p>Puedes actualizar tu información personal en cualquier momento.</p>
                    <p>Este wireframe muestra 3 estados de criterios de aceptación para HU-CLI-004.</p>
                </div>
            </div>
        </>
    );
}
