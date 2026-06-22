import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/src/features/dashboard/components/app-sidebar';
import { apiFetch, ApiError, getLoginUrl } from '@/lib/api';
import type { AuthUser } from '@/hooks/use-auth';
import { AUTH_QUERY_KEY } from '@/hooks/use-auth';

export const Route = createFileRoute('/dashboard')({
    beforeLoad: async ({ context, location }) => {
        // Try to fetch auth — if 401, redirect to backend login
        try {
            const user = await context.queryClient.ensureQueryData({
                queryKey: AUTH_QUERY_KEY,
                queryFn: () => apiFetch<AuthUser>('/api/v1/auth/me'),
                staleTime: 1000 * 60 * 5,
            });
            return { user };
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                // Redirect to backend login with current path as redirect
                window.location.href = getLoginUrl(location.pathname);
                // Throw redirect to prevent rendering while navigating away
                // eslint-disable-next-line @typescript-eslint/only-throw-error
                throw redirect({ to: '/' });
            }
            throw error;
        }
    },
    component: DashboardLayout,
});

function DashboardLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen">
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
