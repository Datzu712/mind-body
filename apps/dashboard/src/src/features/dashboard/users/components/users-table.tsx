'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/src/shared/components/status-badge'
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog'
import { MoreHorizontal, Edit, UserX, UserCheck } from 'lucide-react'
import type { User } from '@/src/shared/lib/mock-data'

interface UsersTableProps {
  users: User[]
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
}

const roleLabels: Record<User['role'], string> = {
  admin: 'Administrador',
  manager: 'Manager',
  staff: 'Staff',
}

export function UsersTable({ users, onEdit, onToggleStatus }: UsersTableProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: User | null
    action: 'activate' | 'deactivate'
  }>({ open: false, user: null, action: 'deactivate' })

  const handleConfirm = () => {
    if (confirmDialog.user) {
      onToggleStatus(confirmDialog.user)
    }
    setConfirmDialog({ open: false, user: null, action: 'deactivate' })
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Usuario</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Correo</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Rol</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Creado</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-foreground">{roleLabels[user.role]}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem
                        onClick={() => onEdit(user)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      {user.status === 'active' ? (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({ open: true, user, action: 'deactivate' })
                          }
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Desactivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({ open: true, user, action: 'activate' })
                          }
                          className="cursor-pointer text-success focus:text-success"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={
          confirmDialog.action === 'deactivate'
            ? 'Desactivar usuario'
            : 'Activar usuario'
        }
        description={
          confirmDialog.action === 'deactivate'
            ? `¿Estás seguro de desactivar a ${confirmDialog.user?.name}? El usuario perderá acceso al sistema.`
            : `¿Deseas activar a ${confirmDialog.user?.name}? El usuario recuperará acceso al sistema.`
        }
        confirmLabel={confirmDialog.action === 'deactivate' ? 'Desactivar' : 'Activar'}
        onConfirm={handleConfirm}
        variant={confirmDialog.action === 'deactivate' ? 'destructive' : 'default'}
      />
    </>
  )
}
