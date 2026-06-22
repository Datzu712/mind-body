import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getLoginUrl } from '@/lib/api';

interface SessionExpiredDialogProps {
    open: boolean;
}

export function SessionExpiredDialog({ open }: SessionExpiredDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sesion expirada</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tu sesion ha expirado. Por favor, inicia sesion nuevamente para continuar.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={() => {
                            window.location.href = getLoginUrl(window.location.pathname);
                        }}
                    >
                        Reiniciar sesion
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
