import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/src/shared/components/data-table';
import { RoutineForm } from '@/src/features/dashboard/routines/components/routine-form';
import { AssignMemberModal } from '@/src/features/dashboard/routines/components/assign-member-modal';
import { Dumbbell, Users, CalendarDays, History, Pencil, UserPlus, CheckCircle } from 'lucide-react';
import { sileo } from 'sileo';
import { formatDate } from '@/lib/utils';
import type {
    Routine,
    RoutineFormData,
    RoutineMember,
    TrainingSession,
    SessionStatus,
} from '@/src/features/dashboard/routines/types';
import {
    useRoutine,
    useUpdateRoutine,
    useRoutineMembers,
    useAssignRoutine,
    useRoutineSessions,
    useValidateSession,
    useRoutineVersions,
} from '@/src/features/dashboard/routines/hooks';

export const Route = createFileRoute('/dashboard/routines/$id')({
    component: RoutineDetailPage,
});

const sessionStatusLabels: Record<SessionStatus, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    VALIDATED: 'Validada',
    EXPIRED: 'Expirada',
};

const sessionStatusColors: Record<SessionStatus, string> = {
    PENDING: 'bg-warning/20 text-warning border-warning/30',
    CONFIRMED: 'bg-primary/20 text-primary border-primary/30',
    VALIDATED: 'bg-success/20 text-success border-success/30',
    EXPIRED: 'bg-muted text-muted-foreground border-border',
};

function RoutineDetailPage() {
    const { id }: { id: string } = Route.useParams();
    const { data: routine, isLoading } = useRoutine(id);
    const [activeTab, setActiveTab] = useState('details');
    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);

    const updateRoutine = useUpdateRoutine(id);
    const assignRoutine = useAssignRoutine(id);
    const validateSession = useValidateSession(id);

    const { data: members } = useRoutineMembers(id);
    const { data: sessions } = useRoutineSessions(id);
    const { data: versions } = useRoutineVersions(id);

    if (isLoading || !routine) {
        return (
            <>
                <DashboardHeader
                    breadcrumbs={[
                        { label: 'Mind & Body', href: '/dashboard' },
                        { label: 'Rutinas', href: '/dashboard/routines' },
                        { label: 'Cargando...' },
                    ]}
                />
                <div className="flex-1 overflow-auto p-6">
                    <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                        Cargando rutina...
                    </div>
                </div>
            </>
        );
    }

    const handleEditSubmit = (data: RoutineFormData) => {
        updateRoutine.mutate(data, {
            onSuccess: () => {
                sileo.success({ title: 'Rutina actualizada' });
                setEditOpen(false);
            },
            onError: (err) => sileo.error({ title: 'Error al actualizar', description: err.message }),
        });
    };

    const handleAssign = (memberId: string) => {
        assignRoutine.mutate(memberId, {
            onSuccess: () => {
                sileo.success({ title: 'Rutina asignada' });
                setAssignOpen(false);
            },
            onError: (err) => sileo.error({ title: 'Error al asignar', description: err.message }),
        });
    };

    const handleValidate = (session: TrainingSession) => {
        validateSession.mutate(session.id, {
            onSuccess: () => sileo.success({ title: 'Sesión validada' }),
            onError: (err) => sileo.error({ title: 'Error al validar', description: err.message }),
        });
    };

    const exerciseColumns: Column<Routine['exercises'][number]>[] = [
        { key: 'displayOrder', header: '#', render: (e) => e.displayOrder, className: 'w-12' },
        { key: 'name', header: 'Ejercicio', render: (e) => e.exerciseName ?? e.exercise?.name ?? '—' },
        { key: 'sets', header: 'Series', render: (e) => e.sets },
        { key: 'reps', header: 'Reps', render: (e) => e.reps || '—' },
        {
            key: 'restSeconds',
            header: 'Descanso',
            render: (e) => (e.restSeconds === 0 ? 'Sin descanso' : `${e.restSeconds ?? 60} s`),
        },
        { key: 'notes', header: 'Notas', render: (e) => e.notes || '—' },
    ];

    const memberColumns: Column<RoutineMember>[] = [
        { key: 'name', header: 'Miembro', render: (m) => <span className="font-medium">{m.fullName}</span> },
        { key: 'email', header: 'Email', render: (m) => m.email || '—' },
        {
            key: 'status',
            header: 'Estado',
            render: (m) => (
                <Badge variant="outline" className={m.status === 'ACTIVE' ? 'bg-success/20 text-success' : ''}>
                    {m.status}
                </Badge>
            ),
        },
        { key: 'assignedAt', header: 'Asignado', render: (m) => formatDate(m.assignedAt) },
    ];

    const sessionColumns: Column<TrainingSession>[] = [
        { key: 'date', header: 'Fecha', render: (s) => formatDate(s.date) },
        {
            key: 'member',
            header: 'Miembro',
            render: (s) => s.member?.fullName ?? '—',
        },
        {
            key: 'status',
            header: 'Estado',
            render: (s) => (
                <Badge variant="outline" className={sessionStatusColors[s.status]}>
                    {sessionStatusLabels[s.status]}
                </Badge>
            ),
        },
        {
            key: 'validatedAt',
            header: 'Validado',
            render: (s) => (s.validatedAt ? formatDate(s.validatedAt) : '—'),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-40',
            render: (s) =>
                s.status === 'CONFIRMED' && !s.validatedAt ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleValidate(s)}
                        disabled={validateSession.isPending}
                    >
                        <CheckCircle className="mr-1.5 h-4 w-4" />
                        Validar
                    </Button>
                ) : null,
        },
    ];

    type Snapshot = {
        name?: string;
        exercises?: Array<{
            exercise_id: string;
            display_order?: number | null;
            sets?: number | null;
            reps?: string | null;
            rest_seconds?: number | null;
            notes?: string | null;
        }>;
    };

    const versionRows = (versions ?? []).map((v, i, arr) => {
        const prev = arr[i + 1]?.snapshot as Snapshot | undefined;
        const curr = (v.snapshot as Snapshot) ?? { name: '', exercises: [] };
        const prevMap = new Map((prev?.exercises ?? []).map((e) => [e.exercise_id, e]));
        const currMap = new Map((curr.exercises ?? []).map((e) => [e.exercise_id, e]));
        const added = (curr.exercises ?? []).filter((e) => !prevMap.has(e.exercise_id)).length;
        const removed = (prev?.exercises ?? []).filter((e) => !currMap.has(e.exercise_id)).length;
        let changed = 0;
        for (const [id, e] of currMap) {
            const p = prevMap.get(id);
            if (!p) continue;
            if (
                e.display_order !== p.display_order ||
                e.sets !== p.sets ||
                e.reps !== p.reps ||
                (e.rest_seconds ?? 60) !== (p.rest_seconds ?? 60) ||
                e.notes !== p.notes
            )
                changed++;
        }
        const nameChanged = prev ? prev.name !== curr.name : false;
        return { ...v, added, removed, changed, nameChanged };
    });

    const versionColumns: Column<(typeof versionRows)[number]>[] = [
        { key: 'version', header: 'Versión', render: (v) => `v${v.versionNumber}`, className: 'w-20' },
        { key: 'changeReason', header: 'Motivo', render: (v) => v.changeReason || '—' },
        {
            key: 'diff',
            header: 'Cambios',
            render: (v) => {
                const parts: string[] = [];
                if (v.nameChanged) parts.push('nombre');
                if (v.added) parts.push(`+${v.added} ejercicios`);
                if (v.removed) parts.push(`-${v.removed} ejercicios`);
                if (v.changed) parts.push(`~${v.changed} ejercicios`);
                return parts.length ? parts.join(', ') : 'Sin cambios';
            },
        },
        { key: 'changedByName', header: 'Modificado por', render: (v) => v.changedByName ?? 'Entrenador' },
        { key: 'createdAt', header: 'Fecha', render: (v) => formatDate(v.createdAt) },
    ];

    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Mind & Body', href: '/dashboard' },
                    { label: 'Rutinas', href: '/dashboard/routines' },
                    { label: routine.name },
                ]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title={routine.name}
                    description={routine.objective || 'Sin objetivo definido'}
                    actions={
                        <Button onClick={() => setEditOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    }
                    className="mb-6"
                />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-secondary/50 border border-border mb-6">
                        <TabsTrigger value="details">
                            <Dumbbell className="mr-1.5 h-4 w-4" />
                            Detalles
                        </TabsTrigger>
                        <TabsTrigger value="members">
                            <Users className="mr-1.5 h-4 w-4" />
                            Miembros
                        </TabsTrigger>
                        <TabsTrigger value="sessions">
                            <CalendarDays className="mr-1.5 h-4 w-4" />
                            Sesiones
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="mr-1.5 h-4 w-4" />
                            Historial
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Ejercicios de la rutina</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={exerciseColumns}
                                    data={routine.exercises.slice().sort((a, b) => a.displayOrder - b.displayOrder)}
                                    keyExtractor={(e) => e.id}
                                    emptyMessage="No hay ejercicios en esta rutina"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members">
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-foreground">Miembros asignados</CardTitle>
                                <Button size="sm" onClick={() => setAssignOpen(true)}>
                                    <UserPlus className="mr-1.5 h-4 w-4" />
                                    Asignar
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={memberColumns}
                                    data={members ?? []}
                                    keyExtractor={(m) => m.id}
                                    emptyMessage="No hay miembros asignados"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sessions">
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Sesiones de entrenamiento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={sessionColumns}
                                    data={sessions ?? []}
                                    keyExtractor={(s) => s.id}
                                    emptyMessage="No hay sesiones registradas"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Historial de versiones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={versionColumns}
                                    data={versionRows}
                                    keyExtractor={(v) => String(v.versionNumber)}
                                    emptyMessage="No hay versiones registradas"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <RoutineForm
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    routine={routine}
                    onSubmit={handleEditSubmit}
                    isPending={updateRoutine.isPending}
                />

                <AssignMemberModal
                    open={assignOpen}
                    onOpenChange={setAssignOpen}
                    onAssign={handleAssign}
                    isPending={assignRoutine.isPending}
                />
            </div>
        </>
    );
}
