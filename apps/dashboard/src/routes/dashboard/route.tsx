import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/src/features/dashboard/components/app-sidebar';

export const Route = createFileRoute('/dashboard')({
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
