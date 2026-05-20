'use client'

import { useState, useMemo, useEffect } from 'react'
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header'
import { PageHeader } from '@/src/shared/components/page-header'
import { UsersTable } from '@/src/features/dashboard/users/components/users-table'
import { UserForm } from '@/src/features/dashboard/users/components/user-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Filter } from 'lucide-react'
import { type User } from '@/src/shared/lib/mock-data'
import { getUsers } from '@/src/shared/lib/tauri-api'
import { toast } from 'sonner'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const handleCreateUser = async (data: Partial<User>) => {
    // Simulate checking for duplicate email
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === data.email?.toLowerCase()
    )
    if (emailExists) {
      return { success: false, error: 'Este correo ya está registrado en el sistema.' }
    }

    const newUser: User = {
      id: String(users.length + 1),
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'staff',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      avatar: data.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'NU',
    }

    setUsers([...users, newUser])
    toast.success('Usuario creado exitosamente')
    return { success: true }
  }

  const handleEditUser = async (data: Partial<User>) => {
    if (!editingUser) return { success: false, error: 'No hay usuario seleccionado' }

    // Check for duplicate email (excluding current user)
    const emailExists = users.some(
      (u) => u.id !== editingUser.id && u.email.toLowerCase() === data.email?.toLowerCase()
    )
    if (emailExists) {
      return { success: false, error: 'Este correo ya está registrado en el sistema.' }
    }

    setUsers(
      users.map((u) =>
        u.id === editingUser.id
          ? { ...u, ...data, avatar: data.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || u.avatar }
          : u
      )
    )
    setEditingUser(null)
    toast.success('Usuario actualizado exitosamente')
    return { success: true }
  }

  const handleToggleStatus = (user: User) => {
    setUsers(
      users.map((u) =>
        u.id === user.id
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u
      )
    )
    toast.success(
      user.status === 'active'
        ? `${user.name} ha sido desactivado`
        : `${user.name} ha sido activado`
    )
  }

  const openEditForm = (user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingUser(null)
    }
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Mind & Body', href: '/dashboard' },
          { label: 'Usuarios' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="Usuarios Internos"
          description="Gestiona los usuarios del sistema administrativo"
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          }
          className="mb-6"
        />

        {/* Filters */}
        <Card className="border-border bg-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px] bg-secondary/50 border-border">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-secondary/50 border-border">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>

        {/* Users Table */}
        <UsersTable
          users={filteredUsers}
          onEdit={openEditForm}
          onToggleStatus={handleToggleStatus}
        />

        {/* User Form Modal */}
        <UserForm
          open={formOpen}
          onOpenChange={handleFormClose}
          user={editingUser}
          onSubmit={editingUser ? handleEditUser : handleCreateUser}
        />
      </div>
    </>
  )
}
