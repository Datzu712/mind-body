import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    return (
        <TooltipProvider>
            <Outlet />
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'oklch(0.17 0.005 260)',
                        border: '1px solid oklch(0.28 0.005 260)',
                        color: 'oklch(0.97 0 0)',
                    },
                }}
            />
        </TooltipProvider>
    );
}
