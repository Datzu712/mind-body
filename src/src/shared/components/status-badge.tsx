import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'in-progress'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: 'Activo',
    className: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
  },
  inactive: {
    label: 'Inactivo',
    className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground/30',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
  },
  completed: {
    label: 'Completado',
    className: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
  },
  failed: {
    label: 'Fallido',
    className: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30',
  },
  'in-progress': {
    label: 'En progreso',
    className: 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
