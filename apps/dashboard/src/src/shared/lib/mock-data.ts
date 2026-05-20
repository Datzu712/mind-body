// Mock data for Mind & Body Admin Dashboard

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  avatar?: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  module: string
  description: string
  timestamp: string
  ipAddress: string
}

export interface CatalogItem {
  id: string
  name: string
  type: 'class' | 'plan' | 'service'
  description: string
  price: number
  capacity?: number
  duration?: string
  status: 'active' | 'inactive'
  activeUsers?: number
}

export interface Backup {
  id: string
  name: string
  size: string
  createdAt: string
  status: 'completed' | 'in-progress' | 'failed'
  type: 'automatic' | 'manual'
}

export interface KPIData {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
}

export interface RecentActivity {
  id: string
  action: string
  user: string
  timestamp: string
  type: 'user' | 'class' | 'payment' | 'system'
}

// Mock Users
export const mockUsers: User[] = [
  { id: '1', name: 'Carlos Mendoza', email: 'carlos@mindbody.com', role: 'admin', status: 'active', createdAt: '2024-01-15', avatar: 'CM' },
  { id: '2', name: 'Ana García', email: 'ana@mindbody.com', role: 'manager', status: 'active', createdAt: '2024-02-20', avatar: 'AG' },
  { id: '3', name: 'Luis Rodríguez', email: 'luis@mindbody.com', role: 'staff', status: 'active', createdAt: '2024-03-10', avatar: 'LR' },
  { id: '4', name: 'María Torres', email: 'maria@mindbody.com', role: 'staff', status: 'inactive', createdAt: '2024-01-25', avatar: 'MT' },
  { id: '5', name: 'Pedro Sánchez', email: 'pedro@mindbody.com', role: 'manager', status: 'pending', createdAt: '2024-04-01', avatar: 'PS' },
  { id: '6', name: 'Laura Díaz', email: 'laura@mindbody.com', role: 'staff', status: 'active', createdAt: '2024-03-15', avatar: 'LD' },
  { id: '7', name: 'Roberto Vega', email: 'roberto@mindbody.com', role: 'staff', status: 'active', createdAt: '2024-02-28', avatar: 'RV' },
  { id: '8', name: 'Carmen López', email: 'carmen@mindbody.com', role: 'admin', status: 'active', createdAt: '2024-01-05', avatar: 'CL' },
]

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '1', userName: 'Carlos Mendoza', action: 'CREATE', module: 'Usuarios', description: 'Creó nuevo usuario: Pedro Sánchez', timestamp: '2024-04-01 14:32:00', ipAddress: '192.168.1.100' },
  { id: '2', userId: '2', userName: 'Ana García', action: 'UPDATE', module: 'Catálogo', description: 'Actualizó precio del plan Premium', timestamp: '2024-04-01 13:15:00', ipAddress: '192.168.1.101' },
  { id: '3', userId: '1', userName: 'Carlos Mendoza', action: 'DELETE', module: 'Clases', description: 'Desactivó clase: Pilates Avanzado', timestamp: '2024-04-01 11:45:00', ipAddress: '192.168.1.100' },
  { id: '4', userId: '3', userName: 'Luis Rodríguez', action: 'LOGIN', module: 'Autenticación', description: 'Inicio de sesión exitoso', timestamp: '2024-04-01 09:00:00', ipAddress: '192.168.1.102' },
  { id: '5', userId: '2', userName: 'Ana García', action: 'EXPORT', module: 'Reportes', description: 'Exportó reporte de membresías', timestamp: '2024-03-31 16:20:00', ipAddress: '192.168.1.101' },
  { id: '6', userId: '1', userName: 'Carlos Mendoza', action: 'BACKUP', module: 'Sistema', description: 'Generó respaldo manual', timestamp: '2024-03-31 12:00:00', ipAddress: '192.168.1.100' },
  { id: '7', userId: '8', userName: 'Carmen López', action: 'UPDATE', module: 'Configuración', description: 'Actualizó horario de operación', timestamp: '2024-03-30 10:30:00', ipAddress: '192.168.1.103' },
  { id: '8', userId: '2', userName: 'Ana García', action: 'CREATE', module: 'Catálogo', description: 'Creó nueva clase: HIIT Express', timestamp: '2024-03-30 09:15:00', ipAddress: '192.168.1.101' },
]

// Mock Catalog Items
export const mockCatalogItems: CatalogItem[] = [
  { id: '1', name: 'Yoga Básico', type: 'class', description: 'Clase de yoga para principiantes', price: 150, capacity: 20, duration: '60 min', status: 'active', activeUsers: 15 },
  { id: '2', name: 'CrossFit Intensivo', type: 'class', description: 'Entrenamiento de alta intensidad', price: 200, capacity: 15, duration: '45 min', status: 'active', activeUsers: 12 },
  { id: '3', name: 'Plan Básico', type: 'plan', description: 'Acceso limitado al gimnasio', price: 499, status: 'active', activeUsers: 45 },
  { id: '4', name: 'Plan Premium', type: 'plan', description: 'Acceso ilimitado + clases grupales', price: 899, status: 'active', activeUsers: 78 },
  { id: '5', name: 'Plan VIP', type: 'plan', description: 'Todo incluido + entrenador personal', price: 1499, status: 'active', activeUsers: 23 },
  { id: '6', name: 'Masaje Deportivo', type: 'service', description: 'Masaje de recuperación muscular', price: 350, duration: '60 min', status: 'active', activeUsers: 8 },
  { id: '7', name: 'Nutrición Personalizada', type: 'service', description: 'Plan de alimentación personalizado', price: 500, status: 'active', activeUsers: 15 },
  { id: '8', name: 'Pilates Avanzado', type: 'class', description: 'Clase avanzada de pilates', price: 180, capacity: 12, duration: '50 min', status: 'inactive', activeUsers: 0 },
  { id: '9', name: 'Spinning', type: 'class', description: 'Ciclismo indoor de alta energía', price: 120, capacity: 25, duration: '45 min', status: 'active', activeUsers: 22 },
  { id: '10', name: 'Boxing Fitness', type: 'class', description: 'Entrenamiento de boxeo recreativo', price: 180, capacity: 16, duration: '60 min', status: 'active', activeUsers: 14 },
]

// Mock Backups
export const mockBackups: Backup[] = [
  { id: '1', name: 'backup_2024-04-01_auto.sql', size: '256 MB', createdAt: '2024-04-01 00:00:00', status: 'completed', type: 'automatic' },
  { id: '2', name: 'backup_2024-03-31_manual.sql', size: '254 MB', createdAt: '2024-03-31 12:00:00', status: 'completed', type: 'manual' },
  { id: '3', name: 'backup_2024-03-31_auto.sql', size: '253 MB', createdAt: '2024-03-31 00:00:00', status: 'completed', type: 'automatic' },
  { id: '4', name: 'backup_2024-03-30_auto.sql', size: '251 MB', createdAt: '2024-03-30 00:00:00', status: 'completed', type: 'automatic' },
  { id: '5', name: 'backup_2024-03-29_auto.sql', size: '250 MB', createdAt: '2024-03-29 00:00:00', status: 'failed', type: 'automatic' },
  { id: '6', name: 'backup_2024-03-28_auto.sql', size: '248 MB', createdAt: '2024-03-28 00:00:00', status: 'completed', type: 'automatic' },
]

// Mock KPI Data
export const mockKPIs: KPIData[] = [
  { label: 'Miembros Activos', value: '1,247', change: 12.5, changeLabel: 'vs mes anterior', icon: 'users' },
  { label: 'Reservas Hoy', value: '86', change: 8.2, changeLabel: 'vs ayer', icon: 'calendar' },
  { label: 'Clases Populares', value: '12', change: 0, changeLabel: 'clases activas', icon: 'dumbbell' },
  { label: 'Usuarios Internos', value: '8', change: 2, changeLabel: 'nuevos este mes', icon: 'user-cog' },
  { label: 'Ingresos del Mes', value: '$245,890', change: 15.3, changeLabel: 'vs mes anterior', icon: 'dollar' },
  { label: 'Alertas Activas', value: '3', change: -2, changeLabel: 'resueltas hoy', icon: 'alert' },
]

// Mock Recent Activity
export const mockRecentActivity: RecentActivity[] = [
  { id: '1', action: 'Nueva membresía Premium registrada', user: 'Carlos Mendoza', timestamp: 'Hace 5 min', type: 'payment' },
  { id: '2', action: 'Reserva confirmada: Yoga Básico', user: 'Ana García', timestamp: 'Hace 12 min', type: 'class' },
  { id: '3', action: 'Usuario desactivado: María Torres', user: 'Sistema', timestamp: 'Hace 25 min', type: 'user' },
  { id: '4', action: 'Respaldo automático completado', user: 'Sistema', timestamp: 'Hace 1 hora', type: 'system' },
  { id: '5', action: 'Precio actualizado: Plan Premium', user: 'Ana García', timestamp: 'Hace 2 horas', type: 'system' },
  { id: '6', action: 'Nueva clase creada: HIIT Express', user: 'Luis Rodríguez', timestamp: 'Hace 3 horas', type: 'class' },
  { id: '7', action: 'Pago procesado: $899.00', user: 'Sistema', timestamp: 'Hace 4 horas', type: 'payment' },
  { id: '8', action: 'Nuevo usuario registrado: Pedro Sánchez', user: 'Carlos Mendoza', timestamp: 'Hace 5 horas', type: 'user' },
]

// Chart data for reports
export const monthlyRevenueData = [
  { month: 'Ene', revenue: 185000, members: 1120 },
  { month: 'Feb', revenue: 195000, members: 1150 },
  { month: 'Mar', revenue: 210000, members: 1200 },
  { month: 'Abr', revenue: 245890, members: 1247 },
]

export const classPopularityData = [
  { name: 'CrossFit Intensivo', bookings: 245 },
  { name: 'Yoga Básico', bookings: 198 },
  { name: 'Spinning', bookings: 187 },
  { name: 'Boxing Fitness', bookings: 156 },
  { name: 'HIIT Express', bookings: 134 },
]

export const membershipDistribution = [
  { name: 'Básico', value: 45, color: 'var(--chart-3)' },
  { name: 'Premium', value: 78, color: 'var(--chart-1)' },
  { name: 'VIP', value: 23, color: 'var(--chart-2)' },
]

// System settings mock
export const mockSettings = {
  general: {
    gymName: 'Mind & Body',
    address: 'Av. Principal #123, Ciudad',
    phone: '+52 55 1234 5678',
    email: 'contacto@mindbody.com',
    openingTime: '06:00',
    closingTime: '22:00',
    timezone: 'America/Mexico_City',
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
  },
  security: {
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90,
    minPasswordLength: 8,
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    backupTime: '00:00',
  },
}

// Report types
export const reportTypes = [
  { id: 'members', name: 'Reporte de Miembros', description: 'Estadísticas de membresías activas e inactivas' },
  { id: 'classes', name: 'Clases Populares', description: 'Análisis de las clases más reservadas' },
  { id: 'revenue', name: 'Ingresos Mensuales', description: 'Resumen de ingresos por período' },
  { id: 'attendance', name: 'Asistencia', description: 'Patrones de asistencia de los miembros' },
  { id: 'staff', name: 'Rendimiento del Personal', description: 'Métricas de desempeño del equipo' },
]
