import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Boxes, AlertTriangle, CalendarOff, Truck, ThermometerSnowflake } from 'lucide-react';

export default function DashboardPage() {
  // TODO: Fetch actual data from Firestore
  const metrics = {
    totalMeds: 125,
    expiringSoon: 8,
    expired: 2,
    coldChainOk: true,
    shipmentsInTransit: 3,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
          <Boxes className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalMeds}</div>
          <p className="text-xs text-muted-foreground">Items in inventory</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">Items expiring within 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired Medicines</CardTitle>
          <CalendarOff className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.expired}</div>
          <p className="text-xs text-muted-foreground">Items past expiry date</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cold Chain Status</CardTitle>
          <ThermometerSnowflake className={`h-4 w-4 ${metrics.coldChainOk ? 'text-blue-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.coldChainOk ? 'text-blue-500' : 'text-red-500'}`}>
            {metrics.coldChainOk ? 'Stable' : 'Alert'}
          </div>
           <p className="text-xs text-muted-foreground">
            {metrics.coldChainOk ? 'Temperatures within range' : 'Check monitored items'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shipments In Transit</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.shipmentsInTransit}</div>
           <p className="text-xs text-muted-foreground">Active deliveries being tracked</p>
        </CardContent>
      </Card>

       {/* Add more cards/widgets as needed */}
        <Card className="md:col-span-2 lg:col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
           <CardDescription>Overview of recent inventory changes and alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for activity feed */}
          <p className="text-sm text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>

    </div>
  );
}
