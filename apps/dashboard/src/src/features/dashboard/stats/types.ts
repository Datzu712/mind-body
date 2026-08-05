export interface StatsOverview {
    activeMembers: number;
    reservationsToday: number;
    sessionsToday: number;
    internalUsers: number;
    activeClasses: number;
    noShowsLast7Days: number;
}

export interface WeeklyReservationPoint {
    /** Monday of the bucket, business-local 'YYYY-MM-DD'. */
    week: string;
    total: number;
}

export interface PopularClassPoint {
    name: string;
    total: number;
}

export type ReservationStatus = 'CONFIRMED' | 'WAITLISTED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';

export interface RecentReservation {
    id: string;
    memberName: string;
    className: string;
    status: ReservationStatus;
    createdAt: string;
    startsAt: string;
}
