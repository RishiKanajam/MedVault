// src/app/inventory/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, MoreHorizontal, Edit, Trash2, Truck, QrCode as QrCodeIcon, Loader2, Calendar as CalendarIcon } from 'lucide-react'; // Added Loader2, CalendarIcon
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import QRCode from 'qrcode.react'; // Import QR Code component
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { DataTable } from '@/components/inventory/data-table';
import { columns, getColumns } from '@/components/inventory/columns';
import { AddMedicineButton } from '@/components/inventory/add-medicine-button';
import { InventoryBanner } from '@/components/inventory/inventory-banner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';

// Inventory Page for MediSync Pro
// Purpose: Manage medicines inventory—list, add, edit, delete, and ship medicines. Includes QR code generation and expiry/stock alerts.
// Data Flow: Uses mock API functions; replace with Firestore queries/mutations via React Query.
// TODO: Replace all mock API functions with real Firestore calls (see inline TODOs).
// TODO: Add accessibility improvements for table and modals.
// TODO: Add loading skeletons for all table and modal states.
// TODO: Add inline comments for each major section and function.

// --- Types (Assuming Firestore structure) ---
interface Medicine {
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

// --- Mock API Functions (Replace with Actual Firestore Calls via React Query) ---
// These should interact with Firestore, using the clinicId from the profile
const fetchMedicines = async (clinicId: string | undefined): Promise<Medicine[]> => {
  if (!clinicId) return []; // Return empty if no clinicId
  console.log(`Fetching medicines for clinic ${clinicId} (simulated)...`);
  // TODO: Implement Firestore query: collection(db, `clinics/${clinicId}/medicines`)
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Replace with actual fetched data
  return [
    { id: 'med1', name: 'Aspirin 81mg', manufacturer: 'Bayer', batchNo: 'B12345', quantity: 150, expiryDate: '2025-12-31', coldChain: false },
    { id: 'med2', name: 'Metformin 500mg', manufacturer: 'Genericorp', batchNo: 'M67890', quantity: 45, expiryDate: '2024-11-15', coldChain: false },
    { id: 'med3', name: 'Atorvastatin 20mg', manufacturer: 'Pfizer', batchNo: 'A11223', quantity: 200, expiryDate: '2024-06-30', coldChain: false },
    { id: 'med4', name: 'Amoxicillin 250mg', manufacturer: 'Sandoz', batchNo: 'X44556', quantity: 0, expiryDate: '2025-01-01', coldChain: false },
    { id: 'med5', name: 'Insulin Glargine', manufacturer: 'Sanofi', batchNo: 'I99887', quantity: 25, expiryDate: '2025-02-28', coldChain: false },
  ];
};

const addMedicine = async (clinicId: string | undefined, newMedicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  if (!clinicId) throw new Error("Clinic ID is required to add medicine.");
  console.log(`Adding medicine to clinic ${clinicId} (simulated):`, newMedicine);
  // TODO: Implement Firestore addDoc: addDoc(collection(db, `clinics/${clinicId}/medicines`), { ...newMedicine, createdAt: serverTimestamp() })
  await new Promise(resolve => setTimeout(resolve, 500));
  const addedDoc = { ...newMedicine, id: `med${Math.random().toString(16).slice(2)}`, createdAt: new Date() }; // Simulate added doc
  return addedDoc;
};

const updateMedicine = async (clinicId: string | undefined, updatedMedicine: Medicine): Promise<Medicine> => {
  if (!clinicId) throw new Error("Clinic ID is required to update medicine.");
  console.log(`Updating medicine ${updatedMedicine.id} in clinic ${clinicId} (simulated):`, updatedMedicine);
  // TODO: Implement Firestore updateDoc: updateDoc(doc(db, `clinics/${clinicId}/medicines`, updatedMedicine.id), { ...updatedMedicine })
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...updatedMedicine }; // Simulate updated doc
};

const deleteMedicine = async (clinicId: string | undefined, medicineId: string): Promise<void> => {
  if (!clinicId) throw new Error("Clinic ID is required to delete medicine.");
  const medicineRef = doc(db, 'clinics', clinicId, 'medicines', medicineId);
  await deleteDoc(medicineRef);
};

const createShipment = async (clinicId: string | undefined, shipmentData: { medicineId: string; courier: string; pickupDate: string }): Promise<void> => {
    if (!clinicId) throw new Error("Clinic ID is required to create shipment.");
    
    // Create the shipment document
    const shipmentRef = await addDoc(collection(db, `clinics/${clinicId}/shipments`), {
        ...shipmentData,
        status: 'Pre-Transit',
        createdAt: serverTimestamp(),
    });

    // Update the medicine document to reflect the shipment
    const medicineRef = doc(db, `clinics/${clinicId}/medicines`, shipmentData.medicineId);
    await updateDoc(medicineRef, {
        lastShipmentId: shipmentRef.id,
        lastShipmentDate: shipmentData.pickupDate,
        shipmentStatus: 'Pre-Transit',
    });
};
// --- End Mock API Functions ---


// Helper function to determine badge status
function getStatusInfo(expiry: string, qty: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string } {
  try {
    const now = new Date();
    const expiryDate = new Date(expiry); // Ensure expiry is a valid date string
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    if (isNaN(expiryDate.getTime())) { // Handle invalid date format
       return { label: 'Invalid Date', variant: 'destructive', color: 'text-danger' }; // Use danger color
    }

    if (expiryDate < now) {
      return { label: 'Expired', variant: 'destructive', color: 'text-danger' }; // Use danger color
    }
    if (qty <= 0) {
       return { label: 'Out of Stock', variant: 'secondary', color: 'text-muted-foreground' }; // More muted
    }
    if (expiryDate < sevenDaysFromNow) {
      return { label: 'Expiring Soon', variant: 'outline', color: 'text-warning' }; // Use warning color
    }
    return { label: 'In Stock', variant: 'default', color: 'text-primary-foreground' }; // Use primary bg with light text
  } catch (e) {
      console.error("Error parsing expiry date:", expiry, e);
      return { label: 'Date Error', variant: 'destructive', color: 'text-danger' }; // Use danger color
  }
}

const editFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  batchNo: z.string().min(1, 'Batch number is required'),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or greater'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  coldChain: z.boolean().default(false),
  temperatureRange: z.object({
    min: z.coerce.number(),
    max: z.coerce.number(),
  }).optional(),
});

function EditMedicineDialog({ open, onOpenChange, medicine, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: Medicine | null;
  onSubmit: (data: any) => void;
}) {
  const form = useForm({
    resolver: zodResolver(editFormSchema),
    defaultValues: medicine || {
      name: '',
      manufacturer: '',
      batchNo: '',
      quantity: 0,
      expiryDate: '',
      coldChain: false,
      temperatureRange: { min: 0, max: 0 },
    },
    values: medicine || undefined,
  });

  if (!medicine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Medicine</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batchNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coldChain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cold Chain</FormLabel>
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Optionally add temperatureRange fields if coldChain is true */}
            {form.watch('coldChain') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperatureRange.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperatureRange.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, loading } = useAuth();
  const clinicId = profile?.clinicId; // Extract clinicId
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<Omit<Medicine, 'id'>>({ name: '', manufacturer: '', batchNo: '', quantity: 0, expiryDate: '', coldChain: false });
  const [expiryDate, setExpiryDate] = React.useState<Date | undefined>(undefined);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsMedicine, setDetailsMedicine] = useState<Medicine | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMedicineId, setDeleteMedicineId] = useState<string | null>(null);


  // --- React Query ---
   const { data: inventory, isLoading: isLoadingInventory, error: inventoryError } = useQuery<Medicine[]>({
     queryKey: ['inventory', profile?.clinicId],
     queryFn: async () => {
       if (!profile?.clinicId) return [];
       const q = query(
         collection(db, 'clinics', profile.clinicId, 'medicines'),
         orderBy('name', 'asc')
       );
       const snapshot = await getDocs(q);
       return snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       } as Medicine));
     },
     enabled: !!profile?.clinicId
   });

   const resetForm = () => {
     setFormData({ name: '', manufacturer: '', batchNo: '', quantity: 0, expiryDate: '', coldChain: false });
     setExpiryDate(undefined);
   };

   const addMutation = useMutation({
     mutationFn: (newMedicine: Omit<Medicine, 'id'>) => addMedicine(clinicId || undefined, newMedicine),
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
       toast({ title: "Medicine Added", description: `${data.name} added successfully.` });
       setIsAddModalOpen(false);
       resetForm();
     },
     onError: (error) => {
       toast({ title: "Error Adding", description: error.message, variant: "destructive" });
     },
   });

   const updateMutation = useMutation({
     mutationFn: (updatedMedicine: Medicine) => updateMedicine(clinicId || undefined, updatedMedicine),
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
       toast({ title: "Medicine Updated", description: `${data.name} updated successfully.` });
       setIsEditModalOpen(false);
       resetForm();
     },
     onError: (error) => {
       toast({ title: "Error Updating", description: error.message, variant: "destructive" });
     },
   });

   const deleteMutation = useMutation({
      mutationFn: (medicineId: string) => deleteMedicine(clinicId || undefined, medicineId),
      onSuccess: (_, deletedId) => {
          // Optimistic update: remove the item immediately from the cache
          queryClient.setQueryData(['medicines', clinicId], (oldData: Medicine[] | undefined) =>
              oldData ? oldData.filter(med => med.id !== deletedId) : []
          );
          toast({ title: "Medicine Deleted", description: "Item removed from inventory." });
          // Invalidate query to ensure consistency if optimistic update fails
          queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
      },
      onError: (error) => {
          toast({ title: "Error Deleting", description: error.message, variant: "destructive" });
      },
   });

    const shipmentMutation = useMutation({
        mutationFn: (shipmentData: { medicineId: string; courier: string; pickupDate: string }) => createShipment(clinicId || undefined, shipmentData),
        onSuccess: (_, variables) => {
            // Invalidate both medicines and shipments queries
            queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
            queryClient.invalidateQueries({ queryKey: ['shipments', clinicId] });
            toast({ 
                title: "Shipment Created", 
                description: `Shipment created successfully for medicine ${variables.medicineId}.`
            });
        },
        onError: (error) => {
            toast({ title: "Error Creating Shipment", description: error.message, variant: "destructive" });
        },
    });

    const markAsDeliveredMutation = useMutation({
      mutationFn: async (medicineId: string) => {
        if (!clinicId) throw new Error("Clinic ID is required.");
        const medicineRef = doc(db, 'clinics', clinicId, 'medicines', medicineId);
        await updateDoc(medicineRef, {
          shipmentStatus: 'Delivered',
          lastShipmentDate: new Date().toISOString(),
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory', clinicId] });
        toast({ title: "Shipment Delivered", description: "Status updated to Delivered." });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });

  const handleMedicineAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory', profile?.clinicId] });
  };

  const handleBulkAction = async (action: 'delete' | 'export' | 'qr') => {
    toast({ title: 'Bulk action', description: `Action: ${action}` });
  };

  const handleEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsEditModalOpen(true);
  };

  const handleDelete = (medicineId: string) => {
    setDeleteMedicineId(medicineId);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (medicine: Medicine) => {
    setDetailsMedicine(medicine);
    setDetailsDialogOpen(true);
  };

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewDetails: handleViewDetails,
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <AddMedicineButton onMedicineAdded={handleMedicineAdded} />
      </div>
      <InventoryBanner inventory={inventory || []} />
      <DataTable
        columns={columns}
        data={inventory || []}
        isLoading={isLoadingInventory}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onBulkAction={handleBulkAction}
      />

      {/* Edit Medicine Dialog */}
      <EditMedicineDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        medicine={selectedMedicine}
        onSubmit={(data) => {
          if (selectedMedicine) {
            updateMutation.mutate({ ...selectedMedicine, ...data });
          }
        }}
      />

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medicine Details</DialogTitle>
          </DialogHeader>
          {detailsMedicine && (
            <div className="space-y-2">
              <div><strong>Name:</strong> {detailsMedicine.name}</div>
              <div><strong>Expiry Date:</strong> {detailsMedicine.expiryDate}</div>
              <div><strong>Quantity:</strong> {detailsMedicine.quantity}</div>
              <div>
                <strong>QR Code:</strong>
                <div className="mt-2">
                  <QRCode value={detailsMedicine.batchNo || detailsMedicine.id} size={128} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {detailsMedicine && detailsMedicine.shipmentStatus !== 'Delivered' && (
              <Button
                onClick={() => {
                  markAsDeliveredMutation.mutate(detailsMedicine.id);
                  setDetailsDialogOpen(false);
                }}
                disabled={markAsDeliveredMutation.status === 'loading'}
              >
                {markAsDeliveredMutation.status === 'loading' ? "Marking..." : "Mark as Delivered"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this medicine? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteMedicineId) {
                  deleteMutation.mutate(deleteMedicineId);
                  setDeleteDialogOpen(false);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
