'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card,CardDescription,
    CardHeader,
    CardTitle } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

type ColumnMeta = {
  name: string;
  display?: boolean;
};

type DynamicDataTableProps = {
  title:string,
  description:string,
  data: Record<string, any>[];
  columnsMeta?: Record<string, ColumnMeta>;
  height?: string;
};

function getColumnLabel(key: string, columnsMeta?: Record<string, ColumnMeta>): string {
  return columnsMeta?.[key]?.name || key;
}

function shouldDisplayColumn(key: string, columnsMeta?: Record<string, ColumnMeta>): boolean {
  if (!columnsMeta || !(key in columnsMeta)) return true;
  return columnsMeta[key].display !== false;
}

const DynamicDataTable = ({ title, description, data, height = '400px', columnsMeta }: DynamicDataTableProps) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      data.length > 0
        ? Object.keys(data[0])
            .filter((key) => shouldDisplayColumn(key, columnsMeta))
            .map((key) => ({
              accessorKey: key,
              header: ({ column }) => {
                const isSorted = column.getIsSorted();
                const label = getColumnLabel(key, columnsMeta);
                return (
                  <button
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-1"
                  >
                    {label}
                    {isSorted === 'asc' && <ArrowUp className="h-3 w-3" />}
                    {isSorted === 'desc' && <ArrowDown className="h-3 w-3" />}
                  </button>
                );
              },
              cell: (info) => {
                const value = info.getValue();

                if (
                  Array.isArray(value) &&
                  value.every((v) => typeof v === 'object' && v !== null)
                ) {
                  return `${value.length} record${value.length !== 1 ? 's' : ''}`;
                }

                if (typeof value === 'boolean') return value ? '✅' : '❌';
                if (typeof value === 'object' && value !== null) return JSON.stringify(value);
                return String(value ?? '');
              },
            }))
        : [],
    [data, columnsMeta]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (data.length === 0) {
    return (
      <Card className="p-4 text-center text-gray-500 italic">
        No data available
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className='px-0'>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {/* Global Filter */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Table */}
      <div className="relative border rounded overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: height }}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="capitalize">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DynamicDataTable;
