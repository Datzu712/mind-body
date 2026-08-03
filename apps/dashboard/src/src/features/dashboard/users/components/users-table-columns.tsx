import type { ColumnDef } from '@tanstack/react-table';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal, AlertTriangle, Eye, UserPlus } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import { hasMismatch } from '../utils';
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

/** Domain-profile badges with a warning icon when a KC role lacks its profile. */
function ProfilesCell({ user }: { user: UserBase }) {
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
}

/** Per-row actions menu: view existing profiles and create missing ones. */
function UserRowActions({
    user,
    onNavigate,
    onCreateProfile,
    canCreateProfile,
}: {
    user: UserBase;
    onNavigate: (path: string) => void;
    onCreateProfile: (user: UserBase, type: ProfileType) => void;
    canCreateProfile: boolean;
}) {
    // Crear perfiles es ADMIN/STAFF en la API: sin ese rol no se ofrece la acción.
    const missing = canCreateProfile ? ALL_PROFILE_TYPES.filter((t) => !user.profiles.includes(t)) : [];
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
                    {user.profiles.length > 0 && missing.length > 0 && <DropdownMenuSeparator className="bg-border" />}
                    {missing.length > 0 && (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => onCreateProfile(user, missing[0])}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Agregar perfil
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function createUsersColumns(
    onNavigate: (path: string) => void,
    onCreateProfile: (user: UserBase, type: ProfileType) => void,
    canCreateProfile: boolean,
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
            cell: ({ row }) => <ProfilesCell user={row.original} />,
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
            cell: ({ row }) => (
                <UserRowActions
                    user={row.original}
                    onNavigate={onNavigate}
                    onCreateProfile={onCreateProfile}
                    canCreateProfile={canCreateProfile}
                />
            ),
        },
    ];
}
