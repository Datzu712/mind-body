import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useCallback } from 'react';
import { useReactTable, getCoreRowModel, type SortingState, type PaginationState } from '@tanstack/react-table';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { UsersDataTable, createUsersColumns } from '@/src/features/dashboard/users/components/users-table';
import { UsersFilterSheet, defaultFilters } from '@/src/features/dashboard/users/components/users-filter-sheet';
import { UsersActiveFilters } from '@/src/features/dashboard/users/components/users-active-filters';
import { CreateUserModal } from '@/src/features/dashboard/users/components/create-user-modal';
import { CreateProfileModal } from '@/src/features/dashboard/users/components/create-profile-modal';
import type { UserBase, ProfileType } from '@/src/features/dashboard/users/types';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { useUsers, type UsersFilters as ApiFilters } from '@/src/features/dashboard/users/hooks';
import { useAuth, isManagementRole } from '@/hooks/use-auth';
import type { UsersFilters } from '@/src/features/dashboard/users/components/users-filter-sheet';

const ALL_PROFILE_TYPES: ProfileType[] = ['MEMBER', 'TRAINER', 'STAFF'];

export const Route = createFileRoute('/dashboard/users/')({
    component: UsersPage,
});

function countActiveFilters(f: UsersFilters): number {
    return [
        f.profile !== 'ALL',
        f.status !== 'ALL',
        f.name !== '',
        f.email !== '',
        f.phone !== '',
        f.dni !== '',
    ].filter(Boolean).length;
}

function toApiFilters(f: UsersFilters): ApiFilters {
    return {
        name: f.name || undefined,
        email: f.email || undefined,
        phone: f.phone || undefined,
        dni: f.dni || undefined,
        profile: f.profile !== 'ALL' ? f.profile : undefined,
        status: f.status !== 'ALL' ? f.status : undefined,
    };
}

function UsersPage() {
    const navigate = useNavigate();
    // Crear usuarios y perfiles es ADMIN/STAFF en la API; el TRAINER solo consulta.
    const { user: authUser } = useAuth();
    const canManage = isManagementRole(authUser?.roles);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [profileModalUser, setProfileModalUser] = useState<{ user: UserBase; type: ProfileType } | null>(null);
    const [filters, setFilters] = useState<UsersFilters>(defaultFilters);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

    const apiFilters = useMemo<ApiFilters>(() => {
        const sort = sorting[0];
        return {
            ...toApiFilters(filters),
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            ...(sort && {
                sortBy: sort.id as ApiFilters['sortBy'],
                sortDir: sort.desc ? 'desc' : 'asc',
            }),
        };
    }, [filters, sorting, pagination]);

    const { data: response, isLoading, isError } = useUsers(apiFilters);
    const users = useMemo(() => response?.data ?? [], [response]);

    // Filtering or sorting changes the result set, so jump back to the first page.
    const handleApplyFilters = useCallback((next: UsersFilters) => {
        setFilters(next);
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, []);

    const handleNavigate = useCallback(
        (path: string) => {
            void navigate({ to: path });
        },
        [navigate],
    );

    const handleCreateProfile = useCallback((user: UserBase, type: ProfileType) => {
        setProfileModalUser({ user, type });
    }, []);

    const columns = useMemo(
        () => createUsersColumns(handleNavigate, handleCreateProfile, canManage),
        [handleNavigate, handleCreateProfile, canManage],
    );

    const table = useReactTable({
        data: users,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
        manualPagination: true,
        rowCount: response?.total ?? 0,
        state: { sorting, pagination },
        onSortingChange: (updater) => {
            setSorting(updater);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
        },
        onPaginationChange: setPagination,
    });

    const activeCount = countActiveFilters(filters);

    return (
        <>
            <DashboardHeader breadcrumbs={[{ label: 'Mind & Body', href: '/dashboard' }, { label: 'Usuarios' }]} />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Usuarios"
                    description="Gestiona todos los usuarios del sistema y sus perfiles de dominio"
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setSheetOpen(true)}>
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Filtros
                                {activeCount > 0 && (
                                    <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                        {activeCount}
                                    </span>
                                )}
                            </Button>
                            {canManage && (
                                <Button onClick={() => setCreateModalOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo usuario
                                </Button>
                            )}
                        </div>
                    }
                    className="mb-6"
                />

                <UsersActiveFilters filters={filters} onChange={handleApplyFilters} />

                <p className="text-sm text-muted-foreground mb-4">
                    {response
                        ? users.length > 0
                            ? `Mostrando ${pagination.pageIndex * pagination.pageSize + 1}–${
                                  pagination.pageIndex * pagination.pageSize + users.length
                              } de ${response.total} usuarios`
                            : `0 de ${response.total} usuarios`
                        : 'Cargando...'}
                </p>

                <UsersDataTable
                    table={table}
                    isLoading={isLoading}
                    isError={isError}
                    hasActiveFilters={activeCount > 0}
                    onClearFilters={() => handleApplyFilters(defaultFilters)}
                />

                <UsersFilterSheet
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    filters={filters}
                    onApply={handleApplyFilters}
                />
                {canManage && <CreateUserModal open={createModalOpen} onOpenChange={setCreateModalOpen} />}
                {profileModalUser && (
                    <CreateProfileModal
                        key={`${profileModalUser.user.id}-${profileModalUser.type}`}
                        open
                        onOpenChange={(o) => {
                            if (!o) setProfileModalUser(null);
                        }}
                        userId={profileModalUser.user.id}
                        userName={profileModalUser.user.fullName}
                        suggestedType={profileModalUser.type}
                        availableTypes={ALL_PROFILE_TYPES.filter((t) => !profileModalUser.user.profiles.includes(t))}
                    />
                )}
            </div>
        </>
    );
}
