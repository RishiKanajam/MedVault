import React from 'react';
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
import { PlusCircle, Truck } from 'lucide-react';
import Image from 'next/image'; // For placeholder map


// TODO: Fetch actual data from Firestore and integrate with EasyPost/Map library
const mockShipments = [
  { id: 'shp1', medicineName: 'Insulin Glargine', trackingNo: 'EZ1000000001', courier: 'FedEx', status: 'In Transit', lastLocation: 'Chicago, IL', eta: '2024-08-15', lastTemp: '4°C' },
  { id: 'shp2', medicineName: 'Aspirin 81mg', trackingNo: 'EZ2000000002', courier: 'UPS', status: 'Delivered', lastLocation: 'New York, NY', eta: '2024-08-10', lastTemp: 'N/A' },
  { id: 'shp3', medicineName: 'Vaccine Batch X', trackingNo: 'EZ3000000003', courier: 'DHL', status: 'Out for Delivery', lastLocation: 'Local Hub', eta: '2024-08-12', lastTemp: '3°C' },
  { id: 'shp4', medicineName: 'Metformin 500mg', trackingNo: 'EZ4000000004', courier: 'USPS', status: 'Pre-Transit', lastLocation: 'Warehouse', eta: '2024-08-18', lastTemp: 'N/A' },
];


function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Delivered':
      return 'default'; // Use Accent (Green)
    case 'Out for Delivery':
      return 'outline'; // Use Primary (Blue) outline
    case 'In Transit':
       return 'secondary'; // Use Secondary (light gray)
    case 'Pre-Transit':
       return 'destructive' // Or another distinct color like muted outline
     case 'Delayed': // Add more statuses as needed
       return 'destructive';
    default:
      return 'secondary';
  }
}


export default function ShipmentsPage() {
  // TODO: Add state for selected shipment and map display logic
  // TODO: Implement Create Shipment modal/dialog
  // TODO: Integrate with a mapping library (e.g., react-map-gl, leaflet) and EasyPost API

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="lg:col-span-2 xl:col-span-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shipment Tracking</CardTitle>
              <CardDescription>Monitor your active and past shipments.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Shipment
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="hidden sm:table-cell">Tracking No.</TableHead>
                   <TableHead className="hidden md:table-cell">Courier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Location</TableHead>
                   <TableHead className="hidden md:table-cell">ETA</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Temp</TableHead>
                   <TableHead><span className="sr-only">Details</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockShipments.map((shipment) => (
                  <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{shipment.medicineName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{shipment.trackingNo}</TableCell>
                     <TableCell className="hidden md:table-cell">{shipment.courier}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(shipment.status)}>{shipment.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{shipment.lastLocation}</TableCell>
                     <TableCell className="hidden md:table-cell">{shipment.eta}</TableCell>
                    <TableCell className="hidden lg:table-cell">{shipment.lastTemp}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {mockShipments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                        No shipments found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {/* Optional: Add Pagination */}
        </Card>
      </div>

      <div className="lg:col-span-1 xl:col-span-1">
        <Card className="sticky top-[60px] "> {/* Adjust top offset based on header height */}
          <CardHeader>
            <CardTitle>Shipment Location</CardTitle>
            <CardDescription>Live map view of the selected shipment.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for Map */}
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Select a shipment to view map</p>
              {/* Replace with actual map component */}
              {/* Example using picsum as placeholder */}
               {/* <Image
                  src="https://picsum.photos/600/400"
                  alt="Placeholder Map"
                  width={600}
                  height={400}
                  className="rounded-md object-cover"
                  data-ai-hint="world map tracking route"
               /> */}
            </div>
             <div className="mt-4 space-y-2 text-sm">
                <h4 className="font-medium">Shipment Details</h4>
                {/* TODO: Populate with selected shipment details */}
                 <p className="text-muted-foreground">No shipment selected.</p>
                 {/* <p><strong>Tracking:</strong> EZ1000000001</p>
                 <p><strong>Status:</strong> In Transit</p>
                 <p><strong>Location:</strong> Chicago, IL</p>
                 <p><strong>ETA:</strong> 2024-08-15</p>
                 <p><strong>Temp:</strong> 4°C</p> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
