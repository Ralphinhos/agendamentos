import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ExpandedState,
  Table as ReactTable,
} from "@tanstack/react-table";
import { BookingWithProgress } from "@/pages/Admin";
import { cn } from "@/lib/utils";

interface OngoingBookingsTableProps {
  table: ReactTable<BookingWithProgress>;
  columns: ColumnDef<BookingWithProgress>[];
}

export function OngoingBookingsTable({ table, columns }: OngoingBookingsTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ??
                    null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn({
                  "bg-green-100/50 hover:bg-green-100/60":
                    row.original.dailyDeliveryStatus === "delivered",
                })}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum agendamento em andamento.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
