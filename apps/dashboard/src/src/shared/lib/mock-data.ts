// Mock data for Mind & Body Admin Dashboard

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    avatar?: string;
}

export interface KPIData {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: string;
}

export interface RecentActivity {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: 'user' | 'class' | 'payment' | 'system';
}

// Mock KPI Data
export const mockKPIs: KPIData[] = [
    { label: 'Miembros Activos', value: '1,247', change: 12.5, changeLabel: 'vs mes anterior', icon: 'users' },
    { label: 'Reservas Hoy', value: '86', change: 8.2, changeLabel: 'vs ayer', icon: 'calendar' },
    { label: 'Clases Populares', value: '12', change: 0, changeLabel: 'clases activas', icon: 'dumbbell' },
    { label: 'Usuarios Internos', value: '8', change: 2, changeLabel: 'nuevos este mes', icon: 'user-cog' },
    { label: 'Ingresos del Mes', value: '$245,890', change: 15.3, changeLabel: 'vs mes anterior', icon: 'dollar' },
    { label: 'Alertas Activas', value: '3', change: -2, changeLabel: 'resueltas hoy', icon: 'alert' },
];

// Mock Recent Activity
export const mockRecentActivity: RecentActivity[] = [
    {
        id: '1',
        action: 'Nueva membresía Premium registrada',
        user: 'Carlos Mendoza',
        timestamp: 'Hace 5 min',
        type: 'payment',
    },
    { id: '2', action: 'Reserva confirmada: Yoga Básico', user: 'Ana García', timestamp: 'Hace 12 min', type: 'class' },
    { id: '3', action: 'Usuario desactivado: María Torres', user: 'Sistema', timestamp: 'Hace 25 min', type: 'user' },
    { id: '4', action: 'Respaldo automático completado', user: 'Sistema', timestamp: 'Hace 1 hora', type: 'system' },
    {
        id: '5',
        action: 'Precio actualizado: Plan Premium',
        user: 'Ana García',
        timestamp: 'Hace 2 horas',
        type: 'system',
    },
    {
        id: '6',
        action: 'Nueva clase creada: HIIT Express',
        user: 'Luis Rodríguez',
        timestamp: 'Hace 3 horas',
        type: 'class',
    },
    { id: '7', action: 'Pago procesado: $899.00', user: 'Sistema', timestamp: 'Hace 4 horas', type: 'payment' },
    {
        id: '8',
        action: 'Nuevo usuario registrado: Pedro Sánchez',
        user: 'Carlos Mendoza',
        timestamp: 'Hace 5 horas',
        type: 'user',
    },
];

// Chart data for the dashboard home
export const monthlyRevenueData = [
    { month: 'Ene', revenue: 185000, members: 1120 },
    { month: 'Feb', revenue: 195000, members: 1150 },
    { month: 'Mar', revenue: 210000, members: 1200 },
    { month: 'Abr', revenue: 245890, members: 1247 },
];

export const classPopularityData = [
    { name: 'CrossFit Intensivo', bookings: 245 },
    { name: 'Yoga Básico', bookings: 198 },
    { name: 'Spinning', bookings: 187 },
    { name: 'Boxing Fitness', bookings: 156 },
    { name: 'HIIT Express', bookings: 134 },
];

export const membershipDistribution = [
    { name: 'Básico', value: 45, color: 'var(--chart-3)' },
    { name: 'Premium', value: 78, color: 'var(--chart-1)' },
    { name: 'VIP', value: 23, color: 'var(--chart-2)' },
];
