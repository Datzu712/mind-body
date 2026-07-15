import type { RoutineAttachmentMock } from './types';

const attachmentsByRoutine = new Map<string, RoutineAttachmentMock[]>();

export function getRoutineMockAttachments(routineId?: string): RoutineAttachmentMock[] {
    if (!routineId) return [];
    return attachmentsByRoutine.get(routineId) ?? [];
}

export function setRoutineMockAttachments(routineId: string, attachments: RoutineAttachmentMock[]) {
    attachmentsByRoutine.set(routineId, attachments);
}

export function sanitizeRoutinePayload<T extends { mockAttachments?: RoutineAttachmentMock[] }>(
    data: T,
): Omit<T, 'mockAttachments'> {
    const { mockAttachments, ...payload } = data;
    void mockAttachments;
    return payload;
}
