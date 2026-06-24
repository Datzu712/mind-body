import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Users as UsersIcon, X } from 'lucide-react';

/** Error row spanning the whole users table body. */
export function UsersTableErrorRow({ colSpan }: { colSpan: number }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="text-sm">No se pudieron cargar los usuarios. Reintentá más tarde.</span>
                </div>
            </TableCell>
        </TableRow>
    );
}

/** Loading row spanning the whole users table body. */
export function UsersTableLoadingRow({ colSpan }: { colSpan: number }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Cargando usuarios...</span>
                </div>
            </TableCell>
        </TableRow>
    );
}

interface UsersTableEmptyRowProps {
    colSpan: number;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
}

/** Empty-state row; offers to clear filters when some are active. */
export function UsersTableEmptyRow({ colSpan, hasActiveFilters = false, onClearFilters }: UsersTableEmptyRowProps) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <UsersIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">No se encontraron usuarios</p>
                        <p className="text-xs text-muted-foreground">
                            {hasActiveFilters
                                ? 'Probá ajustar o limpiar los filtros aplicados.'
                                : 'Creá el primer usuario para comenzar.'}
                        </p>
                    </div>
                    {hasActiveFilters && onClearFilters && (
                        <Button variant="outline" size="sm" onClick={onClearFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
