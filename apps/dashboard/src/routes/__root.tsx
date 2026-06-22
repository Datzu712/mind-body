import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sileo';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
        },
    },
});

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Outlet />
                <Toaster
                    position="top-right"
                    options={{
                        fill: '#171717',
                        styles: {},
                    }}
                />
            </TooltipProvider>
        </QueryClientProvider>
    );
}
