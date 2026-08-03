import { createFileRoute } from '@tanstack/react-router';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/lib/api';

export const Route = createFileRoute('/auth/forbidden')({
    component: ForbiddenPage,
});

function ForbiddenPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center max-w-md space-y-6 p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <ShieldX className="h-8 w-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Acceso denegado</h1>
                <p className="text-muted-foreground">
                    No tienes permisos para acceder al dashboard. Solo usuarios con rol de <strong>Admin</strong>,{' '}
                    <strong>Staff</strong> o <strong>Entrenador</strong> pueden ingresar.
                </p>
                <p className="text-sm text-muted-foreground">
                    Si crees que esto es un error, contacta al administrador del sistema.
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={() => (window.location.href = getLoginUrl())}>Intentar con otra cuenta</Button>
                </div>
            </div>
        </div>
    );
}
