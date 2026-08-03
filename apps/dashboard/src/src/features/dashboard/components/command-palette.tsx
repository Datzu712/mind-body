import { useNavigate } from '@tanstack/react-router';
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CalendarDays,
    BicepsFlexed,
    ClipboardList,
    type LucideIcon,
} from 'lucide-react';

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
    group: 'Principal' | 'Entrenamiento';
    title: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { group: 'Principal', title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { group: 'Principal', title: 'Usuarios', href: '/dashboard/users', icon: Users },
    { group: 'Principal', title: 'Clases', href: '/dashboard/classes', icon: Dumbbell },
    { group: 'Principal', title: 'Reservas', href: '/dashboard/reservations', icon: CalendarDays },
    { group: 'Entrenamiento', title: 'Ejercicios', href: '/dashboard/exercises', icon: BicepsFlexed },
    { group: 'Entrenamiento', title: 'Rutinas', href: '/dashboard/routines', icon: ClipboardList },
];

const groups: NavItem['group'][] = ['Principal', 'Entrenamiento'];

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
                    {groups.map((group) => (
                        <CommandGroup key={group} heading={group}>
                            {navItems
                                .filter((item) => item.group === group)
                                .map((item) => (
                                    <CommandItem key={item.href} value={item.title} onSelect={() => go(item.href)}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    ))}
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
