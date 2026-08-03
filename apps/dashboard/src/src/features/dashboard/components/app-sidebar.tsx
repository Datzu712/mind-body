import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Users, CalendarDays, Dumbbell, LogOut, BicepsFlexed, type LucideIcon } from 'lucide-react';

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
import { useAuth } from '@/hooks/use-auth';

const mainNavItems: { title: string; href: string; icon: LucideIcon; exact?: boolean }[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        exact: true,
    },
    {
        title: 'Usuarios',
        href: '/dashboard/users',
        icon: Users,
    },
    {
        title: 'Clases',
        href: '/dashboard/classes',
        icon: Dumbbell,
    },
    {
        title: 'Reservas',
        href: '/dashboard/reservations',
        icon: CalendarDays,
    },
];

const trainingNavItems: { title: string; href: string; icon: LucideIcon; exact?: boolean }[] = [
    {
        title: 'Ejercicios',
        href: '/dashboard/exercises',
        icon: BicepsFlexed,
    },
    // Futuro: { title: 'Rutinas', href: '/dashboard/routines', ... }
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

function getRoleLabel(roles: string[]): string {
    if (roles.includes('STAFF')) return 'Staff';
    if (roles.includes('TRAINER')) return 'Entrenador';
    return 'Usuario';
}

export function AppSidebar() {
    const pathname = useLocation().pathname;
    const { user, logout } = useAuth();

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-4 py-0">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center">
                        <img src="/icon-no-bg.png" alt="Mind & Body" className="h-12 w-12 object-contain" />
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-lg font-bold text-foreground">Mind & Body</span>
                        <span className="text-xs text-muted-foreground">Admin Panel</span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">
                        Principal
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            item.exact
                                                ? pathname === item.href
                                                : pathname === item.href || pathname.startsWith(item.href + '/')
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

                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">
                        Entrenamiento
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {trainingNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            item.exact
                                                ? pathname === item.href
                                                : pathname === item.href || pathname.startsWith(item.href + '/')
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
                        <SidebarMenuButton size="lg" className="w-full" tooltip={user?.fullName ?? 'Perfil'}>
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {user ? getInitials(user.fullName) : '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
                                <span className="w-full truncate text-sm font-medium">
                                    {user?.fullName ?? 'Cargando...'}
                                </span>
                                <span className="w-full truncate text-xs text-muted-foreground">
                                    {user ? getRoleLabel(user.roles) : ''}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Cerrar sesión"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => void logout()}
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Cerrar sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
