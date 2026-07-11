import { flexRender, type Table as TTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SortableTableHeader } from './sortable-table-header';
import { TablePaginationControls } from './table-pagination-controls';
import { UsersTableEmptyRow, UsersTableErrorRow, UsersTableLoadingRow } from './users-table-states';
import type { UserBase } from '../types';

export { createUsersColumns } from './users-table-columns';

interface UsersDataTableProps {
    table: TTable<UserBase>;
    isLoading?: boolean;
    isError?: boolean;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
}

export function UsersDataTable({
    table,
    isLoading = false,
    isError = false,
    hasActiveFilters = false,
    onClearFilters,
}: UsersDataTableProps) {
    const colSpan = table.getAllColumns().length;
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <SortableTableHeader table={table} />
                    <TableBody>
                        {isError ? (
                            <UsersTableErrorRow colSpan={colSpan} />
                        ) : isLoading ? (
                            <UsersTableLoadingRow colSpan={colSpan} />
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="border-border">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <UsersTableEmptyRow
                                colSpan={colSpan}
                                hasActiveFilters={hasActiveFilters}
                                onClearFilters={onClearFilters}
                            />
                        )}
                    </TableBody>
                </Table>
            </div>

            <TablePaginationControls table={table} />
        </div>
    );
}
