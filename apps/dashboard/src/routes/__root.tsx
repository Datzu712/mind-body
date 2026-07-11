import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { Toaster } from 'sileo';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionExpiredDialog } from '@/components/session-expired-dialog';
import { ApiError } from '@/lib/api';
import { useState, useCallback } from 'react';

interface RouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
});

// Signal for 401 detection — set by QueryClient error handlers
let onSessionExpired: (() => void) | null = null;

function handle401(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
        onSessionExpired?.();
    }
}

export const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handle401 }),
    mutationCache: new MutationCache({ onError: handle401 }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
        },
    },
});

function RootComponent() {
    const [sessionExpired, setSessionExpired] = useState(false);

    // Register the callback so QueryClient can trigger the dialog
    onSessionExpired = useCallback(() => setSessionExpired(true), []);

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Outlet />
                <SessionExpiredDialog open={sessionExpired} />
                {/* Toast surface color is themed via the --popover token in globals.css */}
                <Toaster position="top-right" />
            </TooltipProvider>
        </QueryClientProvider>
    );
}
