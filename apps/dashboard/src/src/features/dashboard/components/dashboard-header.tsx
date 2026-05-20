'use client'

import { Bell, Search } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface DashboardHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
}

const notifications = [
  { id: 1, title: 'Nueva membresía registrada', time: 'Hace 5 min', read: false },
  { id: 2, title: 'Respaldo automático completado', time: 'Hace 1 hora', read: false },
  { id: 3, title: 'Usuario desactivado', time: 'Hace 2 horas', read: true },
]

export function DashboardHeader({ breadcrumbs }: DashboardHeaderProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      
      <Separator orientation="vertical" className="h-6" />

      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <span key={index} className="contents">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-foreground">
                      {item.label}
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
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="w-64 pl-9 bg-secondary/50 border-border focus:bg-background"
          />
        </div>

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
              >
                <div className="flex items-center gap-2 w-full">
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {notification.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.time}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-center text-sm text-primary cursor-pointer">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
