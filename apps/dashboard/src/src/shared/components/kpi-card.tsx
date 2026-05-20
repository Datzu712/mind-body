'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Users,
  Calendar,
  Dumbbell,
  UserCog,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  LucideIcon,
} from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  calendar: Calendar,
  dumbbell: Dumbbell,
  'user-cog': UserCog,
  dollar: DollarSign,
  alert: AlertTriangle,
}

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  icon,
  className,
}: KPICardProps) {
  const Icon = iconMap[icon] || Users
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className={cn('border-border/50 bg-card', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm font-medium">
              {label}
            </span>
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {isPositive && (
                  <TrendingUp className="h-4 w-4 text-success" />
                )}
                {isNegative && (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPositive && 'text-success',
                    isNegative && 'text-destructive',
                    !isPositive && !isNegative && 'text-muted-foreground'
                  )}
                >
                  {isPositive && '+'}
                  {change}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground text-sm">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
