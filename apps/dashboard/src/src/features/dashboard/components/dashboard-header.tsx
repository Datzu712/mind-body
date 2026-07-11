import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/src/features/dashboard/components/command-palette';
import { useNotifications, useMarkNotificationRead } from '@/src/features/dashboard/hooks/use-notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface DashboardHeaderProps {
    breadcrumbs?: { label: string; href?: string }[];
}

function formatRelativeTime(iso: string) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return 'Hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
}

export function DashboardHeader({ breadcrumbs }: DashboardHeaderProps) {
    const { data: notifications = [] } = useNotifications();
    const markRead = useMarkNotificationRead();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const [cmdOpen, setCmdOpen] = useState(false);

    // Ctrl+K toggles the command palette from anywhere.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCmdOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />

            <Separator orientation="vertical" />

            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        {breadcrumbs.map((item, index) => (
                            <span key={index} className="contents">
                                {index > 0 && <BreadcrumbSeparator />}
                                <BreadcrumbItem>
                                    {item.href ? (
                                        <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground">
                                            <Link to={item.href}>{item.label}</Link>
                                        </BreadcrumbLink>
                                    ) : (
                                        <BreadcrumbPage className="text-foreground font-medium">
                                            {item.label}
                                        </BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>
                            </span>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            )}

            <div className="ml-auto flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => setCmdOpen(true)}
                    aria-label="Abrir búsqueda"
                    className="relative hidden h-9 w-64 items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:flex"
                >
                    <Search className="h-4 w-4" />
                    <span className="flex-1 text-left">Buscar...</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ⌘K
                    </kbd>
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                            <span className="sr-only">Notificaciones</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
                        <DropdownMenuLabel className="text-foreground">Notificaciones</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                                onClick={() => !notification.read && markRead.mutate(notification.id)}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    <span className="text-sm font-medium text-foreground">{notification.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(notification.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        </header>
    );
}
