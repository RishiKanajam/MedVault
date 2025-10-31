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
import { PlusCircle, Map, List, Loader2 } from 'lucide-react';
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
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { db } from '@/firebase';
import { collection, query, onSnapshot, addDoc, orderBy, getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { PageShell, PageHeader } from '@/components/layout/page';

const getDbOrThrow = () => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db;
};

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

// --- Firestore API Functions ---
function useShipmentsRealtime(clinicId: string | undefined) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!clinicId) return;
    setLoading(true);
    const dbInstance = getDbOrThrow();
    const q = query(collection(dbInstance, `clinics/${clinicId}/shipments`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setShipments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shipment)));
      setLoading(false);
    }, (error) => {
      console.error('Failed to load shipments snapshot:', error);
      setShipments([]);
      setLoading(false);
    });
    return () => unsub();
  }, [clinicId]);
  return { shipments, loading };
}

async function fetchMedicineStubs(clinicId: string | undefined): Promise<MedicineStub[]> {
  if (!clinicId) return [];
  const dbInstance = getDbOrThrow();
  const q = query(collection(dbInstance, `clinics/${clinicId}/medicines`));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
}

async function createShipmentApi(clinicId: string | undefined, shipmentData: Omit<Shipment, 'id' | 'status' | 'createdAt'>): Promise<Shipment> {
  if (!clinicId) throw new Error("Clinic ID is required.");
  const dbInstance = getDbOrThrow();
  const docRef = await addDoc(collection(dbInstance, `clinics/${clinicId}/shipments`), {
    ...shipmentData,
    status: 'Pre-Transit',
    createdAt: serverTimestamp(),
  });
  return { ...shipmentData, id: docRef.id, status: 'Pre-Transit', createdAt: new Date() };
}

// Function to get status badge variant
function getStatusBadgeVariant(status: Shipment['status']): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined {
    switch (status) {
        case 'Delivered': return 'default'; // Green (using primary as default green)
        case 'Out for Delivery': return 'outline'; // Blue outline
        case 'In Transit': return 'secondary'; // Gray
        case 'Delayed': return 'destructive'; // Red
        case 'Exception': return 'destructive'; // Red
        case 'Pre-Transit': return 'outline'; // Use outline for pre-transit
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

// Mock temperature data for sparkline (replace with real Firestore data)
const mockTempData = [
  { time: '10:00', temp: 4 },
  { time: '12:00', temp: 5 },
  { time: '14:00', temp: 6 },
  { time: '16:00', temp: 5 },
  { time: '18:00', temp: 4 },
];

// Mock location ping data for the drawer (replace with real Firestore data)
const mockLocationPings = [
  { time: '10:00', lat: 41.88, lng: -87.63 },
  { time: '12:00', lat: 41.89, lng: -87.62 },
  { time: '14:00', lat: 41.90, lng: -87.61 },
];

// --- Firestore Bulk Update for Mark as Delivered ---
async function bulkMarkAsDelivered(clinicId: string | undefined, shipmentIds: string[]) {
  if (!clinicId || shipmentIds.length === 0) return;
  const dbInstance = getDbOrThrow();
  const batch = writeBatch(dbInstance);
  shipmentIds.forEach(id => {
    const ref = doc(dbInstance, `clinics/${clinicId}/shipments/${id}`);
    batch.update(ref, { status: 'Delivered' });
  });
  await batch.commit();
}

// --- Firestore Real-time Listener for Temperature Logs ---
function useTemperatureLogRealtime(clinicId: string | undefined, shipmentId: string | undefined) {
  const [tempData, setTempData] = useState<{ time: string, temp: number }[]>([]);
  useEffect(() => {
    if (!clinicId || !shipmentId) return;
    const dbInstance = getDbOrThrow();
    const q = query(collection(dbInstance, `clinics/${clinicId}/shipments/${shipmentId}/temperatureLog`), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setTempData(snap.docs.map(doc => ({
        time: doc.data().timestamp?.toDate().toLocaleTimeString() || '',
        temp: doc.data().temp,
      })));
    });
    return () => unsub();
  }, [clinicId, shipmentId]);
  return tempData;
}

// Shipments Page for MediSync Pro
// Purpose: Track and manage medicine shipments, including live map view and cold-chain monitoring.
// Data Flow: Uses mock API functions; replace with Firestore queries/mutations via React Query.
// TODO: Replace all mock API functions with real Firestore calls (see inline TODOs).
// TODO: Add accessibility improvements for table, map, and modals.
// TODO: Add loading skeletons for all table and modal states.
// TODO: Add inline comments for each major section and function.

export default function ShipmentsPage() {
  const auth = useAuth();
  if (!auth) throw new Error('AuthProvider is missing');
  const { profile, authLoading, profileLoading } = auth;
  const clinicId = profile?.clinicId;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({ medicineId: '', courier: '', pickupDate: '', coldChain: false, minTemp: '', maxTemp: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- Google Maps Loader ---
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // --- React Query ---
  const { shipments, loading: isLoadingShipments } = useShipmentsRealtime(clinicId ?? undefined);

  const { data: medicineStubs = [], isLoading: isLoadingMedStubs } = useQuery<MedicineStub[], Error>({
    queryKey: ['medicineStubs', clinicId || undefined],
    queryFn: () => fetchMedicineStubs(clinicId || undefined),
    enabled: !!clinicId && !authLoading && isCreateModalOpen,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Shipment, 'id' | 'status' | 'createdAt'>) => createShipmentApi(clinicId || undefined, data),
    onSuccess: (newShipment) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', clinicId] });
      toast({ title: "Shipment Created", description: `Shipment for ${newShipment.medicineName || newShipment.medicineId} initiated.` });
      setIsCreateModalOpen(false);
      setCreateFormData({ medicineId: '', courier: '', pickupDate: '', coldChain: false, minTemp: '', maxTemp: '' });
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
    if (createFormData.coldChain && (!createFormData.minTemp || !createFormData.maxTemp)) {
      toast({ title: "Missing Temperature Thresholds", description: "Please enter min and max temperature for cold-chain.", variant: "destructive" });
      return;
    }
    const selectedMedicineName = medicineStubs.find(m => m.id === createFormData.medicineId)?.name ?? createFormData.medicineId;
    createMutation.mutate({ ...createFormData, medicineName: selectedMedicineName });
  };

  // Bulk selection handlers
  const allSelectableIds = shipments.filter(s => s.status !== 'Delivered').map(s => s.id);
  const isAllSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds.includes(id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(allSelectableIds);
  };
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bulk mark as delivered (mock)
  const handleBulkMarkDelivered = async () => {
    await bulkMarkAsDelivered(clinicId, selectedIds);
    setSelectedIds([]);
    toast({ title: 'Marked as Delivered', description: `${selectedIds.length} shipment(s) updated.` });
    // React Query/Firestore will auto-update the UI
  };

  const openDrawer = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);

  // In the detail drawer, use real-time temperature log if selectedShipment exists
  const tempLogData = useTemperatureLogRealtime(clinicId ?? undefined, selectedShipment?.id ?? undefined);

  // --- UI always renders ---
  if (authLoading || profileLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span>Loading profile...</span>
        </div>
      </PageShell>
    );
  }

  if (!clinicId) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No clinic selected yet. Log in with a clinic profile to view shipments.
        </div>
      </PageShell>
    );
  }

  if (isLoadingShipments) {
    return (
      <PageShell>
        <div className="space-y-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shipments...</p>
        </div>
      </PageShell>
    );
  }

  const activeShipments = shipments.filter((shipment) => shipment.status !== 'Delivered').length;
  const deliveredShipments = shipments.filter((shipment) => shipment.status === 'Delivered').length;
  const delayedShipments = shipments.filter(
    (shipment) => shipment.status === 'Delayed' || shipment.status === 'Exception'
  ).length;

  // --- Main UI ---
  return (
    <PageShell>
      <PageHeader
        eyebrow="Shipments"
        title="Logistics Control"
        description="Track outbound orders, monitor cold-chain status, and resolve delays before they impact care."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Active</p>
            <p className="text-xl font-semibold text-foreground">{activeShipments}</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Delivered</p>
            <p className="text-xl font-semibold text-foreground">{deliveredShipments}</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Alerts</p>
            <p className="text-xl font-semibold text-foreground">{delayedShipments}</p>
          </div>
        </div>
      </PageHeader>

      <div className="space-y-6 animate-fadeIn">
      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="mb-2 flex items-center gap-4 bg-muted/60 p-3 rounded-lg border border-border">
          <span>{selectedIds.length} selected</span>
          <Button size="sm" onClick={handleBulkMarkDelivered} variant="default">Mark as Delivered</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}
      <Card className="panel-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Shipment Tracking</CardTitle>
            <CardDescription>Monitor your active and past shipments. {/* TODO: Integrate with IOT sensor data for live temperature/location */}</CardDescription>
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
              <DialogContent className="panel-primary sm:max-w-[450px]">
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
                        onValueChange={(value) => setCreateFormData(prev => ({ ...prev, medicineId: value }))}
                        required
                      >
                        <SelectTrigger id="medicineId" className="col-span-3" disabled={isLoadingMedStubs}>
                          <SelectValue placeholder={isLoadingMedStubs ? "Loading..." : "Select medicine"} />
                        </SelectTrigger>
                        <SelectContent className="overlay-tertiary">
                          {medicineStubs.map(med => (
                            <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                          ))}
                          {!isLoadingMedStubs && medicineStubs.length === 0 && <p className="p-2 text-sm text-muted-foreground">No medicines found</p>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="courier" className="text-right">Courier*</Label>
                      <Input id="courier" value={createFormData.courier} onChange={(e) => setCreateFormData(prev => ({ ...prev, courier: e.target.value }))} required className="col-span-3" placeholder="e.g., FedEx, UPS" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pickupDate" className="text-right">Pickup Date*</Label>
                      <Input id="pickupDate" type="date" value={createFormData.pickupDate} onChange={(e) => setCreateFormData(prev => ({ ...prev, pickupDate: e.target.value }))} required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="coldChain" className="text-right">Cold-chain required?</Label>
                      <input
                        id="coldChain"
                        type="checkbox"
                        checked={createFormData.coldChain}
                        onChange={e => setCreateFormData(prev => ({ ...prev, coldChain: e.target.checked }))}
                        className="col-span-1"
                      />
                      <span className="col-span-2 text-xs text-muted-foreground">(Enable for temperature-sensitive medicines)</span>
                    </div>
                    {createFormData.coldChain && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minTemp" className="text-right">Min Temp (°C)</Label>
                        <Input id="minTemp" type="number" value={createFormData.minTemp} onChange={e => setCreateFormData(prev => ({ ...prev, minTemp: e.target.value }))} className="col-span-1" placeholder="2" min="-50" max="50" step="0.1" required={createFormData.coldChain} />
                        <Label htmlFor="maxTemp" className="text-right">Max Temp (°C)</Label>
                        <Input id="maxTemp" type="number" value={createFormData.maxTemp} onChange={e => setCreateFormData(prev => ({ ...prev, maxTemp: e.target.value }))} className="col-span-1" placeholder="8" min="-50" max="50" step="0.1" required={createFormData.coldChain} />
                      </div>
                    )}
                    {/* TODO: Add tracking number and IOT sensor ID fields if needed */}
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
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                      onChange={handleSelectAll}
                      aria-label="Select all shipments"
                    />
                  </TableHead>
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
                {shipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No shipments found.</TableCell>
                  </TableRow>
                )}
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDrawer(shipment)}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(shipment.id)}
                        onChange={() => handleSelectOne(shipment.id)}
                        disabled={shipment.status === 'Delivered'}
                        aria-label={`Select shipment ${shipment.trackingNo || shipment.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{shipment.medicineName || shipment.medicineId}</TableCell>
                    <TableCell className="hidden sm:table-cell">{shipment.trackingNo || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">{shipment.courier}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(shipment.status)}>{shipment.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{shipment.lastTemp || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">{shipment.eta || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">Details</Button>
                        </PopoverTrigger>
                        <PopoverContent className="overlay-secondary w-60">
                          <div className="space-y-1 text-sm">
                            <p><strong>Medicine:</strong> {shipment.medicineName || shipment.medicineId}</p>
                            <p><strong>Tracking:</strong> {shipment.trackingNo || 'N/A'}</p>
                            <p><strong>Status:</strong> {shipment.status}</p>
                            <p><strong>Last Temp:</strong> {shipment.lastTemp || 'N/A'}</p>
                            <p><strong>ETA:</strong> {shipment.eta || 'N/A'}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {viewMode === 'map' && (
            <div>
              {mapLoadError && <div className="text-destructive p-4">Error loading map. Please check API key and network.</div>}
              {!isMapLoaded && !mapLoadError && <Skeleton className="h-[60vh] w-full rounded-md bg-muted" />}
              {isMapLoaded && !mapLoadError && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={selectedShipment && typeof selectedShipment.currentLat === 'number' && typeof selectedShipment.currentLng === 'number'
                    ? { lat: selectedShipment.currentLat, lng: selectedShipment.currentLng }
                    : defaultCenter}
                  zoom={selectedShipment && typeof selectedShipment.currentLat === 'number' && typeof selectedShipment.currentLng === 'number' ? 12 : 4}
                >
                  {/* TODO: Attach live GPS data from IOT sensors to shipment markers */}
                  {shipments.filter(s => s.currentLat && s.currentLng).map((shipment) => (
                    <Marker
                      key={shipment.id}
                      position={{ lat: shipment.currentLat!, lng: shipment.currentLng! }}
                      title={`${shipment.medicineName || shipment.medicineId} (${shipment.status})`}
                      onClick={() => openDrawer(shipment)}
                      // TODO: Add custom icons based on status or IOT sensor alerts
                    />
                  ))}
                </GoogleMap>
              )}
              {/* Popover/modal for selected shipment on map */}
              {viewMode === 'map' && selectedShipment && (
                <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
                  <DialogContent className="panel-primary max-w-md">
                    <DialogHeader>
                      <DialogTitle>Shipment Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <p><strong>Medicine:</strong> {selectedShipment?.medicineName || selectedShipment?.medicineId}</p>
                      <p><strong>Status:</strong> {selectedShipment?.status}</p>
                      <p><strong>Last Temp:</strong> {selectedShipment?.lastTemp || 'N/A'}</p>
                      <p><strong>ETA:</strong> {selectedShipment?.eta || 'N/A'}</p>
                      {/* TODO: Add more IOT sensor data fields (humidity, GPS, etc.) */}
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-muted-foreground mb-1">Temperature Trend (Mock)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={mockTempData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[2, 8]} hide />
                          <Tooltip />
                          <Line type="monotone" dataKey="temp" stroke="#008080" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      {/* TODO: Replace with real Firestore temperatureLog data */}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Detail Drawer (Sheet) for selected shipment */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="max-w-lg w-full panel-primary">
          <div>
            <SheetHeader>
              <SheetTitle>Shipment Details</SheetTitle>
              <SheetDescription>Full history and live data for this shipment.</SheetDescription>
            </SheetHeader>
            {selectedShipment && (
              <div className="space-y-4">
                <div>
                  <p><strong>Medicine:</strong> {selectedShipment?.medicineName || selectedShipment?.medicineId}</p>
                  <p><strong>Status:</strong> {selectedShipment?.status}</p>
                  <p><strong>Tracking No.:</strong> {selectedShipment?.trackingNo || 'N/A'}</p>
                  <p><strong>Courier:</strong> {selectedShipment?.courier}</p>
                  <p><strong>Pickup Date:</strong> {selectedShipment?.pickupDate}</p>
                  <p><strong>ETA:</strong> {selectedShipment?.eta || 'N/A'}</p>
                  <p><strong>Last Temp:</strong> {selectedShipment?.lastTemp || 'N/A'}</p>
                </div>
                <div>
                  <div className="font-semibold mb-1">Location Pings (Mock)</div>
                  <ul className="text-xs space-y-1">
                    {mockLocationPings.map((ping, i) => (
                      <li key={i}>[{ping.time}] Lat: {ping.lat}, Lng: {ping.lng}</li>
                    ))}
                  </ul>
                  {/* TODO: Replace with real Firestore location ping data */}
                </div>
                <div>
                  <div className="font-semibold mb-1">Temperature Time Series (Mock)</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={tempLogData.length > 0 ? tempLogData : mockTempData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                      <XAxis dataKey="time" />
                      <YAxis domain={[2, 8]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="temp" stroke="#008080" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* TODO: Replace with real Firestore temperatureLog data */}
                </div>
                {selectedShipment.status !== 'Delivered' && (
                  <SheetFooter>
                    <Button variant="default" onClick={() => {/* TODO: Mark as delivered in Firestore */ closeDrawer(); toast({ title: 'Marked as Delivered', description: 'Shipment status updated.' }); }}>Mark as Delivered</Button>
                  </SheetFooter>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </PageShell>
  );
}
