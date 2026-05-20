'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  ClipboardList,
  BookOpen,
  FileBarChart,
  HardDrive,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const quickActions = [
  {
    title: 'Usuarios',
    description: 'Gestionar usuarios internos',
    href: '/dashboard/users',
    icon: Users,
    color: 'bg-chart-3/20 text-chart-3',
  },
  {
    title: 'Auditoría',
    description: 'Revisar logs del sistema',
    href: '/dashboard/audit',
    icon: ClipboardList,
    color: 'bg-warning/20 text-warning',
  },
  {
    title: 'Catálogo',
    description: 'Clases, planes y servicios',
    href: '/dashboard/catalog',
    icon: BookOpen,
    color: 'bg-primary/20 text-primary',
  },
  {
    title: 'Reportes',
    description: 'Generar informes',
    href: '/dashboard/reports',
    icon: FileBarChart,
    color: 'bg-success/20 text-success',
  },
  {
    title: 'Respaldos',
    description: 'Backups y restauración',
    href: '/dashboard/backups',
    icon: HardDrive,
    color: 'bg-chart-5/20 text-chart-5',
  },
  {
    title: 'Configuración',
    description: 'Ajustes del sistema',
    href: '/dashboard/settings',
    icon: Settings,
    color: 'bg-muted text-muted-foreground',
  },
]

export function QuickActions() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Accesos Rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-start p-4 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-all border border-transparent hover:border-primary/20"
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg mb-3',
                  action.color
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground mb-1">
                {action.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {action.description}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-2 transition-colors" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
