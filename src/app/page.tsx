import Link from 'next/link'
import { Dumbbell, ArrowRight, Shield, BarChart3, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Mind & Body</span>
        </div>
        <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Link href="/dashboard">
            Iniciar Sesión
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="text-sm font-medium text-primary">Panel Administrativo</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Gestiona tu gimnasio con{' '}
            <span className="text-primary">Mind & Body</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Sistema de administración integral para gimnasios. Controla miembros, 
            clases, pagos y más desde un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              <Link href="/dashboard">
                Acceder al Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Gestión de Usuarios</h3>
              <p className="text-sm text-muted-foreground">
                Administra miembros, staff y permisos de acceso de forma eficiente.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 mx-auto">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Reportes Detallados</h3>
              <p className="text-sm text-muted-foreground">
                Visualiza métricas clave y toma decisiones basadas en datos.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 mx-auto">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Seguridad Total</h3>
              <p className="text-sm text-muted-foreground">
                Auditoría completa y respaldos automáticos de tu información.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          2024 Mind & Body. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
