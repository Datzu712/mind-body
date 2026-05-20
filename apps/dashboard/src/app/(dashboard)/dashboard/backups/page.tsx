'use client'

import { useState, useRef } from 'react'
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header'
import { PageHeader } from '@/src/shared/components/page-header'
import { StatusBadge } from '@/src/shared/components/status-badge'
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  HardDrive,
  Download,
  Upload,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileArchive,
  Calendar,
  Database,
} from 'lucide-react'
import { mockBackups, type Backup } from '@/src/shared/lib/mock-data'
import { toast } from 'sonner'

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>(mockBackups)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean
    backup: Backup | null
  }>({ open: false, backup: null })
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerateBackup = async () => {
    setGenerating(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // Simulate backup generation
    await new Promise((resolve) => setTimeout(resolve, 3500))
    clearInterval(interval)
    setProgress(100)

    const newBackup: Backup = {
      id: String(backups.length + 1),
      name: `backup_${new Date().toISOString().split('T')[0]}_manual.sql`,
      size: '257 MB',
      createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
      status: 'completed',
      type: 'manual',
    }

    setBackups([newBackup, ...backups])
    setGenerating(false)
    setProgress(0)
    toast.success('Respaldo generado exitosamente')
  }

  const handleDownload = (backup: Backup) => {
    toast.success(`Descargando ${backup.name}...`)
    setTimeout(() => {
      toast.success('Descarga completada')
    }, 1500)
  }

  const handleRestore = () => {
    if (!restoreDialog.backup) return

    // Simulate restore
    toast.success(`Restaurando desde ${restoreDialog.backup.name}...`)
    setRestoreDialog({ open: false, backup: null })

    setTimeout(() => {
      toast.success('Sistema restaurado exitosamente')
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.name.endsWith('.sql')) {
      setRestoreError('El archivo debe ser un respaldo válido (.sql)')
      toast.error('Archivo de respaldo inválido')
      return
    }

    setRestoreError(null)
    toast.success(`Archivo ${file.name} seleccionado. Validando...`)

    // Simulate validation
    setTimeout(() => {
      // Simulate a chance of invalid backup
      if (Math.random() > 0.7) {
        setRestoreError('El archivo de respaldo está corrupto o es incompatible con la versión actual.')
        toast.error('Respaldo inválido')
      } else {
        toast.success('Archivo válido. Listo para restaurar.')
      }
    }, 1500)
  }

  // Stats
  const completedBackups = backups.filter((b) => b.status === 'completed').length
  const lastBackup = backups.find((b) => b.status === 'completed')
  const totalSize = backups
    .filter((b) => b.status === 'completed')
    .reduce((acc, b) => acc + parseInt(b.size), 0)

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Mind & Body', href: '/dashboard' },
          { label: 'Respaldos' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="Respaldos del Sistema"
          description="Genera y restaura respaldos para asegurar la continuidad operativa"
          actions={
            <Button onClick={handleGenerateBackup} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Generar Respaldo
            </Button>
          }
          className="mb-6"
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Respaldos Totales</p>
                <p className="text-2xl font-bold text-foreground">{completedBackups}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Respaldo</p>
                <p className="text-sm font-medium text-foreground">
                  {lastBackup?.createdAt.split(' ')[0] || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <HardDrive className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Espacio Utilizado</p>
                <p className="text-2xl font-bold text-foreground">{totalSize} MB</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress indicator when generating */}
        {generating && (
          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <AlertTitle className="text-primary">Generando respaldo...</AlertTitle>
            <AlertDescription className="text-primary/80">
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <span className="text-sm mt-1 block">{progress}% completado</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Backup History */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Historial de Respaldos</CardTitle>
                <CardDescription>Lista de todos los respaldos generados</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-muted-foreground font-semibold">Archivo</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Tamaño</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Fecha</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileArchive className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {backup.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{backup.size}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {backup.createdAt}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={backup.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {backup.status === 'completed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(backup)}
                                  className="h-8"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRestoreDialog({ open: true, backup })}
                                  className="h-8 text-warning hover:text-warning"
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Restore Panel */}
          <div>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Restaurar Sistema</CardTitle>
                <CardDescription>
                  Restaura el sistema desde un archivo de respaldo
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra un archivo o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo archivos .sql
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {restoreError && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{restoreError}</AlertDescription>
                  </Alert>
                )}

                <Alert className="border-warning/50 bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning">
                    La restauración reemplazará todos los datos actuales. Esta acción no se puede
                    deshacer.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="border-border bg-card mt-4">
              <CardHeader>
                <CardTitle className="text-base">Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versión de BD</span>
                  <span className="text-foreground font-medium">PostgreSQL 15.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamaño de BD</span>
                  <span className="text-foreground font-medium">1.2 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respaldo Auto.</span>
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Activo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próximo Respaldo</span>
                  <span className="text-foreground font-medium">00:00 hrs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Restore Confirm Dialog */}
        <ConfirmDialog
          open={restoreDialog.open}
          onOpenChange={(open) => setRestoreDialog({ ...restoreDialog, open })}
          title="Restaurar Sistema"
          description={`¿Estás seguro de restaurar el sistema desde "${restoreDialog.backup?.name}"? Todos los datos actuales serán reemplazados. Esta acción no se puede deshacer.`}
          confirmLabel="Restaurar"
          onConfirm={handleRestore}
          variant="destructive"
        />
      </div>
    </>
  )
}
