'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Truck, QrCode as QrCodeIcon, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/inventory/data-table';
import { AddMedicineButton } from '@/components/inventory/add-medicine-button';
import { InventoryBanner } from '@/components/inventory/inventory-banner';
import { useMedicines, useDeleteMedicine } from '@/hooks/use-medicines';
import { PageShell, PageHeader, PageSection } from '@/components/layout/page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export default function InventoryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: medicines = [], isLoading, error } = useMedicines();
  const deleteMedicineMutation = useDeleteMedicine();

  const handleDeleteMedicine = async (medicineId: string) => {
    try {
      await deleteMedicineMutation.mutateAsync(medicineId);
      toast({
        title: 'Medicine Deleted',
        description: 'The medicine has been successfully removed from inventory.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete medicine. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.batchNo.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getStatusInfo = (expiryDate: string, quantity: number) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (daysUntilExpiry < 0) {
      return { label: 'Expired', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', variant: 'secondary' as const, color: 'text-yellow-600' };
    } else {
      return { label: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
    }
  };

  const header = (
    <PageHeader
      eyebrow="Inventory"
      title="Medicine Library"
      description="Manage every lot on hand with expiry intelligence and quick actions tailored to your clinic."
      actions={<AddMedicineButton />}
    />
  );

  if (error) {
    return (
      <PageShell>
        {header}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Inventory data unavailable</AlertTitle>
          <AlertDescription>
            We could not load your medicines. Please retry or check your network connection.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {header}

      <div className="grid gap-6">
        <InventoryBanner inventory={medicines} />

        <PageSection
          title="Medicines overview"
          description="Search, filter, and take action on every batch in your clinic."
        >
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/30 p-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredMedicines}
              columns={[
                {
                  accessorKey: 'name',
                  header: 'Medicine Name',
                  cell: ({ row }) => (
                    <div>
                      <div className="font-medium">{row.getValue('name')}</div>
                      <div className="text-sm text-muted-foreground">{row.original.manufacturer}</div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'batchNo',
                  header: 'Batch Number',
                },
                {
                  accessorKey: 'quantity',
                  header: 'Quantity',
                  cell: ({ row }) => (
                    <Badge variant="outline">{row.getValue('quantity')} units</Badge>
                  ),
                },
                {
                  accessorKey: 'expiryDate',
                  header: 'Expiry Date',
                  cell: ({ row }) => {
                    const expiryDate = new Date(row.getValue('expiryDate'));
                    return <div className="text-sm">{expiryDate.toLocaleDateString()}</div>;
                  },
                },
                {
                  accessorKey: 'status',
                  header: 'Status',
                  cell: ({ row }) => {
                    const status = getStatusInfo(row.original.expiryDate, row.original.quantity);
                    return (
                      <Badge variant={status.variant} className={status.color}>
                        {status.label}
                      </Badge>
                    );
                  },
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <QrCodeIcon className="h-4 w-4" />
                        <span className="sr-only">Generate QR Code</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Truck className="h-4 w-4" />
                        <span className="sr-only">Ship</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteMedicine(row.original.id)}
                        disabled={deleteMedicineMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  ),
                },
              ]}
              isLoading={isLoading}
            />
          )}
        </PageSection>
      </div>
    </PageShell>
  );
}
