'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { CatalogItem } from '@/src/shared/lib/mock-data'

interface CatalogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: CatalogItem | null
  onSubmit: (data: Partial<CatalogItem>) => Promise<{ success: boolean; error?: string }>
}

export function CatalogForm({ open, onOpenChange, item, onSubmit }: CatalogFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'class' as CatalogItem['type'],
    description: '',
    price: 0,
    capacity: undefined as number | undefined,
    duration: '',
    status: 'active' as CatalogItem['status'],
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        type: item.type,
        description: item.description,
        price: item.price,
        capacity: item.capacity,
        duration: item.duration || '',
        status: item.status,
      })
    } else {
      setFormData({
        name: '',
        type: 'class',
        description: '',
        price: 0,
        capacity: undefined,
        duration: '',
        status: 'active',
      })
    }
  }, [item, open])

  const isEditing = !!item

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await onSubmit({
        ...formData,
        capacity: formData.type === 'class' ? formData.capacity : undefined,
        duration: formData.type !== 'plan' ? formData.duration : undefined,
      })
      if (result.success) {
        onOpenChange(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Editar Elemento' : 'Nuevo Elemento'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? 'Modifica la información del elemento del catálogo.'
              : 'Completa los datos para agregar un nuevo elemento al catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del elemento"
                required
                className="bg-secondary/50 border-border"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as CatalogItem['type'] })
                }
              >
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="class">Clase</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el elemento..."
              className="bg-secondary/50 border-border min-h-[80px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Precio ($)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="bg-secondary/50 border-border"
              />
            </div>

            {formData.type === 'class' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity">Cupo máximo</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })
                  }
                  className="bg-secondary/50 border-border"
                />
              </div>
            )}

            {formData.type !== 'plan' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="duration">Duración</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="60 min"
                  className="bg-secondary/50 border-border"
                />
              </div>
            )}

            {isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as CatalogItem['status'] })
                  }
                >
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar cambios' : 'Crear elemento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
