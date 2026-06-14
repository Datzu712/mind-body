'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { AssignedMembersTable } from '@/src/features/dashboard/trainer/components/assigned-members-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    UsersRound,
    Search,
    FileDown,
    FileCheck,
    MessageSquarePlus,
    TrendingUp,
    CircleCheck,
    Lock,
    Mail,
    Phone,
    Target,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    mockAssignedMembers,
    mockTrainingHistory,
    assignedMemberStatusLabels,
    type AssignedMember,
    type AssignedMemberStatus,
} from '@/src/shared/lib/mock-data';

const statusClasses: Record<AssignedMemberStatus, string> = {
    active: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    frozen: 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
    expired: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30',
};

function getInitials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Datos detallados estáticos (solo documentación visual del perfil por defecto)
const bodyMeasurements = {
    weight: '62.4 kg',
    height: '1.65 m',
    bmi: '22.9',
    bmiStatus: 'Normal',
    key: [
        { label: 'Cintura', value: '72 cm' },
        { label: 'Cadera', value: '95 cm' },
        { label: 'Brazo', value: '28 cm' },
        { label: 'Muslo', value: '54 cm' },
    ],
};

const goal = {
    mainGoal: 'Pérdida de peso',
    targetDate: '15/08/2025',
    progress: 72,
};

const trainerNote = {
    text: 'Excelente disciplina y constancia. Enfocarse en aumentar proteína y mantener déficit calórico moderado.',
    updatedAt: 'Última actualización: 08/05/2025 · Tú',
};

export default function TrainerMembersPage() {
    // Interactividad mock (sin backend)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedMemberId, setSelectedMemberId] = useState('MB-000125');
    const [exported, setExported] = useState(false);

    const selectedMember =
        mockAssignedMembers.find((member) => member.id === selectedMemberId) ?? mockAssignedMembers[0];

    const handleSelectMember = (member: AssignedMember) => {
        setSelectedMemberId(member.id);
    };

    return (
        <>
            {/* Breadcrumb: Inicio / Entrenadores / Mis miembros asignados */}
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Inicio', href: '/dashboard' },
                    { label: 'Entrenadores' },
                    { label: 'Mis miembros asignados' },
                ]}
            />

            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <UsersRound className="h-7 w-7 text-primary" />
                            HU-CLI-006 · Mis miembros asignados
                        </span>
                    }
                    description="Visualiza tus miembros asignados y el perfil completo del miembro seleccionado."
                    actions={
                        <Badge variant="secondary" className="text-sm">
                            Entrenador
                        </Badge>
                    }
                    className="mb-6"
                />

                {/* Alert visual mock (exportación de PDF) */}
                {exported && (
                    <Alert className="mb-6 border-success/30 bg-success/10">
                        <CircleCheck className="text-success" />
                        <AlertTitle className="text-success">Exportación exitosa</AlertTitle>
                        <AlertDescription>PDF generado correctamente.</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
                    {/* ── Sección 1: Mis miembros asignados ─────────────────── */}
                    <Card className="border-border bg-card h-fit">
                        <CardHeader>
                            <CardTitle className="text-foreground">Mis miembros asignados</CardTitle>
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar miembro..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="pl-9 bg-secondary/50 border-border"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Estado</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="bg-secondary/50 border-border sm:w-40">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="active">Activa</SelectItem>
                                            <SelectItem value="frozen">Congelada</SelectItem>
                                            <SelectItem value="expired">Vencida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AssignedMembersTable
                                members={mockAssignedMembers}
                                selectedMemberId={selectedMemberId}
                                onSelectMember={handleSelectMember}
                            />
                        </CardContent>
                    </Card>

                    {/* ── Sección 2: Perfil completo del miembro ────────────── */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <CardTitle className="text-foreground">Perfil completo del miembro</CardTitle>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setExported(true)}>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Exportar perfil en PDF
                                    </Button>
                                    <Button type="button" variant="outline" size="sm">
                                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                                        Agregar observación
                                    </Button>
                                    <Button type="button" size="sm">
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Actualizar progreso
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            {/* Resumen personal */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                                        {getInitials(selectedMember.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-1 flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-lg font-semibold text-foreground">
                                            {selectedMember.name}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'font-medium border',
                                                statusClasses[selectedMember.membershipStatus],
                                            )}
                                        >
                                            {assignedMemberStatusLabels[selectedMember.membershipStatus]}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                        <span className="font-mono text-xs">{selectedMember.id}</span>
                                        <span>{selectedMember.age} años</span>
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4" />
                                            {selectedMember.email}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-4 w-4" />
                                            {selectedMember.phone}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground">
                                        {selectedMember.membershipPlan} · Vigencia: {selectedMember.membershipExpiresAt}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Historial de entrenamientos */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Historial de entrenamientos
                                    </h3>
                                    <button type="button" className="text-sm text-primary hover:underline">
                                        Ver historial completo
                                    </button>
                                </div>
                                <div className="rounded-lg border border-border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableHead className="text-muted-foreground font-semibold">
                                                    Fecha
                                                </TableHead>
                                                <TableHead className="text-muted-foreground font-semibold">
                                                    Rutina
                                                </TableHead>
                                                <TableHead className="text-muted-foreground font-semibold">
                                                    Entrenador
                                                </TableHead>
                                                <TableHead className="text-muted-foreground font-semibold">
                                                    Observaciones
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mockTrainingHistory.map((entry) => (
                                                <TableRow
                                                    key={`${entry.date}-${entry.routine}`}
                                                    className="border-border"
                                                >
                                                    <TableCell className="text-muted-foreground">
                                                        {entry.date}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">{entry.routine}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {entry.trainer}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">{entry.notes}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Medidas corporales · Metas */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="border-border bg-muted/20">
                                    <CardHeader>
                                        <CardTitle className="text-base text-foreground">Medidas corporales</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Peso</span>
                                                <span className="font-medium text-foreground">
                                                    {bodyMeasurements.weight}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Altura</span>
                                                <span className="font-medium text-foreground">
                                                    {bodyMeasurements.height}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">IMC</span>
                                                <span className="font-medium text-foreground">
                                                    {bodyMeasurements.bmi}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Estado IMC</span>
                                                <Badge
                                                    variant="outline"
                                                    className="w-fit border-success/30 bg-success/20 text-success"
                                                >
                                                    {bodyMeasurements.bmiStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Medidas clave
                                            </span>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {bodyMeasurements.key.map((measure) => (
                                                    <div key={measure.label} className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground">{measure.label}</span>
                                                        <span className="font-medium text-foreground">
                                                            {measure.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button type="button" className="w-fit text-sm text-primary hover:underline">
                                            Ver historial de medidas
                                        </button>
                                    </CardContent>
                                </Card>

                                <Card className="border-border bg-muted/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base text-foreground">
                                            <Target className="h-4 w-4 text-primary" />
                                            Metas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-3 text-sm">
                                            <div className="flex justify-between gap-2">
                                                <span className="text-muted-foreground">Objetivo principal</span>
                                                <span className="font-medium text-foreground">{goal.mainGoal}</span>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    Fecha objetivo
                                                </span>
                                                <span className="font-medium text-foreground">{goal.targetDate}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Progreso</span>
                                                <span className="font-medium text-foreground">{goal.progress}%</span>
                                            </div>
                                            <Progress value={goal.progress} />
                                        </div>
                                        <button type="button" className="w-fit text-sm text-primary hover:underline">
                                            Ver todas las metas
                                        </button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Notas del entrenador */}
                            <Card className="border-border bg-muted/20">
                                <CardHeader>
                                    <CardTitle className="text-base text-foreground">Notas del entrenador</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <p className="text-sm text-foreground">{trainerNote.text}</p>
                                    <p className="text-xs text-muted-foreground">{trainerNote.updatedAt}</p>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </div>

                {/* Cards de criterios de aceptación */}
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Card className="border-success/30 bg-success/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base text-success">
                                <CircleCheck className="h-5 w-5" />
                                Perfil completo visible
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground">
                                Se muestra el perfil completo del miembro seleccionado con toda la información
                                disponible.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-warning/30 bg-warning/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base text-warning">
                                <Lock className="h-5 w-5" />
                                Acceso restringido
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-1">
                            <p className="text-sm text-foreground">No tienes autorización para ver este miembro.</p>
                            <p className="text-xs text-muted-foreground">
                                No cuentas con permisos para acceder a la información de este miembro.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-success/30 bg-success/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base text-success">
                                <FileCheck className="h-5 w-5" />
                                Exportación exitosa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground">PDF generado correctamente.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Nota inferior */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Este wireframe muestra 3 estados de criterios de aceptación para HU-CLI-006.
                </p>
            </div>
        </>
    );
}
