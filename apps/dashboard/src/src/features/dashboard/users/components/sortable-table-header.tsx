import { flexRender, type Table as TTable } from '@tanstack/react-table';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

/**
 * Table header whose sortable columns render a keyboard-focusable sort toggle
 * with an ascending / descending / unsorted indicator and the matching
 * `aria-sort`. Data-agnostic — works for any TanStack table.
 */
export function SortableTableHeader<TData>({ table }: { table: TTable<TData> }) {
    return (
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                    {headerGroup.headers.map((header) => {
                        const sorted = header.column.getIsSorted();
                        return (
                            <TableHead
                                key={header.id}
                                className="text-muted-foreground font-semibold"
                                aria-sort={
                                    sorted === 'asc'
                                        ? 'ascending'
                                        : sorted === 'desc'
                                          ? 'descending'
                                          : header.column.getCanSort()
                                            ? 'none'
                                            : undefined
                                }
                            >
                                {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                    <button
                                        type="button"
                                        onClick={header.column.getToggleSortingHandler()}
                                        className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {sorted === 'asc' ? (
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        ) : sorted === 'desc' ? (
                                            <ArrowDown className="h-3.5 w-3.5" />
                                        ) : (
                                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                                        )}
                                    </button>
                                ) : (
                                    flexRender(header.column.columnDef.header, header.getContext())
                                )}
                            </TableHead>
                        );
                    })}
                </TableRow>
            ))}
        </TableHeader>
    );
}
