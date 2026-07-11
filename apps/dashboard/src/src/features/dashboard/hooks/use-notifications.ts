import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    payload?: unknown;
    createdAt: string;
}

export const notificationKeys = {
    all: ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
};

export function useNotifications() {
    return useQuery({
        queryKey: notificationKeys.list(),
        queryFn: async () => apiFetch<Notification[]>('/api/v1/notifications'),
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => apiFetch<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}
