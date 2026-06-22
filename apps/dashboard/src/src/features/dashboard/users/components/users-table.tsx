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
import { MoreHorizontal, AlertTriangle, ChevronLeft, ChevronRight, Eye, UserPlus, Loader2 } from 'lucide-react';
import type { UserBase, ProfileType, KCRole } from '../types';

const roleLabels: Record<KCRole, string> = {
    admin: 'Admin',
    trainer: 'Trainer',
    member: 'Member',
};

const roleColors: Record<KCRole, string> = {
    admin: 'bg-primary/20 text-primary border-primary/30',
    trainer: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    member: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
};

const profileLabels: Record<ProfileType, string> = {
    MEMBER: 'Miembro',
    TRAINER: 'Entrenador',
    STAFF: 'Staff',
};

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
        admin: 'STAFF',
        trainer: 'TRAINER',
        member: 'MEMBER',
    };
    return user.roles.some((role) => !user.profiles.includes(roleToProfile[role]));
}

export function createUsersColumns(
    onNavigate: (path: string) => void,
    onCreateProfile: () => void,
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
            accessorKey: 'phone',
            header: 'Telefono',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || '—'}</span>,
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
                            <span title="Rol sin perfil asociado">
                                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            </span>
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
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.createdAt}</span>,
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const user = row.original;
                const mismatch = hasMismatch(user);
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
                                {mismatch && (
                                    <>
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-warning focus:text-warning"
                                            onClick={onCreateProfile}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Crear perfil
                                        </DropdownMenuItem>
                                    </>
                                )}
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
}

export function UsersDataTable({ table, isLoading = false }: UsersDataTableProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-muted-foreground font-semibold">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="h-32 text-center text-muted-foreground"
                                >
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
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No se encontraron usuarios.
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
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
