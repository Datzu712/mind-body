import { Link, useLocation } from '@tanstack/react-router';
import {
    LayoutDashboard,
    Users,
    UserSearch,
    UserRound,
    UsersRound,
    UserPlus,
    IdCard,
    ClipboardCheck,
    ClipboardList,
    Settings,
    FileBarChart,
    BookOpen,
    HardDrive,
    LogOut,
    Dumbbell,
    type LucideIcon,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mainNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
];

const adminNavItems: { title: string; href: string; icon: LucideIcon; exact?: boolean }[] = [
    {
        title: 'Usuarios',
        href: '/dashboard/users',
        icon: Users,
    },
    {
        title: 'Miembros',
        href: '/dashboard/members',
        icon: UserSearch,
        exact: true,
    },
    {
        title: 'Registrar miembro',
        href: '/dashboard/members/new',
        icon: UserPlus,
    },
    {
        title: 'Mi perfil',
        href: '/dashboard/profile',
        icon: UserRound,
        exact: true,
    },
    {
        title: 'Membresías',
        href: '/dashboard/memberships',
        icon: IdCard,
        exact: true,
    },
    {
        title: 'Aprobación de membresías',
        href: '/dashboard/memberships/approval',
        icon: ClipboardCheck,
    },
    {
        title: 'Mis miembros',
        href: '/dashboard/trainer/members',
        icon: UsersRound,
    },
    {
        title: 'Auditoría',
        href: '/dashboard/audit',
        icon: ClipboardList,
    },
    {
        title: 'Catálogo',
        href: '/dashboard/catalog',
        icon: BookOpen,
    },
    {
        title: 'Reportes',
        href: '/dashboard/reports',
        icon: FileBarChart,
    },
    {
        title: 'Respaldos',
        href: '/dashboard/backups',
        icon: HardDrive,
    },
    {
        title: 'Configuración',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function AppSidebar() {
    const pathname = useLocation().pathname;

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="p-4">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Dumbbell className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-lg font-bold text-foreground">Mind & Body</span>
                        <span className="text-xs text-muted-foreground">Admin Panel</span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">
                        Principal
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                                        <Link to={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">
                        Administración
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            pathname === item.href ||
                                            (!item.exact && pathname.startsWith(item.href + '/'))
                                        }
                                        tooltip={item.title}
                                    >
                                        <Link to={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-2">
                <SidebarSeparator className="mb-2" />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="w-full" tooltip="Perfil">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">CM</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                                <span className="text-sm font-medium">Carlos Mendoza</span>
                                <span className="text-xs text-muted-foreground">Administrador</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Cerrar sesión">
                            <Link to="/" className="text-muted-foreground hover:text-foreground">
                                <LogOut className="h-4 w-4" />
                                <span>Cerrar sesión</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
