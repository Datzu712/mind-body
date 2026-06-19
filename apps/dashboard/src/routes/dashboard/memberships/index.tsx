import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { MembershipsTable } from '@/src/features/dashboard/memberships/components/memberships-table';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    IdCard,
    CircleCheck,
    CircleAlert,
    Hourglass,
    UserX,
    Search,
    Filter,
    Download,
    TriangleAlert,
    X,
} from 'lucide-react';
import { mockMemberships, type Membership } from '@/src/shared/lib/mock-data';

type VisualMessage = { tone: 'success' | 'warning'; title: string; text: string };

// KPIs estáticos (documentación visual; no derivados del mock)
const kpis = [
    {
        icon: CircleCheck,
        label: 'Membresías activas',
        value: '126',
        description: 'Miembros con acceso activo',
        tone: 'success' as const,
    },
    {
        icon: CircleAlert,
        label: 'Membresías vencidas',
        value: '18',
        description: 'Acceso restringido',
        tone: 'destructive' as const,
    },
    {
        icon: Hourglass,
        label: 'Próximas a vencer',
        value: '34',
        description: 'En los próximos 7 días',
        tone: 'warning' as const,
    },
    {
        icon: UserX,
        label: 'Membresías inactivas',
        value: '22',
        description: 'Sin acceso programado',
        tone: 'muted' as const,
    },
];

const kpiIconClasses: Record<'success' | 'destructive' | 'warning' | 'muted', string> = {
    success: 'bg-success/15 text-success',
    destructive: 'bg-destructive/15 text-destructive',
    warning: 'bg-warning/15 text-warning',
    muted: 'bg-muted text-muted-foreground',
};

export const Route = createFileRoute('/dashboard/memberships/')({
    component: MembershipsPage,
});

function MembershipsPage() {
    // Interactividad mock (sin backend)
    const [searchTerm, setSearchTerm] = useState('');
    const [visualMessage, setVisualMessage] = useState<VisualMessage | null>(null);
    const [deactivateTarget, setDeactivateTarget] = useState<Membership | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Desactivar pide confirmación antes de aplicar (mock)
    const requestDeactivate = (membership: Membership) => {
        setDeactivateTarget(membership);
        setConfirmOpen(true);
    };

    const confirmDeactivate = () => {
        setConfirmOpen(false);
        setVisualMessage({
            tone: 'warning',
            title: 'Desactivación de membresía vencida',
            text: 'La membresía vencida restringirá el acceso del miembro.',
        });
    };

    return (
        <>
            {/* Breadcrumb: Inicio / Membresías / Gestión de membresías */}
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Inicio', href: '/dashboard' },
                    { label: 'Membresías' },
                    { label: 'Gestión de membresías' },
                ]}
            />

            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <IdCard className="h-7 w-7 text-primary" />
                            HU-CLI-005 · Gestión de membresías
                        </span>
                    }
                    description="Gestiona visualmente las membresías activas, vencidas, próximas a vencer e inactivas."
                    actions={
                        <Badge variant="secondary" className="text-sm">
                            Administrador
                        </Badge>
                    }
                    className="mb-6"
                />

                <div className="space-y-6">
                    {/* Alert visual mock (desactivación) */}
                    {visualMessage && (
                        <Alert
                            className={
                                visualMessage.tone === 'success'
                                    ? 'border-success/30 bg-success/10'
                                    : 'border-warning/30 bg-warning/10'
                            }
                        >
                            {visualMessage.tone === 'success' ? (
                                <CircleCheck className="text-success" />
                            ) : (
                                <TriangleAlert className="text-warning" />
                            )}
                            <AlertTitle className={visualMessage.tone === 'success' ? 'text-success' : 'text-warning'}>
                                {visualMessage.title}
                            </AlertTitle>
                            <AlertDescription>{visualMessage.text}</AlertDescription>
                        </Alert>
                    )}

                    {/* KPIs superiores */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {kpis.map((kpi) => (
                            <Card key={kpi.label} className="border-border bg-card">
                                <CardContent className="flex items-start gap-4 p-6">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${kpiIconClasses[kpi.tone]}`}
                                    >
                                        <kpi.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                                        <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                                        <p className="text-xs text-muted-foreground">{kpi.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Card principal: Listado de membresías */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <CardTitle className="text-foreground">Listado de membresías</CardTitle>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar miembro..."
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            className="pl-9 bg-secondary/50 border-border sm:w-64"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Filtros: panel lateral (Sheet) */}
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button type="button" variant="outline">
                                                    <Filter className="mr-2 h-4 w-4" />
                                                    Filtros
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent side="right" className="w-full sm:max-w-sm">
                                                <SheetHeader>
                                                    <SheetTitle>Filtros</SheetTitle>
                                                    <SheetDescription>
                                                        Refina el listado de membresías.
                                                    </SheetDescription>
                                                </SheetHeader>

                                                <div className="flex flex-col gap-4 overflow-auto px-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <Label htmlFor="filter-name">Nombre del miembro</Label>
                                                        <Input
                                                            id="filter-name"
                                                            placeholder="Ingrese un nombre"
                                                            className="bg-secondary/50 border-border"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <Label htmlFor="filter-id">Número de miembro</Label>
                                                        <Input
                                                            id="filter-id"
                                                            placeholder="Ej. MB-000123"
                                                            className="bg-secondary/50 border-border"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <Label>Estado</Label>
                                                        <Select defaultValue="all">
                                                            <SelectTrigger className="bg-secondary/50 border-border">
                                                                <SelectValue placeholder="Todos" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border">
                                                                <SelectItem value="all">Todos</SelectItem>
                                                                <SelectItem value="active">Activa</SelectItem>
                                                                <SelectItem value="expired">Vencida</SelectItem>
                                                                <SelectItem value="expiring-soon">
                                                                    Próxima a vencer
                                                                </SelectItem>
                                                                <SelectItem value="inactive">Inactiva</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <Label htmlFor="filter-start">Fecha de inicio</Label>
                                                            <Input
                                                                id="filter-start"
                                                                placeholder="dd/mm/aaaa"
                                                                className="bg-secondary/50 border-border"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <Label htmlFor="filter-end">Fecha de vencimiento</Label>
                                                            <Input
                                                                id="filter-end"
                                                                placeholder="dd/mm/aaaa"
                                                                className="bg-secondary/50 border-border"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <SheetFooter className="flex-row gap-2">
                                                    <SheetClose asChild>
                                                        <Button type="button" className="flex-1">
                                                            <Search className="mr-2 h-4 w-4" />
                                                            Aplicar filtros
                                                        </Button>
                                                    </SheetClose>
                                                    <SheetClose asChild>
                                                        <Button type="button" variant="outline" className="flex-1">
                                                            <X className="mr-2 h-4 w-4" />
                                                            Limpiar filtros
                                                        </Button>
                                                    </SheetClose>
                                                </SheetFooter>
                                            </SheetContent>
                                        </Sheet>

                                        <Button type="button" variant="outline">
                                            <Download className="mr-2 h-4 w-4" />
                                            Exportar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <MembershipsTable
                                memberships={mockMemberships}
                                onDeactivate={requestDeactivate}
                                onViewHistory={() => {
                                    /* no-op visual */
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Cards de criterios de aceptación */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-success/30 bg-success/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-success">
                                    <CircleCheck className="h-5 w-5" />
                                    Visualización de membresías activas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground">
                                    La membresía activa permite el acceso completo a las instalaciones y servicios.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-warning/30 bg-warning/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-warning">
                                    <TriangleAlert className="h-5 w-5" />
                                    Desactivación de membresía vencida
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground">
                                    La membresía vencida restringirá el acceso del miembro.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Nota inferior */}
                    <p className="text-center text-xs text-muted-foreground">
                        Este wireframe documenta los estados de criterios de aceptación para HU-CLI-005.
                    </p>
                </div>
            </div>

            {/* Confirmación de desactivación (sin backend) */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Desactivar membresía"
                description={
                    deactivateTarget
                        ? `Se desactivará la membresía de ${deactivateTarget.memberName} (${deactivateTarget.memberId}). El miembro perderá el acceso.`
                        : 'Se desactivará la membresía seleccionada.'
                }
                confirmLabel="Desactivar"
                cancelLabel="Cancelar"
                variant="destructive"
                onConfirm={confirmDeactivate}
            />
        </>
    );
}
