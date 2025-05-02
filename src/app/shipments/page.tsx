// src/app/shipments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Truck, Map, List, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// --- Types ---
interface Shipment {
  id: string; // Firestore document ID
  medicineId: string; // Reference to the medicine doc ID
  medicineName?: string; // Denormalized for display
  courier: string;
  trackingNo?: string; // Optional, might be added later
  status: 'Pre-Transit' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed' | 'Exception'; // Example statuses
  currentLat?: number;
  currentLng?: number;
  lastTemp?: string; // Assuming string like '4°C'
  eta?: string; // Assuming string 'YYYY-MM-DD'
  pickupDate: string; // Assuming string 'YYYY-MM-DD'
  createdAt?: any;
}

interface MedicineStub { // For the dropdown in create shipment modal
  id: string;
  name: string;
}

// --- Mock/Placeholder API Functions ---
const fetchShipments = async (clinicId: string | undefined): Promise<Shipment[]> => {
  if (!clinicId) return [];
  console.log(`Fetching shipments for clinic ${clinicId} (simulated)...`);
  // TODO: Implement Firestore query: collection(db, `clinics/${clinicId}/shipments`)
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    { id: 'shp1', medicineId: 'med5', medicineName: 'Insulin Glargine', trackingNo: 'EZ1000000001', courier: 'FedEx', status: 'In Transit', currentLat: 41.88, currentLng: -87.63, lastTemp: '4°C', eta: '2024-08-15', pickupDate: '2024-08-05' },
    { id: 'shp2', medicineId: 'med1', medicineName: 'Aspirin 81mg', trackingNo: 'EZ2000000002', courier: 'UPS', status: 'Delivered', currentLat: 40.71, currentLng: -74.00, eta: '2024-08-10', pickupDate: '2024-08-01' },
    { id: 'shp3', medicineId: 'batchX', medicineName: 'Vaccine Batch X', trackingNo: 'EZ3000000003', courier: 'DHL', status: 'Out for Delivery', currentLat: 34.05, currentLng: -118.24, lastTemp: '3°C', eta: '2024-08-12', pickupDate: '2024-08-08' },
    { id: 'shp4', medicineId: 'med2', medicineName: 'Metformin 500mg', trackingNo: 'EZ4000000004', courier: 'USPS', status: 'Pre-Transit', eta: '2024-08-18', pickupDate: '2024-08-11' },
  ];
};

// Fetch minimal medicine data for the dropdown
const fetchMedicineStubs = async (clinicId: string | undefined): Promise<MedicineStub[]> => {
     if (!clinicId) return [];
     console.log(`Fetching medicine stubs for clinic ${clinicId} (simulated)...`);
     // TODO: Implement Firestore query: collection(db, `clinics/${clinicId}/medicines`), select('name')
     await new Promise(resolve => setTimeout(resolve, 500));
     return [
         { id: 'med1', name: 'Aspirin 81mg' },
         { id: 'med2', name: 'Metformin 500mg' },
         { id: 'med5', name: 'Insulin Glargine' },
     ];
};

const createShipmentApi = async (clinicId: string | undefined, shipmentData: Omit<Shipment, 'id' | 'status' | 'createdAt'>): Promise<Shipment> => {
    if (!clinicId) throw new Error("Clinic ID is required.");
    console.log(`Creating shipment in clinic ${clinicId} (simulated):`, shipmentData);
    // TODO: Implement Firestore addDoc: addDoc(collection(db, `clinics/${clinicId}/shipments`), { ...shipmentData, status: 'Pre-Transit', createdAt: serverTimestamp() })
    await new Promise(resolve => setTimeout(resolve, 500));
    const newId = `shp${Math.random().toString(16).slice(2)}`;
    return { ...shipmentData, id: newId, status: 'Pre-Transit', createdAt: new Date() }; // Simulate result
};

// Function to get status badge variant
function getStatusBadgeVariant(status: Shipment['status']): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' {
    switch (status) {
        case 'Delivered': return 'default'; // Green (using primary as default green)
        case 'Out for Delivery': return 'outline'; // Blue outline
        case 'In Transit': return 'secondary'; // Gray
        case 'Delayed': return 'destructive'; // Red
        case 'Exception': return 'destructive'; // Red
        case 'Pre-Transit': return 'warning'; // Use custom warning variant if defined, or outline/secondary
        default: return 'secondary';
    }
}

// Map container style
const mapContainerStyle = {
  height: '60vh', // Adjust height as needed
  width: '100%',
  borderRadius: '8px', // Match card radius
};

// Default map center (e.g., center of the US or clinic location)
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};


export default function ShipmentsPage() {
  const { profile, authLoading } = useAuth();
  const clinicId = profile?.clinicId;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({ medicineId: '', courier: '', pickupDate: '' });

  // --- Google Maps Loader ---
   const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
     // Ensure API key is correctly loaded from .env
     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
     // libraries: ['places'], // Add libraries if needed
   });

  // --- React Query ---
  const { data: shipments = [], isLoading: isLoadingShipments, isError: isShipmentsError, error: shipmentsError } = useQuery<Shipment[], Error>({
    queryKey: ['shipments', clinicId],
    queryFn: () => fetchShipments(clinicId),
    enabled: !!clinicId && !authLoading,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for live updates (adjust as needed)
  });

  const { data: medicineStubs = [], isLoading: isLoadingMedStubs } = useQuery<MedicineStub[], Error>({
      queryKey: ['medicineStubs', clinicId],
      queryFn: () => fetchMedicineStubs(clinicId),
      enabled: !!clinicId && !authLoading && isCreateModalOpen, // Load only when modal is open
      staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });


  const createMutation = useMutation({
    mutationFn: (data: Omit<Shipment, 'id' | 'status' | 'createdAt'>) => createShipmentApi(clinicId, data),
    onSuccess: (newShipment) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', clinicId] });
      toast({ title: "Shipment Created", description: `Shipment for ${newShipment.medicineName || newShipment.medicineId} initiated.` });
      setIsCreateModalOpen(false);
      setCreateFormData({ medicineId: '', courier: '', pickupDate: '' }); // Reset form
    },
    onError: (error) => {
      toast({ title: "Error Creating Shipment", description: error.message, variant: "destructive" });
    },
  });

  // --- Handlers ---
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.medicineId || !createFormData.courier || !createFormData.pickupDate) {
        toast({ title: "Missing Information", description: "Please select medicine, courier, and pickup date.", variant: "destructive" });
        return;
    }
    const selectedMedicineName = medicineStubs.find(m => m.id === createFormData.medicineId)?.name;
    createMutation.mutate({ ...createFormData, medicineName: selectedMedicineName });
  };

  const handleMarkerClick = (shipment: Shipment) => {
      setSelectedShipment(shipment);
      // In a real app, you might open a Popover here instead of just setting state
      console.log("Selected shipment:", shipment);
  };

  const pageLoading = authLoading || (isLoadingShipments && shipments.length === 0); // Loading state

  if (pageLoading) {
     return <div className="p-6"><Skeleton className="h-[70vh] w-full bg-muted" /></div>; // Use muted bg
  }

  if (isShipmentsError) {
      return <div className="p-6 text-destructive">Error loading shipments: {shipmentsError?.message}</div>;
  }


  return (
    <div className="space-y-6 animate-fadeIn p-6"> {/* Added padding */}
       <Card className="panel-primary"> {/* Use primary white panel */}
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Shipment Tracking</CardTitle>
              <CardDescription>Monitor your active and past shipments.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="icon" onClick={() => setViewMode('list')} disabled={viewMode === 'list'}>
                 <List className="h-4 w-4" />
                 <span className="sr-only">List View</span>
               </Button>
               <Button variant="outline" size="icon" onClick={() => setViewMode('map')} disabled={viewMode === 'map'}>
                 <Map className="h-4 w-4" />
                 <span className="sr-only">Map View</span>
               </Button>
               <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={!clinicId}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Shipment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="panel-primary sm:max-w-[450px]"> {/* Use primary white panel */}
                        <DialogHeader>
                            <DialogTitle>Create New Shipment</DialogTitle>
                            <DialogDescription>Select medicine and provide shipment details.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="medicineId" className="text-right">Medicine*</Label>
                                    <Select
                                        value={createFormData.medicineId}
                                        onValueChange={(value) => setCreateFormData(prev => ({...prev, medicineId: value}))}
                                        required
                                    >
                                        <SelectTrigger id="medicineId" className="col-span-3" disabled={isLoadingMedStubs}>
                                            <SelectValue placeholder={isLoadingMedStubs ? "Loading..." : "Select medicine"} />
                                        </SelectTrigger>
                                        <SelectContent className="overlay-tertiary"> {/* Use light gray tertiary overlay */}
                                            {medicineStubs.map(med => (
                                                <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                                            ))}
                                            {!isLoadingMedStubs && medicineStubs.length === 0 && <p className="p-2 text-sm text-muted-foreground">No medicines found</p>}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="courier" className="text-right">Courier*</Label>
                                    <Input id="courier" value={createFormData.courier} onChange={(e) => setCreateFormData(prev => ({...prev, courier: e.target.value}))} required className="col-span-3" placeholder="e.g., FedEx, UPS"/>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="pickupDate" className="text-right">Pickup Date*</Label>
                                    <Input id="pickupDate" type="date" value={createFormData.pickupDate} onChange={(e) => setCreateFormData(prev => ({...prev, pickupDate: e.target.value}))} required className="col-span-3"/>
                                </div>
                                {/* Add tracking number field if needed */}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Shipment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
             {viewMode === 'list' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead className="hidden sm:table-cell">Tracking No.</TableHead>
                      <TableHead className="hidden md:table-cell">Courier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Temp</TableHead>
                      <TableHead className="hidden md:table-cell">ETA</TableHead>
                      <TableHead><span className="sr-only">Details</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleMarkerClick(shipment)}>
                        <TableCell className="font-medium">{shipment.medicineName || shipment.medicineId}</TableCell>
                        <TableCell className="hidden sm:table-cell">{shipment.trackingNo || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{shipment.courier}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(shipment.status)}>{shipment.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{shipment.lastTemp || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{shipment.eta || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                           {/* Use Popover for details on click */}
                           <Popover>
                               <PopoverTrigger asChild>
                                   <Button variant="ghost" size="sm">Details</Button>
                               </PopoverTrigger>
                               <PopoverContent className="overlay-secondary w-60"> {/* Use secondary overlay (light gray) */}
                                   <div className="space-y-1 text-sm">
                                       <p><strong>Medicine:</strong> {shipment.medicineName || shipment.medicineId}</p>
                                       <p><strong>Tracking:</strong> {shipment.trackingNo || 'N/A'}</p>
                                       <p><strong>Status:</strong> {shipment.status}</p>
                                       <p><strong>Last Temp:</strong> {shipment.lastTemp || 'N/A'}</p>
                                       <p><strong>ETA:</strong> {shipment.eta || 'N/A'}</p>
                                       {/* Add more details */}
                                   </div>
                               </PopoverContent>
                           </Popover>
                        </TableCell>
                      </TableRow>
                    ))}
                    {shipments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No shipments found.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
             )}
             {viewMode === 'map' && (
                <div>
                    {mapLoadError && <div className="text-destructive p-4">Error loading map. Please check API key and network.</div>}
                    {!isMapLoaded && !mapLoadError && <Skeleton className="h-[60vh] w-full rounded-md bg-muted" />} {/* Muted skeleton */}
                    {isMapLoaded && !mapLoadError && (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={selectedShipment && selectedShipment.currentLat && selectedShipment.currentLng ? { lat: selectedShipment.currentLat, lng: selectedShipment.currentLng } : defaultCenter}
                            zoom={selectedShipment ? 12 : 4} // Zoom in if a shipment is selected
                        >
                         {shipments.filter(s => s.currentLat && s.currentLng).map((shipment) => (
                            <Marker
                                key={shipment.id}
                                position={{ lat: shipment.currentLat!, lng: shipment.currentLng! }}
                                title={`${shipment.medicineName || shipment.medicineId} (${shipment.status})`}
                                onClick={() => handleMarkerClick(shipment)}
                                // TODO: Add custom icons based on status
                                // icon={{ url: getMarkerIcon(shipment.status), scaledSize: new window.google.maps.Size(30, 30) }}
                             />
                         ))}
                        </GoogleMap>
                    )}
                     {/* Display selected shipment details below map */}
                     {selectedShipment && (
                         <Card className="mt-4 panel-secondary"> {/* Use secondary panel (light gray) */}
                             <CardHeader>
                                 <CardTitle className="text-base">Selected Shipment: {selectedShipment.trackingNo || selectedShipment.id}</CardTitle>
                             </CardHeader>
                             <CardContent className="text-sm space-y-1">
                                 <p><strong>Medicine:</strong> {selectedShipment.medicineName || selectedShipment.medicineId}</p>
                                 <p><strong>Status:</strong> {selectedShipment.status}</p>
                                 <p><strong>Last Temp:</strong> {selectedShipment.lastTemp || 'N/A'}</p>
                                 <p><strong>ETA:</strong> {selectedShipment.eta || 'N/A'}</p>
                             </CardContent>
                         </Card>
                     )}
                </div>
             )}
          </CardContent>
        </Card>
    </div>
  );
}