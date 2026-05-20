'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header'
import { PageHeader } from '@/src/shared/components/page-header'
import { KPICard } from '@/src/shared/components/kpi-card'
import { EmptyState } from '@/src/shared/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Download, FileBarChart, Eye, Loader2 } from 'lucide-react'
import { reportTypes, monthlyRevenueData, classPopularityData, membershipDistribution } from '@/src/shared/lib/mock-data'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('Selecciona un tipo de reporte')
      return
    }

    setLoading(true)
    // Simulate generating report
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    setShowPreview(true)
    toast.success('Reporte generado exitosamente')
  }

  const handleDownload = () => {
    toast.success('Descargando reporte en PDF...')
    setTimeout(() => {
      toast.success('Reporte descargado')
    }, 1500)
  }

  const selectedReportData = reportTypes.find((r) => r.id === selectedReport)

  // Check if no data scenario
  const hasData = dateFrom !== '2020-01-01' // Simulate no data for old dates

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Mind & Body', href: '/dashboard' },
          { label: 'Reportes' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <PageHeader
          title="Generador de Reportes"
          description="Genera informes detallados para apoyar la toma de decisiones"
          className="mb-6"
        />

        {/* Report Selection */}
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <CardTitle>Configuración del Reporte</CardTitle>
            <CardDescription>Selecciona el tipo de reporte y el período a analizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="reportType">Tipo de Reporte</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Selecciona un tipo de reporte" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex flex-col">
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedReportData && (
                  <p className="text-sm text-muted-foreground">{selectedReportData.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateFrom">Fecha Inicio</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setShowPreview(false)
                  }}
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateTo">Fecha Fin</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setShowPreview(false)
                  }}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={handleGenerateReport} disabled={loading || !selectedReport}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Vista Previa
              </Button>
              {showPreview && hasData && (
                <Button variant="outline" onClick={handleDownload} className="border-border">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {showPreview && (
          <>
            {!hasData ? (
              <Card className="border-border bg-card">
                <EmptyState
                  icon={FileBarChart}
                  title="Sin datos disponibles"
                  description="No se encontraron datos para el período seleccionado. Intenta con un rango de fechas diferente."
                />
              </Card>
            ) : (
              <>
                {/* Summary KPIs */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  {selectedReport === 'members' && (
                    <>
                      <KPICard label="Miembros Totales" value="1,247" change={12.5} changeLabel="vs período anterior" icon="users" />
                      <KPICard label="Nuevos Miembros" value="89" change={8.2} changeLabel="este período" icon="users" />
                      <KPICard label="Miembros Activos" value="1,158" icon="users" />
                      <KPICard label="Tasa de Retención" value="92.8%" change={2.1} changeLabel="vs período anterior" icon="users" />
                    </>
                  )}
                  {selectedReport === 'classes' && (
                    <>
                      <KPICard label="Clases Impartidas" value="248" change={15} changeLabel="vs período anterior" icon="dumbbell" />
                      <KPICard label="Reservas Totales" value="920" icon="calendar" />
                      <KPICard label="Ocupación Promedio" value="78%" change={5.2} changeLabel="vs período anterior" icon="users" />
                      <KPICard label="Clases Canceladas" value="12" change={-3} changeLabel="vs período anterior" icon="alert" />
                    </>
                  )}
                  {selectedReport === 'revenue' && (
                    <>
                      <KPICard label="Ingresos Totales" value="$245,890" change={15.3} changeLabel="vs período anterior" icon="dollar" />
                      <KPICard label="Membresías" value="$198,500" icon="dollar" />
                      <KPICard label="Servicios" value="$32,890" icon="dollar" />
                      <KPICard label="Productos" value="$14,500" icon="dollar" />
                    </>
                  )}
                  {(selectedReport === 'attendance' || selectedReport === 'staff') && (
                    <>
                      <KPICard label="Total Visitas" value="3,456" change={8} changeLabel="vs período anterior" icon="users" />
                      <KPICard label="Promedio Diario" value="115" icon="calendar" />
                      <KPICard label="Hora Pico" value="18:00" icon="calendar" />
                      <KPICard label="Día Más Activo" value="Lunes" icon="calendar" />
                    </>
                  )}
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {(selectedReport === 'members' || selectedReport === 'revenue') && (
                    <Card className="border-border bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {selectedReport === 'revenue' ? 'Tendencia de Ingresos' : 'Crecimiento de Miembros'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={monthlyRevenueData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="oklch(0.85 0.18 85)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="oklch(0.85 0.18 85)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
                              <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                                tickFormatter={(value) =>
                                  selectedReport === 'revenue' ? `$${value / 1000}k` : value.toString()
                                }
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'oklch(0.17 0.005 260)',
                                  border: '1px solid oklch(0.28 0.005 260)',
                                  borderRadius: '8px',
                                  color: 'oklch(0.97 0 0)',
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey={selectedReport === 'revenue' ? 'revenue' : 'members'}
                                stroke="oklch(0.85 0.18 85)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorData)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedReport === 'classes' && (
                    <Card className="border-border bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Clases Más Populares</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={classPopularityData}
                              layout="vertical"
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" horizontal={false} />
                              <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                                width={120}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'oklch(0.17 0.005 260)',
                                  border: '1px solid oklch(0.28 0.005 260)',
                                  borderRadius: '8px',
                                  color: 'oklch(0.97 0 0)',
                                }}
                              />
                              <Bar dataKey="bookings" fill="oklch(0.85 0.18 85)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribución por Membresía</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        {membershipDistribution.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-4">
                            <div className="w-24 text-sm text-muted-foreground">{item.name}</div>
                            <div className="flex-1 h-3 bg-secondary/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(item.value / 146) * 100}%`,
                                  backgroundColor:
                                    index === 0
                                      ? 'oklch(0.65 0.2 260)'
                                      : index === 1
                                      ? 'oklch(0.85 0.18 85)'
                                      : 'oklch(0.72 0.19 145)',
                                }}
                              />
                            </div>
                            <div className="w-12 text-sm font-medium text-foreground text-right">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
