export interface Measurement {
    id: string;
    memberId: string;
    measuredAt: string; // ISO date (YYYY-MM-DD)
    weightKg: number | null;
    heightCm: number | null;
    bodyFatPercentage: number | null;
    waistCm: number | null;
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
