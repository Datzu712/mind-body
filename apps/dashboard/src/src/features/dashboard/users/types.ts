export type RecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
/**
 * Mirrors `app.membership_status`. EXPIRED means "lapsed but still worth a
 * renewal reminder"; CANCELLED means "the member left — stop reminding".
 */
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
export type ProfileType = 'MEMBER' | 'TRAINER' | 'STAFF';
export type KCRole = 'ADMIN' | 'TRAINER' | 'MEMBER' | 'STAFF';
export type DniType = 'CEDULA_NACIONAL' | 'DIMEX' | 'PASAPORTE';

export interface UserBase {
    id: string;
    keycloakSubject: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    dni: string | null;
    dniType: DniType | null;
    birthDate: string | null;
    status: RecordStatus;
    createdAt: string;
    roles: KCRole[];
    profiles: ProfileType[];
}

export interface UserDetail extends UserBase {
    memberProfile?: MemberProfile;
    trainerProfile?: TrainerProfile;
    staffProfile?: StaffProfile;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface MemberProfile {
    id: string;
    userId: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    joinedAt: string;
    notes?: string;
    status: RecordStatus;
}

/**
 * One membership term, as returned by `/api/v1/memberships`. There is no amount
 * or payment data: money changes hands at the front desk and the system only
 * tracks the dated flag.
 */
export interface Membership {
    id: string;
    /** `members.id` — the member PROFILE id, not the user id. */
    memberId: string;
    planId: string;
    planName: string;
    /** 'YYYY-MM-DD' */
    startDate: string;
    /** 'YYYY-MM-DD' */
    endDate: string;
    status: MembershipStatus;
    /** Server verdict on whether cancelling is allowed right now (only lapsed terms are). */
    cancellable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TrainerProfile {
    id: string;
    userId: string;
    specialty?: string;
    biography?: string;
    status: RecordStatus;
}

export interface StaffProfile {
    id: string;
    userId: string;
    hiredAt: string;
    status: RecordStatus;
}

export type ProfileData = MemberProfile | TrainerProfile | StaffProfile;

// --- Member progress (measurements + activity) -----------------------------
// Mirrors the mobile API shapes (apps/mobile/lib/api/types/). Numeric columns
// come back from the backend as strings (drizzle numeric); parse with Number()
// where a numeric value is needed.

export interface Measurement {
    id: string;
    memberId: string;
    /** 'YYYY-MM-DD' */
    measuredAt: string;
    weightKg: string | null;
    heightCm: string | null;
    bodyFatPercentage: string | null;
    waistCm: string | null;
    notes: string | null;
    createdAt: string;
}

export interface MeasurementVariation {
    weightKg: number | null;
    heightCm: number | null;
    bodyFatPercentage: number | null;
    waistCm: number | null;
}

export interface MeasurementSummary {
    first: Measurement | null;
    latest: Measurement | null;
    variations: MeasurementVariation;
    totalRecords: number;
}

export interface DailyActivity {
    id: string;
    memberId: string;
    /** 'YYYY-MM-DD' */
    date: string;
    steps: number;
    caloriesTotal: string;
    activeMinutes: number;
    exerciseCount: number;
    distanceMeters: string;
    source: 'HEALTH_CONNECT' | 'MANUAL';
    createdAt: string;
    updatedAt: string;
}
