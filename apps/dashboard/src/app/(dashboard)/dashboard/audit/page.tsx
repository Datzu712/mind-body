'use client'

import { useState, useMemo, useEffect } from 'react'
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header'
import { PageHeader } from '@/src/shared/components/page-header'
import { KPICard } from '@/src/shared/components/kpi-card'
import { EmptyState } from '@/src/shared/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, Search, Calendar, ClipboardList, Filter } from 'lucide-react'
import { mockAuditLogs, type User } from '@/src/shared/lib/mock-data'
import { getUsers } from '@/src/shared/lib/tauri-api'
import { toast } from 'sonner'

const actionColors: Record<string, string> = {
  CREATE: 'bg-success/20 text-success border-success/30',
  UPDATE: 'bg-primary/20 text-primary border-primary/30',
  DELETE: 'bg-destructive/20 text-destructive border-destructive/30',
  LOGIN: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  EXPORT: 'bg-warning/20 text-warning border-warning/30',
  BACKUP: 'bg-muted text-muted-foreground border-muted-foreground/30',
}

export default function AuditPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase())
      const matchesUser = userFilter === 'all' || log.userId === userFilter

      // Date filtering
      let matchesDate = true
      if (dateFrom || dateTo) {
        const logDate = new Date(log.timestamp.split(' ')[0])
        if (dateFrom) {
          matchesDate = matchesDate && logDate >= new Date(dateFrom)
        }
        if (dateTo) {
          matchesDate = matchesDate && logDate <= new Date(dateTo)
        }
      }

      return matchesSearch && matchesUser && matchesDate
    })
  }, [search, userFilter, dateFrom, dateTo])

  const handleExport = () => {
    toast.success('Exportando log de auditoría...')
    // Simulate export
    setTimeout(() => {
      toast.success('Archivo exportado exitosamente')
    }, 1500)
  }

  // Summary stats
  const todayLogs = mockAuditLogs.filter((log) => {
    const today = new Date().toISOString().split('T')[0]
    return log.timestamp.startsWith(today.replace(/-/g, '-'))
  }).length

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Mind & Body', href: '/dashboard' },
          { label: 'Auditoría' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="Registro de Auditoría"
          description="Supervisa todas las acciones realizadas en el sistema"
          actions={
            <Button onClick={handleExport} variant="outline" className="border-border">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          }
          className="mb-6"
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <KPICard
            label="Total Eventos"
            value={mockAuditLogs.length}
            icon="alert"
          />
          <KPICard
            label="Eventos Hoy"
            value={todayLogs || 4}
            icon="calendar"
          />
          <KPICard
            label="Usuarios Activos"
            value={new Set(mockAuditLogs.map((l) => l.userId)).size}
            icon="users"
          />
          <KPICard
            label="Módulos Afectados"
            value={new Set(mockAuditLogs.map((l) => l.module)).size}
            icon="user-cog"
          />
        </div>

        {/* Filters */}
        <Card className="border-border bg-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descripción o módulo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[180px] bg-secondary/50 border-border">
                      <SelectValue placeholder="Usuario" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[150px] bg-secondary/50 border-border"
                    placeholder="Desde"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[150px] bg-secondary/50 border-border"
                    placeholder="Hasta"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Table */}
        {filteredLogs.length === 0 ? (
          <Card className="border-border bg-card">
            <EmptyState
              icon={ClipboardList}
              title="Sin registros"
              description="No se encontraron registros de auditoría con los filtros seleccionados."
            />
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-muted-foreground font-semibold">Fecha/Hora</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Usuario</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Acción</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Módulo</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Descripción</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-border">
                    <TableCell className="text-muted-foreground text-sm">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {log.userName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={actionColors[log.action] || 'bg-muted text-muted-foreground'}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{log.module}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredLogs.length} de {mockAuditLogs.length} registros
          </p>
        </div>
      </div>
    </>
  )
}
