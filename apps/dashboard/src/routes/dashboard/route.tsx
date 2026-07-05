import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/src/features/dashboard/components/app-sidebar';
import { apiFetch, ApiError, getLoginUrl } from '@/lib/api';
import type { AuthUser } from '@/hooks/use-auth';
import { AUTH_QUERY_KEY } from '@/hooks/use-auth';

export const Route = createFileRoute('/dashboard')({
    beforeLoad: async ({ context, location }) => {
        // DEV-ONLY: bypass auth so the UI can be reviewed without a running backend.
        // import.meta.env.DEV is statically false in production builds (vite build).
        if (import.meta.env.DEV) {
            const mockUser: AuthUser = {
                id: 'dev-user',
                keycloakSubject: 'dev-kc-subject',
                fullName: 'Dev User',
                phone: null,
                status: 'active',
                roles: ['admin'],
            };
            // Seed the QueryClient so useAuth() finds the mock in cache
            // and never fires a network request against /api/v1/auth/me.
            context.queryClient.setQueryData(AUTH_QUERY_KEY, mockUser);
            return { user: mockUser };
        }

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
    // Re-key the content wrapper on each route change so the incoming page fades in.
    // The sidebar lives outside the wrapper, so it stays put across navigations.
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen">
                <div key={pathname} className="flex min-h-0 flex-1 flex-col duration-300 ease-out animate-in fade-in-0">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
