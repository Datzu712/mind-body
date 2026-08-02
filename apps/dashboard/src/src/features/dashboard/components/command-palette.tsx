import { useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, Users, Dumbbell, CalendarDays, UserRound, type LucideIcon } from 'lucide-react';

import {
    Command,
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command';

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Usuarios', href: '/dashboard/users', icon: Users },
    { title: 'Clases', href: '/dashboard/classes', icon: Dumbbell },
    { title: 'Reservas', href: '/dashboard/reservations', icon: CalendarDays },
    { title: 'Mi perfil', href: '/dashboard/profile', icon: UserRound },
];

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();

    const go = (href: string) => {
        onOpenChange(false);
        void navigate({ to: href });
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Buscar"
            description="Navegá por el panel y ejecutá acciones"
        >
            <Command>
                <CommandInput placeholder="Buscar páginas y acciones..." />
                <CommandList>
                    <CommandEmpty>Sin resultados.</CommandEmpty>
                    <CommandGroup heading="Principal">
                        {navItems.map((item) => (
                            <CommandItem key={item.href} value={item.title} onSelect={() => go(item.href)}>
                                <item.icon />
                                <span>{item.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
