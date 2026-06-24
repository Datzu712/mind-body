'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockBookings, mockClasses } from './training-mocks';
import type { ClassAttendance, GroupClass } from './training-types';

const ATTENDANCE_KEY = 'mab-training-attendance';

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota/full storage errors
    }
}

export function useAttendanceStorage() {
    const [classes] = useState<GroupClass[]>(mockClasses);
    const [attendance, setAttendance] = useState<ClassAttendance[]>(mockBookings);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setAttendance(loadFromStorage(ATTENDANCE_KEY, mockBookings));
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) saveToStorage(ATTENDANCE_KEY, attendance);
    }, [attendance, hydrated]);

    const markAttendance = useCallback((attendanceId: string, attended: boolean) => {
        setAttendance((prev) =>
            prev.map((a) => (a.id === attendanceId ? { ...a, attended, registeredAt: new Date().toISOString() } : a)),
        );
    }, []);

    const getClassAttendance = useCallback(
        (classId: string) => attendance.filter((a) => a.classId === classId),
        [attendance],
    );

    return {
        classes,
        attendance,
        hydrated,
        markAttendance,
        getClassAttendance,
    } as const;
}
