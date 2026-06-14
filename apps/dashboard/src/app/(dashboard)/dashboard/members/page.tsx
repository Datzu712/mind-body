'use client';

import { useMemo, useState } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { MembersTable } from '@/src/features/dashboard/members/components/members-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Search,
    UserSearch,
    Users,
    FilterX,
    SearchX,
    Eye,
    Pencil,
    IdCard,
    CheckCircle2,
    AlertCircle,
    Info,
} from 'lucide-react';
import { mockMembers } from '@/src/shared/lib/mock-data';

export default function MembersPage() {
    // Estado de búsqueda y filtros (interactividad mock, sin backend)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [membershipFilter, setMembershipFilter] = useState('all');
    const [trainerFilter, setTrainerFilter] = useState('all');

    // Filtrado en cliente sobre datos mock — demuestra los 3 criterios de aceptación
    const filteredMembers = useMemo(
        () =>
            mockMembers.filter((member) => {
                const term = searchTerm.trim().toLowerCase();
                const matchesSearch =
                    term === '' ||
                    member.name.toLowerCase().includes(term) ||
                    member.email.toLowerCase().includes(term) ||
                    member.id.toLowerCase().includes(term);
                const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
                const matchesMembership = membershipFilter === 'all' || member.membership === membershipFilter;
                const matchesTrainer = trainerFilter === 'all' || member.trainer === trainerFilter;
                return matchesSearch && matchesStatus && matchesMembership && matchesTrainer;
            }),
        [searchTerm, statusFilter, membershipFilter, trainerFilter],
    );

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setMembershipFilter('all');
        setTrainerFilter('all');
    };

    const hasResults = filteredMembers.length > 0;

    return (
        <>
            {/* Breadcrumb superior: Inicio / Miembros / Buscar miembros */}
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Inicio', href: '/dashboard' },
                    { label: 'Miembros' },
                    { label: 'Buscar miembros' },
                ]}
            />

            <div className="flex-1 overflow-auto p-6">
                {/* Encabezado de página con título y badge de rol */}
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <UserSearch className="h-7 w-7 text-primary" />
                            HU-CLI-002 · Buscar miembros
                        </span>
                    }
                    description="Busca miembros registrados para consultar y gestionar su información."
                    actions={
                        <Badge variant="secondary" className="text-sm">
                            Administrador
                        </Badge>
                    }
                    className="mb-6"
                />

                {/* ── Card de búsqueda y filtros ───────────────────────────── */}
                <Card className="border-border bg-card mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            Buscar miembros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Formulario visual: sin submit real */}
                        <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
                            {/* Campo principal de búsqueda + botón Buscar */}
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre, correo o ID de miembro"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="pl-9 bg-secondary/50 border-border"
                                    />
                                </div>
                                <Button type="submit" className="sm:w-auto">
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar
                                </Button>
                            </div>

                            {/* Filtros visuales: Estado / Membresía / Entrenador + Limpiar */}
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                <div className="flex flex-1 flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Estado</label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="bg-secondary/50 border-border">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="active">Activo</SelectItem>
                                            <SelectItem value="inactive">Inactivo</SelectItem>
                                            <SelectItem value="pending">Pendiente</SelectItem>
                                            <SelectItem value="paused">En pausa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-1 flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Tipo de membresía
                                    </label>
                                    <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                                        <SelectTrigger className="bg-secondary/50 border-border">
                                            <SelectValue placeholder="Todas" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="basic-monthly">Básica Mensual</SelectItem>
                                            <SelectItem value="premium-monthly">Premium Mensual</SelectItem>
                                            <SelectItem value="premium-annual">Premium Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-1 flex-col gap-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Entrenador asignado
                                    </label>
                                    <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                                        <SelectTrigger className="bg-secondary/50 border-border">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                                            <SelectItem value="maria-gonzalez">María González</SelectItem>
                                            <SelectItem value="carlos-ramirez">Carlos Ramírez</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    <FilterX className="mr-2 h-4 w-4" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* ── Layout principal: resultados + columna lateral ───────── */}
                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    {/* Columna izquierda */}
                    <div className="flex flex-col gap-6">
                        {/* Card de resultados de la búsqueda */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle className="text-foreground">Resultados de la búsqueda</CardTitle>
                                    {/* Selector visual de paginación (mock) */}
                                    <Select defaultValue="10" disabled>
                                        <SelectTrigger className="w-[140px] bg-secondary/50 border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="10">10 por página</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Mostrando {filteredMembers.length} de {mockMembers.length} resultados
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {hasResults ? (
                                    <>
                                        <MembersTable members={filteredMembers} />

                                        {/* Paginación visual (mock, sin navegación real) */}
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Mostrando 1 a {filteredMembers.length} de {filteredMembers.length}{' '}
                                                resultados
                                            </p>
                                            <Pagination className="mx-0 w-auto justify-end">
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious href="#" />
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationLink href="#" isActive>
                                                            1
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationNext href="#" />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    </>
                                ) : (
                                    /* Empty state: búsqueda sin resultados */
                                    <Empty className="border border-dashed border-border">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon" className="text-warning">
                                                <SearchX />
                                            </EmptyMedia>
                                            <EmptyTitle>No se encontraron miembros con ese criterio.</EmptyTitle>
                                            <EmptyDescription>
                                                Revisa la ortografía o usa otros filtros.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── Sección "Acciones disponibles" ──────────────── */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Acciones disponibles</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                        <Eye className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Ver perfil</p>
                                        <p className="text-sm text-muted-foreground">
                                            Visualiza la información completa del miembro.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                        <Pencil className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Editar</p>
                                        <p className="text-sm text-muted-foreground">
                                            Edita la información básica del miembro.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                        <IdCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Gestionar membresía</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cambiar plan, estado o fecha de vencimiento.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna lateral */}
                    <div className="flex flex-col gap-6">
                        {/* Card lateral de resumen: Total de resultados */}
                        <Card className="border-border bg-card">
                            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Total de resultados</p>
                                <p className="text-4xl font-bold text-foreground">{filteredMembers.length}</p>
                                <p className="text-sm text-muted-foreground">miembros encontrados</p>
                            </CardContent>
                        </Card>

                        {/* ── Cards de criterios de aceptación ──────────────── */}
                        {/* Criterio 1: Búsqueda por nombre exitosa (success) */}
                        <Card className="border-success/30 bg-success/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-success">
                                    <CheckCircle2 className="h-5 w-5" />
                                    1) Búsqueda por nombre exitosa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-sm text-foreground">
                                    Los resultados se cargan en menos de 2 segundos y se muestran coincidencias
                                    relevantes.
                                </p>
                                <p className="text-xs text-muted-foreground">Coincidencias de ejemplo visibles.</p>
                            </CardContent>
                        </Card>

                        {/* Criterio 2: Búsqueda sin resultados (warning) */}
                        <Card className="border-warning/30 bg-warning/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-warning">
                                    <AlertCircle className="h-5 w-5" />
                                    2) Búsqueda sin resultados
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-sm text-foreground">No se encontraron miembros con ese criterio.</p>
                                <p className="text-xs text-muted-foreground">
                                    Revisa la ortografía o usa otros filtros.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Criterio 3: Búsqueda por ID (muted / primary) */}
                        <Card className="border-border bg-muted/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                                    <Info className="h-5 w-5 text-primary" />
                                    3) Búsqueda por ID
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <div className="flex flex-col gap-1 text-sm">
                                    <span className="font-mono text-xs text-muted-foreground">
                                        Ingresar ID exacto: MB-000123
                                    </span>
                                    <span className="text-primary">→</span>
                                    <span className="text-foreground">Acceso directo al perfil del miembro</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Al ingresar un ID exacto, se accede directamente al perfil del miembro.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Nota inferior */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Este wireframe muestra 3 estados de criterios de aceptación para HU-CLI-002.
                </p>
            </div>
        </>
    );
}
