
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
import { PlusCircle, Search, MoreHorizontal, Edit, Trash2, Truck, QrCode as QrCodeIcon } from 'lucide-react';
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
import { Calendar as CalendarIcon } from "lucide-react"
import QRCode from 'qrcode.react'; // Import QR Code component
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth

// --- Types (Assuming Firestore structure) ---
interface Medicine {
  id: string; // Firestore document ID
  name: string;
  manufacturer: string;
  batch: string;
  qty: number;
  expiry: string; // Store as ISO string 'YYYY-MM-DD'
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  // Add other fields like lastTemp, lastHum if needed for cold chain
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
    { id: 'med1', name: 'Aspirin 81mg', manufacturer: 'Bayer', batch: 'B12345', qty: 150, expiry: '2025-12-31' },
    { id: 'med2', name: 'Metformin 500mg', manufacturer: 'Genericorp', batch: 'M67890', qty: 45, expiry: '2024-11-15' },
    { id: 'med3', name: 'Atorvastatin 20mg', manufacturer: 'Pfizer', batch: 'A11223', qty: 200, expiry: '2024-06-30' },
    { id: 'med4', name: 'Amoxicillin 250mg', manufacturer: 'Sandoz', batch: 'X44556', qty: 0, expiry: '2025-01-01' },
    { id: 'med5', name: 'Insulin Glargine', manufacturer: 'Sanofi', batch: 'I99887', qty: 25, expiry: '2025-02-28' },
  ];
};

const addMedicine = async (clinicId: string | undefined, newMedicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  if (!clinicId) throw new Error("Clinic ID is required to add medicine.");
  console.log(`Adding medicine to clinic ${clinicId} (simulated):`, newMedicine);
  // TODO: Implement Firestore addDoc: addDoc(collection(db, `clinics/${clinicId}/medicines`), { ...newMedicine, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await new Promise(resolve => setTimeout(resolve, 500));
  const addedDoc = { ...newMedicine, id: `med${Math.random().toString(16).slice(2)}`, createdAt: new Date(), updatedAt: new Date() }; // Simulate added doc
  return addedDoc;
};

const updateMedicine = async (clinicId: string | undefined, updatedMedicine: Medicine): Promise<Medicine> => {
  if (!clinicId) throw new Error("Clinic ID is required to update medicine.");
  console.log(`Updating medicine ${updatedMedicine.id} in clinic ${clinicId} (simulated):`, updatedMedicine);
  // TODO: Implement Firestore updateDoc: updateDoc(doc(db, `clinics/${clinicId}/medicines`, updatedMedicine.id), { ...updatedMedicine, updatedAt: serverTimestamp() })
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...updatedMedicine, updatedAt: new Date() }; // Simulate updated doc
};

const deleteMedicine = async (clinicId: string | undefined, medicineId: string): Promise<void> => {
  if (!clinicId) throw new Error("Clinic ID is required to delete medicine.");
  console.log(`Deleting medicine ${medicineId} from clinic ${clinicId} (simulated)...`);
  // TODO: Implement Firestore deleteDoc: deleteDoc(doc(db, `clinics/${clinicId}/medicines`, medicineId))
  await new Promise(resolve => setTimeout(resolve, 500));
};

const createShipment = async (clinicId: string | undefined, shipmentData: { medicineId: string; courier: string; pickupDate: string }): Promise<void> => {
    if (!clinicId) throw new Error("Clinic ID is required to create shipment.");
    console.log(`Creating shipment in clinic ${clinicId} (simulated):`, shipmentData);
    // TODO: Implement Firestore addDoc: addDoc(collection(db, `clinics/${clinicId}/shipments`), { ...shipmentData, status: 'Pre-Transit', createdAt: serverTimestamp() })
    await new Promise(resolve => setTimeout(resolve, 500));
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
       return { label: 'Invalid Date', variant: 'destructive', color: 'text-destructive' };
    }

    if (expiryDate < now) {
      return { label: 'Expired', variant: 'destructive', color: 'text-destructive' };
    }
    if (qty <= 0) {
       return { label: 'Out of Stock', variant: 'secondary', color: 'text-yellow-600' };
    }
    if (expiryDate < sevenDaysFromNow) {
      return { label: 'Expiring Soon', variant: 'outline', color: 'text-orange-500' };
    }
    return { label: 'In Stock', variant: 'default', color: 'text-green-600' };
  } catch (e) {
      console.error("Error parsing expiry date:", expiry, e);
      return { label: 'Date Error', variant: 'destructive', color: 'text-destructive' };
  }
}


export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, authLoading } = useAuth(); // Use profile to get clinicId
  const clinicId = profile?.clinicId; // Extract clinicId

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<Omit<Medicine, 'id'>>({ name: '', manufacturer: '', batch: '', qty: 0, expiry: '' });
  const [expiryDate, setExpiryDate] = React.useState<Date | undefined>(undefined);


  // --- React Query ---
   const { data: medicines = [], isLoading: isLoadingMedicines, isError, error } = useQuery<Medicine[], Error>({
     queryKey: ['medicines', clinicId], // Include clinicId in the query key
     queryFn: () => fetchMedicines(clinicId),
     enabled: !!clinicId && !authLoading, // Only fetch if clinicId exists and auth is loaded
     staleTime: 1000 * 60 * 5, // 5 minutes
   });

   const addMutation = useMutation({
     mutationFn: (newMedicine: Omit<Medicine, 'id'>) => addMedicine(clinicId, newMedicine),
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
     mutationFn: (updatedMedicine: Medicine) => updateMedicine(clinicId, updatedMedicine),
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
      mutationFn: (medicineId: string) => deleteMedicine(clinicId, medicineId),
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
        mutationFn: (shipmentData: { medicineId: string; courier: string; pickupDate: string }) => createShipment(clinicId, shipmentData),
        onSuccess: (_, variables) => {
            // Optionally invalidate shipments query if you have one
            // queryClient.invalidateQueries({ queryKey: ['shipments', clinicId] });
            toast({ title: "Shipment Created", description: `Shipment initiated for Medicine ID ${variables.medicineId}.` });
            setIsShipModalOpen(false);
            setSelectedMedicine(null);
        },
        onError: (error) => {
            toast({ title: "Error Creating Shipment", description: error.message, variant: "destructive" });
        },
    });

   // --- End React Query ---


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

   const handleDateSelect = (date: Date | undefined) => {
        setExpiryDate(date);
        if (date) {
            setFormData((prev) => ({ ...prev, expiry: format(date, "yyyy-MM-dd") }));
        } else {
             setFormData((prev) => ({ ...prev, expiry: '' }));
        }
    };


  const resetForm = () => {
    setFormData({ name: '', manufacturer: '', batch: '', qty: 0, expiry: '' });
    setExpiryDate(undefined);
    setSelectedMedicine(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      manufacturer: medicine.manufacturer,
      batch: medicine.batch,
      qty: medicine.qty,
      expiry: medicine.expiry,
    });
    // Ensure expiry date is parsed correctly, handle potential invalid format
    try {
        const parsedDate = medicine.expiry ? new Date(medicine.expiry) : undefined;
         setExpiryDate(parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined);
    } catch (e) {
        console.error("Error parsing expiry date for edit modal:", medicine.expiry, e);
        setExpiryDate(undefined);
         toast({ title: "Date Error", description: `Invalid expiry date format for ${medicine.name}.`, variant: "destructive" });
    }
    setIsEditModalOpen(true);
  };

   const handleOpenShipModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsShipModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.manufacturer || !formData.batch || !formData.expiry) {
        toast({title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive"});
        return;
    }
    addMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!selectedMedicine) return;
     if (!formData.name || !formData.manufacturer || !formData.batch || !formData.expiry) {
         toast({title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive"});
         return;
     }
    updateMutation.mutate({ ...formData, id: selectedMedicine.id });
  };

  const handleDeleteConfirm = (medicineId: string) => {
    deleteMutation.mutate(medicineId);
  };

   const handleCreateShipment = (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedMedicine) return;
     const courier = (e.target as HTMLFormElement).courier.value;
     const pickupDate = (e.target as HTMLFormElement).pickupDate.value;

     if (!courier || !pickupDate) {
         toast({ title: "Missing Shipment Info", description: "Please provide courier and pickup date.", variant: "destructive" });
         return;
     }

     shipmentMutation.mutate({ medicineId: selectedMedicine.id, courier, pickupDate });
   }


  const filteredMedicines = useMemo(() => {
    if (!medicines) return [];
    if (!searchTerm) return medicines;
    return medicines.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.batch.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  const generateQRValue = (medicine: Medicine): string => {
     // Customize QR value as needed (e.g., include clinicId)
     return `MedID:${medicine.id}|Clinic:${clinicId || 'N/A'}|Name:${medicine.name}|Batch:${medicine.batch}|Expiry:${medicine.expiry}`;
   };

   // Loading state for the whole page based on auth and initial data fetch
   const pageLoading = authLoading || (isLoadingMedicines && !medicines?.length);

  return (
    <Card className="panel-primary animate-fadeIn"> {/* Use primary panel */}
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Medicine Inventory</CardTitle>
          <CardDescription>Manage and track your medicine stock.</CardDescription>
        </div>
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:flex-initial md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, manufacturer, batch..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* TODO: Implement QR Scan Button */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleOpenAddModal} disabled={!clinicId}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
            </DialogTrigger>
            <DialogContent className="panel-primary sm:max-w-[450px]"> {/* Use primary panel */}
                <DialogHeader>
                    <DialogTitle>Add New Medicine</DialogTitle>
                    <DialogDescription>Fill in the details for the new medicine.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubmit}>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name*</Label>
                            <Input id="name" value={formData.name} onChange={handleInputChange} required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="manufacturer" className="text-right">Manufacturer*</Label>
                             <Input id="manufacturer" value={formData.manufacturer} onChange={handleInputChange} required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="batch" className="text-right">Batch No.*</Label>
                            <Input id="batch" value={formData.batch} onChange={handleInputChange} required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qty" className="text-right">Quantity</Label>
                            <Input id="qty" type="number" min="0" value={formData.qty} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="expiry" className="text-right">Expiry Date*</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !expiryDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="overlay-tertiary w-auto p-0"> {/* Use tertiary overlay */}
                                <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                         </div>
                         {/* QR Code Preview (Ensure formData has necessary fields) */}
                         {formData.name && formData.batch && formData.expiry && (
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">QR Code</Label>
                                <div className="col-span-3 p-2 border rounded-md bg-white flex justify-center">
                                     {/* Pass a temporary ID or structure for QR generation */}
                                     <QRCode value={generateQRValue({...formData, id: 'temp-id'} as Medicine)} size={100} level="M" />
                                </div>
                             </div>
                         )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={addMutation.isPending}>
                         {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add Medicine'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Manufacturer</TableHead>
              <TableHead className="hidden lg:table-cell">Batch No.</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageLoading && Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skel-${index}`}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
            ))}
            {!pageLoading && isError && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-destructive">
                      Error loading inventory: {error?.message || 'Unknown error'}
                    </TableCell>
                </TableRow>
             )}
            {!pageLoading && !isError && filteredMedicines.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No inventory items found{searchTerm ? ' matching your search' : ''}.
                    </TableCell>
                </TableRow>
             )}
            {!pageLoading && !isError && filteredMedicines.map((med) => {
              const status = getStatusInfo(med.expiry, med.qty);
              return (
                <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{med.manufacturer}</TableCell>
                    <TableCell className="hidden lg:table-cell">{med.batch}</TableCell>
                    <TableCell>{med.qty}</TableCell>
                    <TableCell>{format(new Date(med.expiry), "yyyy-MM-dd")}</TableCell>
                    <TableCell>
                    <Badge variant={status.variant} className={status.color}>
                        {status.label}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </PopoverTrigger>
                             {/* Use tertiary overlay for popover */}
                            <PopoverContent className="overlay-tertiary w-40 p-1">
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleOpenEditModal(med)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleOpenShipModal(med)}>
                                <Truck className="mr-2 h-4 w-4" /> Ship
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    {/* Use primary panel for alert dialog */}
                                    <AlertDialogContent className="panel-primary">
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the medicine record for "{med.name} (Batch: {med.batch})".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteConfirm(med.id)}
                                            className={buttonVariants({ variant: "destructive" })}
                                            disabled={deleteMutation.isPending}
                                        >
                                             {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                                    const canvas = document.getElementById(`qr-${med.id}`) as HTMLCanvasElement;
                                    if (canvas) {
                                        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                                        let downloadLink = document.createElement("a");
                                        downloadLink.href = pngUrl;
                                        downloadLink.download = `${med.name}_${med.batch}_qr.png`;
                                        document.body.appendChild(downloadLink);
                                        downloadLink.click();
                                        document.body.removeChild(downloadLink);
                                    }
                                }}>
                                    <QrCodeIcon className="mr-2 h-4 w-4" /> Download QR
                                </Button>
                                {/* Hidden QR Code Canvas for Download */}
                                <div style={{ display: 'none' }}>
                                    <QRCode id={`qr-${med.id}`} value={generateQRValue(med)} size={256} level="M" />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
       {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="panel-primary sm:max-w-[450px]"> {/* Use primary panel */}
                <DialogHeader>
                    <DialogTitle>Edit Medicine</DialogTitle>
                    <DialogDescription>Update the details for {selectedMedicine?.name}.</DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleEditSubmit}>
                     <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Name*</Label>
                            <Input id="name" value={formData.name} onChange={handleInputChange} required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="edit-manufacturer" className="text-right">Manufacturer*</Label>
                             <Input id="manufacturer" value={formData.manufacturer} onChange={handleInputChange} required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="edit-batch" className="text-right">Batch No.*</Label>
                            <Input id="batch" value={formData.batch} onChange={handleInputChange} required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-qty" className="text-right">Quantity</Label>
                            <Input id="qty" type="number" min="0" value={formData.qty} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="edit-expiry" className="text-right">Expiry Date*</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !expiryDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="overlay-tertiary w-auto p-0"> {/* Use tertiary overlay */}
                                <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                         </div>
                          {/* QR Code Preview */}
                         {formData.name && formData.batch && formData.expiry && selectedMedicine && (
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">QR Code</Label>
                                <div className="col-span-3 p-2 border rounded-md bg-white flex justify-center">
                                     <QRCode value={generateQRValue({...formData, id: selectedMedicine.id})} size={100} level="M" />
                                </div>
                             </div>
                         )}
                     </div>
                     <DialogFooter>
                         <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button></DialogClose>
                         <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Save Changes'}
                         </Button>
                     </DialogFooter>
                 </form>
            </DialogContent>
       </Dialog>

       {/* Ship Modal */}
        <Dialog open={isShipModalOpen} onOpenChange={setIsShipModalOpen}>
            <DialogContent className="panel-primary sm:max-w-[425px]"> {/* Use primary panel */}
                <DialogHeader>
                    <DialogTitle>Create Shipment</DialogTitle>
                     <DialogDescription>Initiate a shipment for {selectedMedicine?.name} (Batch: {selectedMedicine?.batch}).</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateShipment}>
                     <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="courier" className="text-right">Courier*</Label>
                            <Input id="courier" placeholder="e.g., FedEx, UPS" required className="col-span-3" />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pickupDate" className="text-right">Pickup Date*</Label>
                            <Input id="pickupDate" type="date" required className="col-span-3" />
                         </div>
                     </div>
                     <DialogFooter>
                         <DialogClose asChild><Button type="button" variant="outline" onClick={() => setSelectedMedicine(null)}>Cancel</Button></DialogClose>
                         <Button type="submit" disabled={shipmentMutation.isPending}>
                            {shipmentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create Shipment'}
                         </Button>
                     </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
