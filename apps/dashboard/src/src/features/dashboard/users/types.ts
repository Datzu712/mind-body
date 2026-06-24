export type RecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
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
    activeMembership?: {
        id: string;
        planName: string;
        startDate: string;
        endDate: string;
        status: MembershipStatus;
    };
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
