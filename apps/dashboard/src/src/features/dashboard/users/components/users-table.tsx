import { flexRender, type ColumnDef, type Table as TTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    MoreHorizontal,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Eye,
    UserPlus,
    Loader2,
    ArrowUp,
    ArrowDown,
    ChevronsUpDown,
    Users as UsersIcon,
    X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { UserBase, ProfileType, KCRole } from '../types';

const roleLabels: Record<KCRole, string> = {
    ADMIN: 'Admin',
    TRAINER: 'Trainer',
    MEMBER: 'Member',
    STAFF: 'Staff',
};

const roleColors: Record<KCRole, string> = {
    ADMIN: 'bg-primary/20 text-primary border-primary/30',
    TRAINER: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    MEMBER: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
    // text-chart-4 (L≈0.55) fails contrast on the dark /20 badge bg (2.96:1);
    // a lighter amber keeps the staff hue and passes AA (5.7:1).
    STAFF: 'bg-chart-4/20 text-[#db9340] border-chart-4/30',
};

const profileLabels: Record<ProfileType, string> = {
    MEMBER: 'Miembro',
    TRAINER: 'Entrenador',
    STAFF: 'Staff',
};

const ALL_PROFILE_TYPES: ProfileType[] = ['MEMBER', 'TRAINER', 'STAFF'];

const profileRoutePrefix: Record<ProfileType, string> = {
    MEMBER: '/dashboard/users/members',
    TRAINER: '/dashboard/users/trainers',
    STAFF: '/dashboard/users/staff',
};

const statusLabels: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    ARCHIVED: 'Archivado',
};

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-success/20 text-success border-success/30',
    INACTIVE: 'bg-muted/50 text-muted-foreground border-border',
    ARCHIVED: 'bg-warning/20 text-warning border-warning/30',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function hasMismatch(user: UserBase): boolean {
    const roleToProfile: Record<KCRole, ProfileType> = {
        ADMIN: 'STAFF',
        TRAINER: 'TRAINER',
        MEMBER: 'MEMBER',
        STAFF: 'STAFF',
    };
    return user.roles.some((role) => !user.profiles.includes(roleToProfile[role]));
}

export function createUsersColumns(
    onNavigate: (path: string) => void,
    onCreateProfile: (user: UserBase, type: ProfileType) => void,
): ColumnDef<UserBase>[] {
    return [
        {
            accessorKey: 'fullName',
            header: 'Nombre',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(row.original.fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">{row.original.fullName}</span>
                        <span className="text-xs text-muted-foreground">{row.original.email}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'dni',
            header: 'Cedula',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.dni || '—'}</span>,
        },
        {
            accessorKey: 'roles',
            header: 'Roles (KC)',
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.roles.map((role) => (
                        <Badge key={role} variant="outline" className={`text-xs ${roleColors[role]}`}>
                            {roleLabels[role]}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            accessorKey: 'profiles',
            header: 'Perfiles (DB)',
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const user = row.original;
                const mismatch = hasMismatch(user);
                return (
                    <div className="flex flex-wrap items-center gap-1">
                        {user.profiles.length > 0 ? (
                            user.profiles.map((profile) => (
                                <Badge key={profile} variant="outline" className="text-xs border-border">
                                    {profileLabels[profile]}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground">Sin perfiles</span>
                        )}
                        {mismatch && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        tabIndex={0}
                                        role="img"
                                        aria-label="Rol sin perfil asociado"
                                        className="inline-flex rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Rol sin perfil asociado</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-xs ${statusColors[row.original.status]}`}>
                    {statusLabels[row.original.status]}
                </Badge>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Creado',
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{formatDate(row.original.createdAt)}</span>
            ),
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const user = row.original;
                const missing = ALL_PROFILE_TYPES.filter((t) => !user.profiles.includes(t));
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Acciones</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border min-w-[200px]">
                                {user.profiles.map((profile) => (
                                    <DropdownMenuItem
                                        key={profile}
                                        className="cursor-pointer"
                                        onClick={() => onNavigate(`${profileRoutePrefix[profile]}/${user.id}`)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver {profileLabels[profile].toLowerCase()}
                                    </DropdownMenuItem>
                                ))}
                                {user.profiles.length > 0 && missing.length > 0 && (
                                    <DropdownMenuSeparator className="bg-border" />
                                )}
                                {missing.map((type) => (
                                    <DropdownMenuItem
                                        key={type}
                                        className="cursor-pointer"
                                        onClick={() => onCreateProfile(user, type)}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Agregar perfil de {profileLabels[type].toLowerCase()}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}

interface UsersDataTableProps {
    table: TTable<UserBase>;
    isLoading?: boolean;
    isError?: boolean;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
}

export function UsersDataTable({
    table,
    isLoading = false,
    isError = false,
    hasActiveFilters = false,
    onClearFilters,
}: UsersDataTableProps) {
    const colSpan = table.getAllColumns().length;
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                                {headerGroup.headers.map((header) => {
                                    const sorted = header.column.getIsSorted();
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="text-muted-foreground font-semibold"
                                            aria-sort={
                                                sorted === 'asc'
                                                    ? 'ascending'
                                                    : sorted === 'desc'
                                                      ? 'descending'
                                                      : header.column.getCanSort()
                                                        ? 'none'
                                                        : undefined
                                            }
                                        >
                                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                <button
                                                    type="button"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {sorted === 'asc' ? (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                                                    )}
                                                </button>
                                            ) : (
                                                flexRender(header.column.columnDef.header, header.getContext())
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isError ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                                        <AlertTriangle className="h-6 w-6" />
                                        <span className="text-sm">
                                            No se pudieron cargar los usuarios. Reintentá más tarde.
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : isLoading ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="text-sm">Cargando usuarios...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="border-border">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={colSpan} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <UsersIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-foreground">
                                                No se encontraron usuarios
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {hasActiveFilters
                                                    ? 'Probá ajustar o limpiar los filtros aplicados.'
                                                    : 'Creá el primer usuario para comenzar.'}
                                            </p>
                                        </div>
                                        {hasActiveFilters && onClearFilters && (
                                            <Button variant="outline" size="sm" onClick={onClearFilters}>
                                                <X className="mr-2 h-4 w-4" />
                                                Limpiar filtros
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filas por pagina</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="w-[70px] h-8 bg-secondary/50 border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Página anterior</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Página siguiente</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
