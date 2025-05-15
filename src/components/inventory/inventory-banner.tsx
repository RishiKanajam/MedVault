'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Medicine } from './columns';

interface InventoryBannerProps {
  inventory: Medicine[];
}

export function InventoryBanner({ inventory }: InventoryBannerProps) {
  const today = new Date();
  const expiringSoon = inventory.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const expired = inventory.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate < today;
  });

  const lowStock = inventory.filter((item) => item.quantity < 10);

  if (expired.length === 0 && expiringSoon.length === 0 && lowStock.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {expired.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Expired Items</AlertTitle>
          <AlertDescription>
            {expired.length} item{expired.length === 1 ? '' : 's'} have expired.
            Please remove them from inventory.
          </AlertDescription>
        </Alert>
      )}

      {expiringSoon.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Expiring Soon</AlertTitle>
          <AlertDescription>
            {expiringSoon.length} item{expiringSoon.length === 1 ? '' : 's'} will
            expire within 30 days.
          </AlertDescription>
        </Alert>
      )}

      {lowStock.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock</AlertTitle>
          <AlertDescription>
            {lowStock.length} item{lowStock.length === 1 ? '' : 's'} have less
            than 10 units in stock.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 