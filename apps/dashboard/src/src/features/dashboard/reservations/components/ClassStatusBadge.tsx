import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Clock,
    XCircle,
    CircleSlash,
    Users,
    UserCheck,
    UserX,
    ListOrdered,
    type LucideIcon,
} from 'lucide-react';
import type { ClassStatus } from '../mock-classes';
import type { ReservationStatus } from '../mock-reservations';

/** Union of the reservation states and the class-management states. */
export type ClassBadgeStatus = ReservationStatus | ClassStatus;

const config: Record<ClassBadgeStatus, { label: string; icon: LucideIcon; className: string }> = {
    // Reservation states
    confirmada: {
        label: 'Confirmada',
        icon: CheckCircle2,
        className: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    },
    'en-espera': {
        label: 'En espera',
        icon: Clock,
        className: 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
    },
    asistio: {
        label: 'Asistió',
        icon: UserCheck,
        className: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    },
    falto: {
        label: 'Faltó',
        icon: UserX,
        className: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30',
    },
    cancelada: {
        label: 'Cancelada',
        icon: XCircle,
        className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground/30',
    },
    // Class management states
    active: {
        label: 'Activa',
        icon: CheckCircle2,
        className: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    },
    inactive: {
        label: 'Inactiva',
        icon: CircleSlash,
        className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground/30',
    },
    full: {
        label: 'Cupo lleno',
        icon: Users,
        className: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30',
    },
    waitlist: {
        label: 'Lista de espera',
        icon: ListOrdered,
        className: 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
    },
};

interface ClassStatusBadgeProps {
    status: ClassBadgeStatus;
    className?: string;
}

/**
 * Status badge that always pairs icon + color + label, so state is never
 * communicated by color alone. Covers both reservations and managed classes.
 */
export function ClassStatusBadge({ status, className }: ClassStatusBadgeProps) {
    const { label, icon: Icon, className: cls } = config[status];
    return (
        <Badge variant="outline" className={cn('gap-1 border font-medium', cls, className)}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
        </Badge>
    );
}
