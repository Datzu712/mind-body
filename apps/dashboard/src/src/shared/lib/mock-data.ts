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

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    description: string;
    timestamp: string;
    ipAddress: string;
}

export interface CatalogItem {
    id: string;
    name: string;
    type: 'class' | 'plan' | 'service';
    description: string;
    price: number;
    capacity?: number;
    duration?: string;
    status: 'active' | 'inactive';
    activeUsers?: number;
}

export interface Backup {
    id: string;
    name: string;
    size: string;
    createdAt: string;
    status: 'completed' | 'in-progress' | 'failed';
    type: 'automatic' | 'manual';
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

// Mock Users
export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Carlos Mendoza',
        email: 'carlos@mindbody.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15',
        avatar: 'CM',
    },
    {
        id: '2',
        name: 'Ana García',
        email: 'ana@mindbody.com',
        role: 'manager',
        status: 'active',
        createdAt: '2024-02-20',
        avatar: 'AG',
    },
    {
        id: '3',
        name: 'Luis Rodríguez',
        email: 'luis@mindbody.com',
        role: 'staff',
        status: 'active',
        createdAt: '2024-03-10',
        avatar: 'LR',
    },
    {
        id: '4',
        name: 'María Torres',
        email: 'maria@mindbody.com',
        role: 'staff',
        status: 'inactive',
        createdAt: '2024-01-25',
        avatar: 'MT',
    },
    {
        id: '5',
        name: 'Pedro Sánchez',
        email: 'pedro@mindbody.com',
        role: 'manager',
        status: 'pending',
        createdAt: '2024-04-01',
        avatar: 'PS',
    },
    {
        id: '6',
        name: 'Laura Díaz',
        email: 'laura@mindbody.com',
        role: 'staff',
        status: 'active',
        createdAt: '2024-03-15',
        avatar: 'LD',
    },
    {
        id: '7',
        name: 'Roberto Vega',
        email: 'roberto@mindbody.com',
        role: 'staff',
        status: 'active',
        createdAt: '2024-02-28',
        avatar: 'RV',
    },
    {
        id: '8',
        name: 'Carmen López',
        email: 'carmen@mindbody.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-05',
        avatar: 'CL',
    },
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
    {
        id: '1',
        userId: '1',
        userName: 'Carlos Mendoza',
        action: 'CREATE',
        module: 'Usuarios',
        description: 'Creó nuevo usuario: Pedro Sánchez',
        timestamp: '2024-04-01 14:32:00',
        ipAddress: '192.168.1.100',
    },
    {
        id: '2',
        userId: '2',
        userName: 'Ana García',
        action: 'UPDATE',
        module: 'Catálogo',
        description: 'Actualizó precio del plan Premium',
        timestamp: '2024-04-01 13:15:00',
        ipAddress: '192.168.1.101',
    },
    {
        id: '3',
        userId: '1',
        userName: 'Carlos Mendoza',
        action: 'DELETE',
        module: 'Clases',
        description: 'Desactivó clase: Pilates Avanzado',
        timestamp: '2024-04-01 11:45:00',
        ipAddress: '192.168.1.100',
    },
    {
        id: '4',
        userId: '3',
        userName: 'Luis Rodríguez',
        action: 'LOGIN',
        module: 'Autenticación',
        description: 'Inicio de sesión exitoso',
        timestamp: '2024-04-01 09:00:00',
        ipAddress: '192.168.1.102',
    },
    {
        id: '5',
        userId: '2',
        userName: 'Ana García',
        action: 'EXPORT',
        module: 'Reportes',
        description: 'Exportó reporte de membresías',
        timestamp: '2024-03-31 16:20:00',
        ipAddress: '192.168.1.101',
    },
    {
        id: '6',
        userId: '1',
        userName: 'Carlos Mendoza',
        action: 'BACKUP',
        module: 'Sistema',
        description: 'Generó respaldo manual',
        timestamp: '2024-03-31 12:00:00',
        ipAddress: '192.168.1.100',
    },
    {
        id: '7',
        userId: '8',
        userName: 'Carmen López',
        action: 'UPDATE',
        module: 'Configuración',
        description: 'Actualizó horario de operación',
        timestamp: '2024-03-30 10:30:00',
        ipAddress: '192.168.1.103',
    },
    {
        id: '8',
        userId: '2',
        userName: 'Ana García',
        action: 'CREATE',
        module: 'Catálogo',
        description: 'Creó nueva clase: HIIT Express',
        timestamp: '2024-03-30 09:15:00',
        ipAddress: '192.168.1.101',
    },
];

// Mock Catalog Items
export const mockCatalogItems: CatalogItem[] = [
    {
        id: '1',
        name: 'Yoga Básico',
        type: 'class',
        description: 'Clase de yoga para principiantes',
        price: 150,
        capacity: 20,
        duration: '60 min',
        status: 'active',
        activeUsers: 15,
    },
    {
        id: '2',
        name: 'CrossFit Intensivo',
        type: 'class',
        description: 'Entrenamiento de alta intensidad',
        price: 200,
        capacity: 15,
        duration: '45 min',
        status: 'active',
        activeUsers: 12,
    },
    {
        id: '3',
        name: 'Plan Básico',
        type: 'plan',
        description: 'Acceso limitado al gimnasio',
        price: 499,
        status: 'active',
        activeUsers: 45,
    },
    {
        id: '4',
        name: 'Plan Premium',
        type: 'plan',
        description: 'Acceso ilimitado + clases grupales',
        price: 899,
        status: 'active',
        activeUsers: 78,
    },
    {
        id: '5',
        name: 'Plan VIP',
        type: 'plan',
        description: 'Todo incluido + entrenador personal',
        price: 1499,
        status: 'active',
        activeUsers: 23,
    },
    {
        id: '6',
        name: 'Masaje Deportivo',
        type: 'service',
        description: 'Masaje de recuperación muscular',
        price: 350,
        duration: '60 min',
        status: 'active',
        activeUsers: 8,
    },
    {
        id: '7',
        name: 'Nutrición Personalizada',
        type: 'service',
        description: 'Plan de alimentación personalizado',
        price: 500,
        status: 'active',
        activeUsers: 15,
    },
    {
        id: '8',
        name: 'Pilates Avanzado',
        type: 'class',
        description: 'Clase avanzada de pilates',
        price: 180,
        capacity: 12,
        duration: '50 min',
        status: 'inactive',
        activeUsers: 0,
    },
    {
        id: '9',
        name: 'Spinning',
        type: 'class',
        description: 'Ciclismo indoor de alta energía',
        price: 120,
        capacity: 25,
        duration: '45 min',
        status: 'active',
        activeUsers: 22,
    },
    {
        id: '10',
        name: 'Boxing Fitness',
        type: 'class',
        description: 'Entrenamiento de boxeo recreativo',
        price: 180,
        capacity: 16,
        duration: '60 min',
        status: 'active',
        activeUsers: 14,
    },
];

// Mock Backups
export const mockBackups: Backup[] = [
    {
        id: '1',
        name: 'backup_2024-04-01_auto.sql',
        size: '256 MB',
        createdAt: '2024-04-01 00:00:00',
        status: 'completed',
        type: 'automatic',
    },
    {
        id: '2',
        name: 'backup_2024-03-31_manual.sql',
        size: '254 MB',
        createdAt: '2024-03-31 12:00:00',
        status: 'completed',
        type: 'manual',
    },
    {
        id: '3',
        name: 'backup_2024-03-31_auto.sql',
        size: '253 MB',
        createdAt: '2024-03-31 00:00:00',
        status: 'completed',
        type: 'automatic',
    },
    {
        id: '4',
        name: 'backup_2024-03-30_auto.sql',
        size: '251 MB',
        createdAt: '2024-03-30 00:00:00',
        status: 'completed',
        type: 'automatic',
    },
    {
        id: '5',
        name: 'backup_2024-03-29_auto.sql',
        size: '250 MB',
        createdAt: '2024-03-29 00:00:00',
        status: 'failed',
        type: 'automatic',
    },
    {
        id: '6',
        name: 'backup_2024-03-28_auto.sql',
        size: '248 MB',
        createdAt: '2024-03-28 00:00:00',
        status: 'completed',
        type: 'automatic',
    },
];

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

// Chart data for reports
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
};

// Report types
export const reportTypes = [
    { id: 'members', name: 'Reporte de Miembros', description: 'Estadísticas de membresías activas e inactivas' },
    { id: 'classes', name: 'Clases Populares', description: 'Análisis de las clases más reservadas' },
    { id: 'revenue', name: 'Ingresos Mensuales', description: 'Resumen de ingresos por período' },
    { id: 'attendance', name: 'Asistencia', description: 'Patrones de asistencia de los miembros' },
    { id: 'staff', name: 'Rendimiento del Personal', description: 'Métricas de desempeño del equipo' },
];

// HU-CLI-002 · Buscar miembros — modelo y datos mock de miembros registrados
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'paused';

export type MembershipType = 'basic-monthly' | 'premium-monthly' | 'premium-annual';

export type TrainerAssignment = 'unassigned' | 'maria-gonzalez' | 'carlos-ramirez';

export interface Member {
    id: string;
    name: string;
    email: string;
    status: MemberStatus;
    membership: MembershipType;
    trainer: TrainerAssignment;
    expiresAt: string;
    avatar?: string;
}

export const mockMembers: Member[] = [
    {
        id: 'MB-000123',
        name: 'María Gómez',
        email: 'maria.gomez@email.com',
        status: 'active',
        membership: 'premium-monthly',
        trainer: 'maria-gonzalez',
        expiresAt: '15/06/2025',
        avatar: 'MG',
    },
    {
        id: 'MB-000124',
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        status: 'active',
        membership: 'premium-annual',
        trainer: 'carlos-ramirez',
        expiresAt: '10/09/2025',
        avatar: 'JP',
    },
    {
        id: 'MB-000125',
        name: 'Ana Torres',
        email: 'ana.torres@email.com',
        status: 'paused',
        membership: 'basic-monthly',
        trainer: 'unassigned',
        expiresAt: '05/05/2025',
        avatar: 'AT',
    },
];

export const membershipLabels: Record<MembershipType, string> = {
    'basic-monthly': 'Básica Mensual',
    'premium-monthly': 'Premium Mensual',
    'premium-annual': 'Premium Anual',
};

export const trainerLabels: Record<TrainerAssignment, string> = {
    unassigned: 'Sin asignar',
    'maria-gonzalez': 'María González',
    'carlos-ramirez': 'Carlos Ramírez',
};

// HU-CLI-003 · Aprobación de membresías — solicitudes pendientes (mock)
export type MembershipPaymentStatus = 'paid' | 'pending';

export interface MembershipApprovalRequest {
    id: string;
    memberId: string;
    memberName: string;
    email: string;
    phone: string;
    requestedPlan: string;
    period: 'Mensual' | 'Anual';
    paymentStatus: MembershipPaymentStatus;
    paymentDetail: string;
    requestedAt: string;
    requestedTime: string;
}

export const mockMembershipApprovalRequests: MembershipApprovalRequest[] = [
    {
        id: 'approval-001',
        memberId: 'MB-000124',
        memberName: 'María González',
        email: 'maria.gonzalez@correo.com',
        phone: '(555) 123-4567',
        requestedPlan: 'Plan Premium',
        period: 'Mensual',
        paymentStatus: 'pending',
        paymentDetail: 'Pago por procesar',
        requestedAt: '24/05/2025',
        requestedTime: '10:30 a. m.',
    },
    {
        id: 'approval-002',
        memberId: 'MB-000125',
        memberName: 'Carlos Ramírez',
        email: 'carlos.ramirez@correo.com',
        phone: '(555) 987-6543',
        requestedPlan: 'Plan Básico',
        period: 'Mensual',
        paymentStatus: 'paid',
        paymentDetail: 'Tarjeta **** 4242',
        requestedAt: '24/05/2025',
        requestedTime: '09:15 a. m.',
    },
    {
        id: 'approval-003',
        memberId: 'MB-000126',
        memberName: 'Ana López',
        email: 'ana.lopez@correo.com',
        phone: '(555) 456-7890',
        requestedPlan: 'Plan Anual',
        period: 'Anual',
        paymentStatus: 'pending',
        paymentDetail: 'Transferencia',
        requestedAt: '23/05/2025',
        requestedTime: '04:45 p. m.',
    },
];

export const membershipPaymentStatusLabels: Record<MembershipPaymentStatus, string> = {
    paid: 'Pagado',
    pending: 'Pendiente',
};

// HU-CLI-005 · Gestión de membresías activas e inactivas — modelo y datos mock
export type MembershipStatus = 'active' | 'expired' | 'expiring-soon' | 'inactive';

export interface Membership {
    id: string;
    memberId: string;
    memberName: string;
    membershipType: string;
    status: MembershipStatus;
    startedAt: string;
    expiresAt: string;
    remainingDays: string;
    paymentMethod?: string;
}

export const mockMemberships: Membership[] = [
    {
        id: 'membership-001',
        memberId: 'MB-000123',
        memberName: 'María González',
        membershipType: 'Premium Mensual',
        status: 'active',
        startedAt: '01/05/2025',
        expiresAt: '31/05/2025',
        remainingDays: '12 días',
        paymentMethod: 'Tarjeta de crédito terminada en 4242',
    },
    {
        id: 'membership-002',
        memberId: 'MB-000124',
        memberName: 'Juan Pérez',
        membershipType: 'Premium Trimestral',
        status: 'active',
        startedAt: '15/04/2025',
        expiresAt: '15/07/2025',
        remainingDays: '57 días',
    },
    {
        id: 'membership-003',
        memberId: 'MB-000125',
        memberName: 'Ana Rodríguez',
        membershipType: 'Básica Mensual',
        status: 'expired',
        startedAt: '01/04/2025',
        expiresAt: '30/04/2025',
        remainingDays: '-15 días',
    },
    {
        id: 'membership-004',
        memberId: 'MB-000126',
        memberName: 'Carlos Sánchez',
        membershipType: 'Premium Mensual',
        status: 'expiring-soon',
        startedAt: '03/05/2025',
        expiresAt: '10/05/2025',
        remainingDays: '2 días',
    },
    {
        id: 'membership-005',
        memberId: 'MB-000127',
        memberName: 'Laura Méndez',
        membershipType: 'Básica Trimestral',
        status: 'inactive',
        startedAt: '10/01/2025',
        expiresAt: '10/04/2025',
        remainingDays: '-',
    },
    {
        id: 'membership-006',
        memberId: 'MB-000128',
        memberName: 'Pedro Ramírez',
        membershipType: 'Premium Anual',
        status: 'active',
        startedAt: '20/01/2025',
        expiresAt: '20/01/2026',
        remainingDays: '223 días',
    },
    {
        id: 'membership-007',
        memberId: 'MB-000129',
        memberName: 'Sofía Torres',
        membershipType: 'Básica Mensual',
        status: 'expired',
        startedAt: '01/04/2025',
        expiresAt: '30/04/2025',
        remainingDays: '-15 días',
    },
    {
        id: 'membership-008',
        memberId: 'MB-000130',
        memberName: 'Diego Morales',
        membershipType: 'Premium Trimestral',
        status: 'expiring-soon',
        startedAt: '20/04/2025',
        expiresAt: '20/07/2025',
        remainingDays: '10 días',
    },
];

export const membershipStatusLabels: Record<MembershipStatus, string> = {
    active: 'Activa',
    expired: 'Vencida',
    'expiring-soon': 'Próxima a vencer',
    inactive: 'Inactiva',
};

// HU-CLI-006 · Perfil completo de miembros asignados — modelo y datos mock
export type AssignedMemberStatus = 'active' | 'frozen' | 'expired';

export interface AssignedMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    age: number;
    membershipStatus: AssignedMemberStatus;
    membershipPlan: string;
    membershipExpiresAt: string;
    mainGoal: string;
    lastSessionAt: string;
}

export const mockAssignedMembers: AssignedMember[] = [
    {
        id: 'MB-000125',
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone: '(555) 123-4567',
        age: 29,
        membershipStatus: 'active',
        membershipPlan: 'Plan Premium',
        membershipExpiresAt: '15/08/2025',
        mainGoal: 'Pérdida de peso',
        lastSessionAt: '08/05/2025 · 10:30 a. m.',
    },
    {
        id: 'MB-000126',
        name: 'Carlos Ramírez',
        email: 'carlos.ramirez@email.com',
        phone: '(555) 987-6543',
        age: 34,
        membershipStatus: 'active',
        membershipPlan: 'Plan Premium',
        membershipExpiresAt: '20/08/2025',
        mainGoal: 'Hipertrofia',
        lastSessionAt: '07/05/2025 · 7:15 p. m.',
    },
    {
        id: 'MB-000127',
        name: 'Ana Torres',
        email: 'ana.torres@email.com',
        phone: '(555) 456-7890',
        age: 27,
        membershipStatus: 'frozen',
        membershipPlan: 'Plan Básico',
        membershipExpiresAt: '10/08/2025',
        mainGoal: 'Tonificación',
        lastSessionAt: '05/05/2025 · 6:45 p. m.',
    },
    {
        id: 'MB-000128',
        name: 'Luis Hernández',
        email: 'luis.hernandez@email.com',
        phone: '(555) 321-9876',
        age: 41,
        membershipStatus: 'expired',
        membershipPlan: 'Plan Básico',
        membershipExpiresAt: '01/05/2025',
        mainGoal: 'Resistencia',
        lastSessionAt: '02/05/2025 · 8:10 a. m.',
    },
    {
        id: 'MB-000129',
        name: 'Sofía Martínez',
        email: 'sofia.martinez@email.com',
        phone: '(555) 654-3210',
        age: 31,
        membershipStatus: 'active',
        membershipPlan: 'Plan Premium',
        membershipExpiresAt: '18/08/2025',
        mainGoal: 'Pérdida de peso',
        lastSessionAt: '09/05/2025 · 11:00 a. m.',
    },
];

export const assignedMemberStatusLabels: Record<AssignedMemberStatus, string> = {
    active: 'Activa',
    frozen: 'Congelada',
    expired: 'Vencida',
};

export interface TrainingHistoryEntry {
    date: string;
    routine: string;
    trainer: string;
    notes: string;
}

export const mockTrainingHistory: TrainingHistoryEntry[] = [
    {
        date: '08/05/2025',
        routine: 'Fuerza - Tren superior',
        trainer: 'Tú',
        notes: 'Progresó en press de banca (+5 kg)',
    },
    {
        date: '06/05/2025',
        routine: 'Cardio + Core',
        trainer: 'Tú',
        notes: 'Sesión completa, buena resistencia',
    },
    {
        date: '03/05/2025',
        routine: 'Fuerza - Tren inferior',
        trainer: 'Tú',
        notes: 'Sentadillas con buena técnica',
    },
];
