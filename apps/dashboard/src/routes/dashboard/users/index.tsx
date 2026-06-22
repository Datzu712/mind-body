import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useCallback } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { UsersDataTable, createUsersColumns } from '@/src/features/dashboard/users/components/users-table';
import { UsersFilterSheet, defaultFilters } from '@/src/features/dashboard/users/components/users-filter-sheet';
import { CreateUserModal } from '@/src/features/dashboard/users/components/create-user-modal';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { mockUsersUnified } from '@/src/features/dashboard/users/mock-data';
import type { UsersFilters } from '@/src/features/dashboard/users/components/users-filter-sheet';

export const Route = createFileRoute('/dashboard/users/')({
    component: UsersPage,
});

function countActiveFilters(f: UsersFilters): number {
    return [f.profile !== 'ALL', f.status !== 'ALL', f.name !== '', f.email !== '', f.phone !== ''].filter(Boolean)
        .length;
}

function UsersPage() {
    const navigate = useNavigate();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [filters, setFilters] = useState<UsersFilters>(defaultFilters);
    const [isFiltering, setIsFiltering] = useState(false);

    const applyFilters = useCallback((newFilters: UsersFilters) => {
        setIsFiltering(true);
        // Simulate network delay (remove when connected to real backend)
        setTimeout(() => {
            setFilters(newFilters);
            setIsFiltering(false);
        }, 400);
    }, []);

    const data = useMemo(() => {
        const nameLower = filters.name.toLowerCase();
        const emailLower = filters.email.toLowerCase();
        const phoneLower = filters.phone.toLowerCase();

        return mockUsersUnified.filter((user) => {
            if (filters.profile !== 'ALL' && !user.profiles.includes(filters.profile)) return false;
            if (filters.status !== 'ALL' && user.status !== filters.status) return false;
            if (nameLower && !user.fullName.toLowerCase().includes(nameLower)) return false;
            if (emailLower && !user.email.toLowerCase().includes(emailLower)) return false;
            if (phoneLower && !(user.phone ?? '').toLowerCase().includes(phoneLower)) return false;
            return true;
        });
    }, [filters]);

    const handleNavigate = useCallback(
        (path: string) => {
            void navigate({ to: path });
        },
        [navigate],
    );

    const handleCreateProfile = useCallback(() => {
        setCreateModalOpen(true);
    }, []);

    const columns = useMemo(
        () => createUsersColumns(handleNavigate, handleCreateProfile),
        [handleNavigate, handleCreateProfile],
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: 10 } },
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
                            <Button onClick={() => setCreateModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo usuario
                            </Button>
                        </div>
                    }
                    className="mb-6"
                />

                <p className="text-sm text-muted-foreground mb-4">
                    Mostrando {data.length} de {mockUsersUnified.length} usuarios
                </p>

                <UsersDataTable table={table} isLoading={isFiltering} />

                <UsersFilterSheet
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    filters={filters}
                    onApply={applyFilters}
                />
                <CreateUserModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
            </div>
        </>
    );
}
