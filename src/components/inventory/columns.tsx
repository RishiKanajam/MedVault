'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Snowflake } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  batchNo: string;
  quantity: number;
  expiryDate: string;
  coldChain: boolean;
  temperatureRange?: {
    min: number;
    max: number;
  };
  lastShipmentId?: string;
  lastShipmentDate?: string;
  shipmentStatus?: 'Pre-Transit' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed' | 'Exception';
}

export const columns: ColumnDef<Medicine>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'manufacturer',
    header: 'Manufacturer',
  },
  {
    accessorKey: 'batchNo',
    header: 'Batch No.',
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      return (
        <div className="font-medium">
          {quantity}
          {quantity < 10 && (
            <Badge variant="destructive" className="ml-2">
              Low Stock
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'expiryDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Expiry Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const expiryDateStr = row.getValue('expiryDate') as string;
      let expiryDate: Date;
      try {
        expiryDate = new Date(expiryDateStr);
        if (isNaN(expiryDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.error('Invalid expiry date:', expiryDateStr);
        return <span className="text-destructive">Invalid date</span>;
      }

      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
      if (daysUntilExpiry < 0) {
        variant = 'destructive';
      } else if (daysUntilExpiry <= 30) {
        variant = 'outline';
      }

      return (
        <div className="flex items-center gap-2">
          <span>{format(expiryDate, 'MMM d, yyyy')}</span>
          {daysUntilExpiry <= 30 && (
            <Badge variant={variant}>
              {daysUntilExpiry < 0
                ? 'Expired'
                : `${daysUntilExpiry} days left`}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'coldChain',
    header: 'Cold Chain',
    cell: ({ row }) => {
      const coldChain = row.getValue('coldChain') as boolean;
      return coldChain ? (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Snowflake className="h-3 w-3" />
          Required
        </Badge>
      ) : null;
    },
  },
  {
    accessorKey: 'shipmentStatus',
    header: 'Shipment Status',
    cell: ({ row }) => {
      const status = row.getValue('shipmentStatus') as Medicine['shipmentStatus'];
      if (!status) return null;
      
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
      switch (status) {
        case 'Delivered':
          variant = 'default';
          break;
        case 'In Transit':
          variant = 'secondary';
          break;
        case 'Delayed':
        case 'Exception':
          variant = 'destructive';
          break;
        default:
          variant = 'outline';
      }

      return (
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{status}</Badge>
          {row.original.lastShipmentDate && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(row.original.lastShipmentDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const medicine = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(medicine.id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(medicine.id)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(medicine.id)}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => navigator.clipboard.writeText(medicine.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function getColumns({ onEdit, onDelete, onViewDetails }: {
  onEdit: (medicine: Medicine) => void,
  onDelete: (medicineId: string) => void,
  onViewDetails: (medicine: Medicine) => void,
}): ColumnDef<Medicine>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'manufacturer',
      header: 'Manufacturer',
    },
    {
      accessorKey: 'batchNo',
      header: 'Batch No.',
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Quantity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        return (
          <div className="font-medium">
            {quantity}
            {quantity < 10 && (
              <Badge variant="destructive" className="ml-2">
                Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'expiryDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Expiry Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const expiryDateStr = row.getValue('expiryDate') as string;
        let expiryDate: Date;
        try {
          expiryDate = new Date(expiryDateStr);
          if (isNaN(expiryDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (error) {
          console.error('Invalid expiry date:', expiryDateStr);
          return <span className="text-destructive">Invalid date</span>;
        }

        const today = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
        if (daysUntilExpiry < 0) {
          variant = 'destructive';
        } else if (daysUntilExpiry <= 30) {
          variant = 'outline';
        }

        return (
          <div className="flex items-center gap-2">
            <span>{format(expiryDate, 'MMM d, yyyy')}</span>
            {daysUntilExpiry <= 30 && (
              <Badge variant={variant}>
                {daysUntilExpiry < 0
                  ? 'Expired'
                  : `${daysUntilExpiry} days left`}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'coldChain',
      header: 'Cold Chain',
      cell: ({ row }) => {
        const coldChain = row.getValue('coldChain') as boolean;
        return coldChain ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Snowflake className="h-3 w-3" />
            Required
          </Badge>
        ) : null;
      },
    },
    {
      accessorKey: 'shipmentStatus',
      header: 'Shipment Status',
      cell: ({ row }) => {
        const status = row.getValue('shipmentStatus') as Medicine['shipmentStatus'];
        if (!status) return null;
        
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
        switch (status) {
          case 'Delivered':
            variant = 'default';
            break;
          case 'In Transit':
            variant = 'secondary';
            break;
          case 'Delayed':
          case 'Exception':
            variant = 'destructive';
            break;
          default:
            variant = 'outline';
        }

        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant}>{status}</Badge>
            {row.original.lastShipmentDate && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(row.original.lastShipmentDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const medicine = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(medicine.id)}>
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewDetails(medicine)}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(medicine)}>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(medicine.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
} 