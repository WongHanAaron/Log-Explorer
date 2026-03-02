import * as React from "react";
import {
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type { ColumnDef };

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Placeholder text for the global search input */
    searchPlaceholder?: string;
    /** Column id to use for global text filtering (defaults to first string column) */
    searchColumn?: string;
    /** Max height for the table body (enables scroll within a constrained quadrant) */
    maxHeight?: string;
    /** Called when a row is clicked */
    onRowClick?: (row: TData) => void;
    /** If true, highlights the currently selected row */
    selectedRow?: TData | null;
    /** Key to identify the selected row */
    rowKey?: (row: TData) => string;
    /** Empty state message */
    emptyMessage?: string;
}

/** Sort header helper — wraps column header with a sort toggle button */
export function sortableHeader<T>(label: string) {
    return ({ column }: { column: import("@tanstack/react-table").Column<T, unknown> }) => (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-1 h-auto px-1 py-0.5 font-medium text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {label}
            <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        </Button>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder = "Search…",
    searchColumn,
    maxHeight = "220px",
    onRowClick,
    selectedRow,
    rowKey,
    emptyMessage = "No results.",
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = React.useState("");

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 50 } },
    });

    // Resolve the column to filter if searchColumn is given
    const filterValue =
        searchColumn
            ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            : globalFilter;

    const setFilterValue = searchColumn
        ? (val: string) => table.getColumn(searchColumn)?.setFilterValue(val)
        : setGlobalFilter;

    return (
        <div className="flex flex-col gap-1.5 min-h-0 h-full">
            {/* Search input */}
            <Input
                placeholder={searchPlaceholder}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="h-6 text-xs"
            />

            {/* Table */}
            <div
                className="overflow-auto border border-border rounded-sm flex-1 h-full"
                style={
                    maxHeight && maxHeight !== "100%"
                        ? { maxHeight }
                        : undefined
                }
            >
                <Table className="h-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => {
                                const isSelected =
                                    selectedRow != null &&
                                    rowKey != null &&
                                    rowKey(row.original) === rowKey(selectedRow);

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={isSelected ? "selected" : undefined}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={cn(
                                            onRowClick && "cursor-pointer",
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow className="h-full">
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-full flex items-center justify-center text-center text-muted-foreground text-xs italic"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
