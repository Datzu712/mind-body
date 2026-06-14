'use client';

import { useMemo, useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { MembershipApprovalTable } from '@/src/features/dashboard/memberships/components/membership-approval-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ClipboardCheck, CheckCircle2, XCircle, Info, Inbox } from 'lucide-react';
import {
    mockMembershipApprovalRequests,
    membershipPaymentStatusLabels,
    type MembershipApprovalRequest,
} from '@/src/shared/lib/mock-data';

const MAX_REASON_LENGTH = 250;

type VisualMessage = { type: 'success' | 'reject'; text: string } | null;

export default function MembershipApprovalPage() {
    // Interactividad mock (sin backend): selección, modales, motivo y mensaje visual
    const [selectedRequest, setSelectedRequest] = useState<MembershipApprovalRequest | null>(null);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [visualMessage, setVisualMessage] = useState<VisualMessage>(null);

    const requests = mockMembershipApprovalRequests;

    const summary = useMemo(() => {
        const pending = requests.filter((request) => request.paymentStatus === 'pending').length;
        const paid = requests.filter((request) => request.paymentStatus === 'paid').length;
        return { pending, paid, needsReview: pending };
    }, [requests]);

    // ── Flujo aprobar ──────────────────────────────────────────────
    const openApprove = (request: MembershipApprovalRequest) => {
        setSelectedRequest(request);
        setApproveDialogOpen(true);
    };

    const confirmApprove = () => {
        setApproveDialogOpen(false);
        setVisualMessage({ type: 'success', text: 'Membresía activada y correo enviado al miembro.' });
    };

    // ── Flujo rechazar ─────────────────────────────────────────────
    const openReject = (request: MembershipApprovalRequest) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectDialogOpen(true);
    };

    const confirmReject = () => {
        setRejectDialogOpen(false);
        setRejectionReason('');
        setVisualMessage({ type: 'reject', text: 'Solicitud rechazada. El motivo será notificado al miembro.' });
    };

    return (
        <>
            {/* Breadcrumb: Inicio / Membresías / Aprobación de membresías */}
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Inicio', href: '/dashboard' },
                    { label: 'Membresías' },
                    { label: 'Aprobación de membresías' },
                ]}
            />

            <div className="flex-1 overflow-auto p-6">
                {/* Encabezado con icono, título y badge de rol */}
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <ClipboardCheck className="h-7 w-7 text-primary" />
                            HU-CLI-003 · Aprobación de membresías
                        </span>
                    }
                    description="Gestiona las solicitudes de membresía pendientes de aprobación."
                    actions={
                        <Badge variant="secondary" className="text-sm">
                            Administrador
                        </Badge>
                    }
                    className="mb-6"
                />

                {/* Alert visual mock del resultado de las acciones */}
                {visualMessage && (
                    <Alert
                        variant={visualMessage.type === 'reject' ? 'destructive' : 'default'}
                        className={
                            visualMessage.type === 'success'
                                ? 'mb-6 border-success/30 bg-success/10'
                                : 'mb-6 border-destructive/30 bg-destructive/10'
                        }
                    >
                        {visualMessage.type === 'success' ? (
                            <CheckCircle2 className="text-success" />
                        ) : (
                            <XCircle className="text-destructive" />
                        )}
                        <AlertTitle className={visualMessage.type === 'success' ? 'text-success' : 'text-destructive'}>
                            {visualMessage.type === 'success' ? 'Activación exitosa' : 'Solicitud rechazada'}
                        </AlertTitle>
                        <AlertDescription>{visualMessage.text}</AlertDescription>
                    </Alert>
                )}

                {/* ── Layout principal ───────────────────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    {/* Izquierda: card principal con tabs y listado */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">Gestión de aprobación de membresías</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending">
                                <TabsList>
                                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                                    <TabsTrigger value="active">Activas</TabsTrigger>
                                    <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending" className="mt-4 flex flex-col gap-4">
                                    <p className="text-sm text-muted-foreground">
                                        Aprueba o rechaza las solicitudes de membresía pendientes.
                                    </p>
                                    <MembershipApprovalTable
                                        requests={requests}
                                        onApprove={openApprove}
                                        onReject={openReject}
                                    />
                                </TabsContent>

                                <TabsContent value="active" className="mt-4">
                                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
                                        <Inbox className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm font-medium text-foreground">
                                            No hay membresías activas para mostrar.
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Las membresías aprobadas aparecerán en esta pestaña.
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="rejected" className="mt-4">
                                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
                                        <Inbox className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm font-medium text-foreground">
                                            No hay solicitudes rechazadas para mostrar.
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Las solicitudes rechazadas aparecerán en esta pestaña.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Derecha: resumen, membresía activa y criterios */}
                    <div className="flex flex-col gap-6">
                        {/* Resumen de solicitudes */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Resumen de solicitudes</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Pendientes</span>
                                    <Badge className="bg-warning/20 text-warning border-warning/30">
                                        {summary.pending}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Pagadas</span>
                                    <Badge className="bg-success/20 text-success border-success/30">
                                        {summary.paid}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Requieren revisión</span>
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        {summary.needsReview}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Membresía ya activa (informativo) */}
                        <Card className="border-border bg-muted/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                                    <Info className="h-5 w-5 text-primary" />
                                    Membresía ya activa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Esta membresía ya se encuentra activa.</p>
                            </CardContent>
                        </Card>

                        {/* ── Criterios de aceptación ────────────────────── */}
                        {/* Criterio 1: Activación exitosa (success) */}
                        <Card className="border-success/30 bg-success/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-success">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Activación de membresía exitosa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground">
                                    Membresía activada y correo enviado al miembro.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Criterio 2: Rechazo de membresía (destructive) */}
                        <Card className="border-destructive/30 bg-destructive/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                                    <XCircle className="h-5 w-5" />
                                    Rechazo de membresía
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground">
                                    El rechazo debe registrar un motivo y notificar al miembro.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Criterio 3: Membresía ya activa (muted / primary) */}
                        <Card className="border-border bg-muted/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                                    <Info className="h-5 w-5 text-primary" />
                                    Membresía ya activa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground">Esta membresía ya se encuentra activa.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Nota inferior */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Este wireframe muestra 3 estados de criterios de aceptación para HU-CLI-003.
                </p>
            </div>

            {/* ── Modal visual de aprobación ─────────────────────────────── */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <DialogTitle>¿Desea activar esta membresía?</DialogTitle>
                            <DialogDescription>
                                El acceso del miembro será activado y se enviará un correo de confirmación.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Resumen del miembro seleccionado */}
                    {selectedRequest && (
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                                <dt className="text-muted-foreground">Nombre</dt>
                                <dd className="text-right font-medium text-foreground">{selectedRequest.memberName}</dd>
                                <dt className="text-muted-foreground">ID</dt>
                                <dd className="text-right font-mono text-xs text-foreground">
                                    {selectedRequest.memberId}
                                </dd>
                                <dt className="text-muted-foreground">Plan solicitado</dt>
                                <dd className="text-right text-foreground">{selectedRequest.requestedPlan}</dd>
                                <dt className="text-muted-foreground">Estado de pago</dt>
                                <dd className="text-right text-foreground">
                                    {membershipPaymentStatusLabels[selectedRequest.paymentStatus]}
                                </dd>
                            </dl>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={confirmApprove}
                        >
                            Activar acceso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Modal visual de rechazo ────────────────────────────────── */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <DialogTitle>Rechazar solicitud de membresía</DialogTitle>
                            <DialogDescription>Esta acción no puede deshacerse.</DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Campo obligatorio: motivo del rechazo con contador */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="rejection-reason" className="text-sm font-medium text-foreground">
                            Motivo del rechazo *
                        </label>
                        <Textarea
                            id="rejection-reason"
                            placeholder="Ingrese el motivo del rechazo"
                            maxLength={MAX_REASON_LENGTH}
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            rows={4}
                        />
                        <span className="self-end text-xs text-muted-foreground">
                            {rejectionReason.length}/{MAX_REASON_LENGTH}
                        </span>
                    </div>

                    <Separator />

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={rejectionReason.trim().length === 0}
                            onClick={confirmReject}
                        >
                            Rechazar solicitud
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
