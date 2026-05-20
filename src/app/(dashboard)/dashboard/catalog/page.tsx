'use client'

import { useState, useMemo } from 'react'
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header'
import { PageHeader } from '@/src/shared/components/page-header'
import { StatusBadge } from '@/src/shared/components/status-badge'
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog'
import { CatalogForm } from '@/src/features/dashboard/catalog/components/catalog-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, MoreHorizontal, Edit, Power, AlertTriangle, Users, DollarSign, Clock } from 'lucide-react'
import { mockCatalogItems, type CatalogItem } from '@/src/shared/lib/mock-data'
import { toast } from 'sonner'

const typeLabels: Record<CatalogItem['type'], string> = {
  class: 'Clases',
  plan: 'Planes',
  service: 'Servicios',
}

const typeColors: Record<CatalogItem['type'], string> = {
  class: 'bg-primary/20 text-primary border-primary/30',
  plan: 'bg-success/20 text-success border-success/30',
  service: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>(mockCatalogItems)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    item: CatalogItem | null
  }>({ open: false, item: null })

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      const matchesType = activeTab === 'all' || item.type === activeTab
      return matchesSearch && matchesType
    })
  }, [items, search, activeTab])

  const handleCreateItem = async (data: Partial<CatalogItem>) => {
    const newItem: CatalogItem = {
      id: String(items.length + 1),
      name: data.name || '',
      type: data.type || 'class',
      description: data.description || '',
      price: data.price || 0,
      capacity: data.capacity,
      duration: data.duration,
      status: 'active',
      activeUsers: 0,
    }

    setItems([...items, newItem])
    toast.success('Elemento creado exitosamente')
    return { success: true }
  }

  const handleEditItem = async (data: Partial<CatalogItem>) => {
    if (!editingItem) return { success: false, error: 'No hay elemento seleccionado' }

    setItems(
      items.map((item) =>
        item.id === editingItem.id ? { ...item, ...data } : item
      )
    )
    setEditingItem(null)
    toast.success('Elemento actualizado exitosamente')
    return { success: true }
  }

  const handleToggleStatus = () => {
    if (!confirmDialog.item) return

    const item = confirmDialog.item
    const hasActiveUsers = item.activeUsers && item.activeUsers > 0

    if (item.status === 'active' && hasActiveUsers) {
      toast.warning(`${item.name} tiene ${item.activeUsers} usuarios activos. Se les notificará del cambio.`)
    }

    setItems(
      items.map((i) =>
        i.id === item.id
          ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' }
          : i
      )
    )
    toast.success(
      item.status === 'active'
        ? `${item.name} ha sido desactivado`
        : `${item.name} ha sido activado`
    )
    setConfirmDialog({ open: false, item: null })
  }

  const openEditForm = (item: CatalogItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingItem(null)
    }
  }

  // Stats
  const stats = {
    classes: items.filter((i) => i.type === 'class' && i.status === 'active').length,
    plans: items.filter((i) => i.type === 'plan' && i.status === 'active').length,
    services: items.filter((i) => i.type === 'service' && i.status === 'active').length,
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Mind & Body', href: '/dashboard' },
          { label: 'Catálogo' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="Catálogo"
          description="Administra clases, planes y servicios del gimnasio"
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Elemento
            </Button>
          }
          className="mb-6"
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clases Activas</p>
                <p className="text-2xl font-bold text-foreground">{stats.classes}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planes Activos</p>
                <p className="text-2xl font-bold text-foreground">{stats.plans}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Servicios Activos</p>
                <p className="text-2xl font-bold text-foreground">{stats.services}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en el catálogo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary/50 border border-border">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="class">Clases</TabsTrigger>
              <TabsTrigger value="plan">Planes</TabsTrigger>
              <TabsTrigger value="service">Servicios</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Catalog Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`border-border bg-card ${
                item.status === 'inactive' ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {item.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={typeColors[item.type]}
                    >
                      {typeLabels[item.type]}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem
                        onClick={() => openEditForm(item)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={() => setConfirmDialog({ open: true, item })}
                        className={`cursor-pointer ${
                          item.status === 'active'
                            ? 'text-destructive focus:text-destructive'
                            : 'text-success focus:text-success'
                        }`}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {item.status === 'active' ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    ${item.price.toLocaleString()}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.capacity && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {item.capacity} cupos
                    </span>
                  )}
                  {item.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {item.duration}
                    </span>
                  )}
                </div>
                {item.activeUsers && item.activeUsers > 0 && (
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    {item.activeUsers} usuarios activos
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredItems.length} de {items.length} elementos
          </p>
        </div>

        {/* Catalog Form Modal */}
        <CatalogForm
          open={formOpen}
          onOpenChange={handleFormClose}
          item={editingItem}
          onSubmit={editingItem ? handleEditItem : handleCreateItem}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={
            confirmDialog.item?.status === 'active'
              ? 'Desactivar elemento'
              : 'Activar elemento'
          }
          description={
            confirmDialog.item?.status === 'active'
              ? confirmDialog.item?.activeUsers && confirmDialog.item.activeUsers > 0
                ? `${confirmDialog.item.name} tiene ${confirmDialog.item.activeUsers} usuarios activos. ¿Estás seguro de desactivarlo? Los usuarios serán notificados.`
                : `¿Estás seguro de desactivar ${confirmDialog.item?.name}? No estará disponible para nuevos usuarios.`
              : `¿Deseas activar ${confirmDialog.item?.name}? Estará disponible inmediatamente.`
          }
          confirmLabel={confirmDialog.item?.status === 'active' ? 'Desactivar' : 'Activar'}
          onConfirm={handleToggleStatus}
          variant={confirmDialog.item?.status === 'active' ? 'destructive' : 'default'}
        />
      </div>
    </>
  )
}
