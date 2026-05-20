'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header'
import { PageHeader } from '@/src/shared/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { mockSettings } from '@/src/shared/lib/mock-data'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [settings, setSettings] = useState(mockSettings)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const validateSettings = () => {
    const newErrors: Record<string, string> = {}

    if (!settings.general.gymName.trim()) {
      newErrors.gymName = 'El nombre del gimnasio es requerido'
    }
    if (!settings.general.email.includes('@')) {
      newErrors.email = 'Ingresa un correo válido'
    }
    if (settings.security.minPasswordLength < 6) {
      newErrors.minPasswordLength = 'La longitud mínima debe ser al menos 6'
    }
    if (settings.security.sessionTimeout < 5) {
      newErrors.sessionTimeout = 'El tiempo de sesión debe ser al menos 5 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    setSuccess(false)
    if (!validateSettings()) {
      toast.error('Por favor corrige los errores antes de guardar')
      return
    }

    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setSuccess(true)
    toast.success('Configuración guardada exitosamente')
  }

  const handleRestore = () => {
    setSettings(mockSettings)
    setErrors({})
    setSuccess(false)
    toast.success('Configuración restaurada a valores predeterminados')
  }

  const updateGeneral = (key: keyof typeof settings.general, value: string) => {
    setSettings({
      ...settings,
      general: { ...settings.general, [key]: value },
    })
    setErrors({ ...errors, [key]: '' })
    setSuccess(false)
  }

  const updateNotifications = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
    setSuccess(false)
  }

  const updateSecurity = (key: keyof typeof settings.security, value: number | boolean) => {
    setSettings({
      ...settings,
      security: { ...settings.security, [key]: value },
    })
    setErrors({ ...errors, [key]: '' })
    setSuccess(false)
  }

  const updateBackup = (key: keyof typeof settings.backup, value: string | boolean | number) => {
    setSettings({
      ...settings,
      backup: { ...settings.backup, [key]: value },
    })
    setSuccess(false)
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Mind & Body', href: '/dashboard' },
          { label: 'Configuración' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="Configuración del Sistema"
          description="Administra los parámetros operativos del gimnasio"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleRestore} className="border-border">
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </div>
          }
          className="mb-6"
        />

        {success && (
          <Alert className="mb-6 border-success/50 bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Los cambios han sido guardados correctamente.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-secondary/50 border border-border mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="backup">Respaldos</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Configura los datos básicos del gimnasio</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="gymName">Nombre del Gimnasio</Label>
                    <Input
                      id="gymName"
                      value={settings.general.gymName}
                      onChange={(e) => updateGeneral('gymName', e.target.value)}
                      className={`bg-secondary/50 border-border ${errors.gymName ? 'border-destructive' : ''}`}
                    />
                    {errors.gymName && (
                      <span className="text-sm text-destructive">{errors.gymName}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Correo de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.general.email}
                      onChange={(e) => updateGeneral('email', e.target.value)}
                      className={`bg-secondary/50 border-border ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && (
                      <span className="text-sm text-destructive">{errors.email}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={settings.general.phone}
                      onChange={(e) => updateGeneral('phone', e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={settings.general.address}
                      onChange={(e) => updateGeneral('address', e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="openingTime">Hora de Apertura</Label>
                    <Input
                      id="openingTime"
                      type="time"
                      value={settings.general.openingTime}
                      onChange={(e) => updateGeneral('openingTime', e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="closingTime">Hora de Cierre</Label>
                    <Input
                      id="closingTime"
                      type="time"
                      value={settings.general.closingTime}
                      onChange={(e) => updateGeneral('closingTime', e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Preferencias de Notificación</CardTitle>
                <CardDescription>Configura cómo recibir alertas del sistema</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">Notificaciones por Email</p>
                    <p className="text-sm text-muted-foreground">Recibe alertas importantes por correo</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateNotifications('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">Notificaciones SMS</p>
                    <p className="text-sm text-muted-foreground">Recibe mensajes de texto urgentes</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateNotifications('smsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">Notificaciones Push</p>
                    <p className="text-sm text-muted-foreground">Alertas en tiempo real en el navegador</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateNotifications('pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">Emails de Marketing</p>
                    <p className="text-sm text-muted-foreground">Novedades y promociones del sistema</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={(checked) => updateNotifications('marketingEmails', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Configura las políticas de seguridad del sistema</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min={5}
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value) || 0)}
                      className={`bg-secondary/50 border-border ${errors.sessionTimeout ? 'border-destructive' : ''}`}
                    />
                    {errors.sessionTimeout && (
                      <span className="text-sm text-destructive">{errors.sessionTimeout}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="passwordExpiry">Expiración de Contraseña (días)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      min={0}
                      value={settings.security.passwordExpiry}
                      onChange={(e) => updateSecurity('passwordExpiry', parseInt(e.target.value) || 0)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="minPasswordLength">Longitud Mínima de Contraseña</Label>
                    <Input
                      id="minPasswordLength"
                      type="number"
                      min={6}
                      value={settings.security.minPasswordLength}
                      onChange={(e) => updateSecurity('minPasswordLength', parseInt(e.target.value) || 0)}
                      className={`bg-secondary/50 border-border ${errors.minPasswordLength ? 'border-destructive' : ''}`}
                    />
                    {errors.minPasswordLength && (
                      <span className="text-sm text-destructive">{errors.minPasswordLength}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">Autenticación de Dos Factores</p>
                    <p className="text-sm text-muted-foreground">Requiere código adicional al iniciar sesión</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSecurity('twoFactorAuth', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Configuración de Respaldos</CardTitle>
                <CardDescription>Administra los respaldos automáticos del sistema</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">Respaldos Automáticos</p>
                    <p className="text-sm text-muted-foreground">Genera respaldos de forma automática</p>
                  </div>
                  <Switch
                    checked={settings.backup.autoBackup}
                    onCheckedChange={(checked) => updateBackup('autoBackup', checked)}
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                    <Select
                      value={settings.backup.backupFrequency}
                      onValueChange={(value) => updateBackup('backupFrequency', value)}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="hourly">Cada hora</SelectItem>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="backupTime">Hora del Respaldo</Label>
                    <Input
                      id="backupTime"
                      type="time"
                      value={settings.backup.backupTime}
                      onChange={(e) => updateBackup('backupTime', e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="retentionDays">Días de Retención</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      min={1}
                      value={settings.backup.retentionDays}
                      onChange={(e) => updateBackup('retentionDays', parseInt(e.target.value) || 0)}
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
