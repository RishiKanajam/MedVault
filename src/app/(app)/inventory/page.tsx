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
import { PlusCircle, QrCode, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// TODO: Fetch actual data from Firestore and implement real-time listener
const mockInventory = [
  { id: 'med1', name: 'Aspirin 81mg', manufacturer: 'Bayer', batch: 'B12345', qty: 150, expiry: '2025-12-31', status: 'ok' },
  { id: 'med2', name: 'Metformin 500mg', manufacturer: 'Genericorp', batch: 'M67890', qty: 45, expiry: '2024-08-15', status: 'low-stock' },
  { id: 'med3', name: 'Atorvastatin 20mg', manufacturer: 'Pfizer', batch: 'A11223', qty: 200, expiry: '2024-06-30', status: 'expiring-soon' },
  { id: 'med4', name: 'Amoxicillin 250mg', manufacturer: 'Sandoz', batch: 'X44556', qty: 0, expiry: '2023-11-01', status: 'expired' },
  { id: 'med5', name: 'Insulin Glargine', manufacturer: 'Sanofi', batch: 'I99887', qty: 25, expiry: '2025-02-28', status: 'cold-chain' }, // Example cold-chain item
];

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'low-stock':
      return 'secondary'; // Yellowish/Orange in some themes
    case 'expiring-soon':
      return 'outline'; // Often yellow/orange outline
    case 'expired':
      return 'destructive'; // Red
    case 'cold-chain':
      return 'default'; // Blue (Primary)
    default:
      return 'default'; // Green (Accent in this theme) or Primary
  }
}

function getStatusBadgeLabel(status: string): string {
   switch (status) {
    case 'low-stock': return 'Low Stock';
    case 'expiring-soon': return 'Expiring Soon';
    case 'expired': return 'Expired';
    case 'cold-chain': return 'Cold Chain';
    default: return 'OK';
  }
}

export default function InventoryPage() {
  // TODO: Add state for search term and filtering logic
  // TODO: Implement Add/Edit modal/dialog
  // TODO: Implement QR code scanning functionality

  return (
    <Card>
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
              placeholder="Search inventory..."
              className="pl-8 w-full"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <QrCode className="h-4 w-4" />
             <span className="sr-only">Scan QR Code</span>
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Medicine
          </Button>
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
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInventory.map((med) => (
              <TableRow key={med.id}>
                <TableCell className="font-medium">{med.name}</TableCell>
                <TableCell className="hidden md:table-cell">{med.manufacturer}</TableCell>
                <TableCell className="hidden lg:table-cell">{med.batch}</TableCell>
                <TableCell>{med.qty}</TableCell>
                <TableCell>{med.expiry}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(med.status)}>
                     {getStatusBadgeLabel(med.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {/* Add Edit/Details buttons here */}
                   <Button variant="ghost" size="icon">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                       <span className="sr-only">Actions</span>
                   </Button>
                </TableCell>
              </TableRow>
            ))}
             {mockInventory.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                    No inventory items found.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
      {/* Optional: Add Pagination */}
    </Card>
  );
}
