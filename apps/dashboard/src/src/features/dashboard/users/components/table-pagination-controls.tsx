import { type Table as TTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Page-size selector plus previous / next controls for a TanStack table. */
export function TablePaginationControls<TData>({ table }: { table: TTable<TData> }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filas por pagina</span>
                <Select
                    value={String(table.getState().pagination.pageSize)}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                >
                    <SelectTrigger className="w-[70px] h-8 bg-secondary/50 border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Página siguiente</span>
                </Button>
            </div>
        </div>
    );
}
