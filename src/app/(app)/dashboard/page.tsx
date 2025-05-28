// src/app/dashboard/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, AlertTriangle, CalendarOff, Truck, ThermometerSnowflake, Activity, BrainCircuit, BarChart3, LineChart, FileText as ClipboardList } from 'lucide-react'; // Renamed FileText to ClipboardList
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart as RechartsBarChart, Line as RechartsLineElement, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as RechartsLineChartComponent, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { AuthProvider } from '@/providers/AuthProvider';

// Dashboard Page for MediSync Pro
// Purpose: Shows workspace overview, metrics, charts, and quick actions for all modules.
// Data Flow: Uses mock data; replace with real API calls for metrics, charts, and activity feed.
// TODO: Replace all mock data with real API calls (see inline TODOs).
// TODO: Add guest mode toggle for dummy data if user is anonymous.
// TODO: Ensure all cards and charts are accessible and responsive.

// Clean up guest mode references and TODOs
const useDashboardMetrics = (clinicId?: string) => {
     const [metrics, setMetrics] = React.useState({
        totalMeds: 0, expiringSoon: 0, expired: 0, coldChainBreaches: 0, activeShipments: 0,
     });
     const [loading, setLoading] = React.useState(true);

     React.useEffect(() => {
         // Simulate API call
         const timer = setTimeout(() => {
             // TODO: Replace with actual API call to fetch dashboard metrics based on clinicId
             setMetrics({ totalMeds: 138, expiringSoon: 5, expired: 3, coldChainBreaches: 1, activeShipments: 4 });
             setLoading(false);
         }, 700);
         return () => clearTimeout(timer);
     }, [clinicId]);
     return { metrics, loading };
};

// Mock chart data (with comments for future API integration)
const expiryChartData = [
  // TODO: Replace with data fetched from API for expiry chart (scoped by clinicId)
  { status: 'Expired', count: 3, fill: 'hsl(var(--danger-hsl))' },
  { status: 'Expiring', count: 5, fill: 'hsl(var(--warning-hsl))' },
  { status: 'Safe', count: 130, fill: 'hsl(var(--primary-hsl))' },
];
const expiryChartConfig = {
  count: { label: "Count" },
  Expired: { label: "Expired", color: "hsl(var(--danger-hsl))" },
  Expiring: { label: "Expiring Soon", color: "hsl(var(--warning-hsl))" },
  Safe: { label: "Safe", color: "hsl(var(--primary-hsl))" },
} satisfies ChartConfig;

const recordsTrendData = [
  // TODO: Replace with data fetched from API for records trend (scoped by clinicId)
  { month: 'Jan', count: 15 }, { month: 'Feb', count: 20 }, { month: 'Mar', count: 18 },
  { month: 'Apr', count: 25 }, { month: 'May', count: 22 }, { month: 'Jun', count: 30 },
];
const recordsChartConfig = {
  count: { label: "Records Added", color: "hsl(var(--primary-hsl))" },
} satisfies ChartConfig;

function DashboardPageInner() {
  const { user, profile, loading } = useAuth();
  const { metrics, loading: metricsLoading } = useDashboardMetrics(profile?.clinicId ?? undefined);
  const { toast } = useToast();

  // Show welcome back toast on mount
  React.useEffect(() => {
    if (!loading) {
      toast({ title: 'Welcome back', description: 'Glad to see you again!' });
    }
  }, [loading, toast]);

  // Combined loading state for page content (auth already handled by AuthProvider)
  const isLoadingContent = metricsLoading;

  const getWelcomeMessage = () => {
    if (profile?.name) return `Welcome back, ${profile.name}!`;
    return "Welcome back!";
  };


  if (isLoadingContent) { // Show skeleton if metrics are loading (auth is handled by AuthProvider)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="space-y-12 w-full">
           {/* Welcome Banner Skeleton */}
           <Card className="panel-primary relative overflow-hidden">
             <CardHeader className="pl-8 pt-6 pb-6"><Skeleton className="h-8 w-1/2 bg-muted" /></CardHeader>
           </Card>
           {/* Metric Cards Skeleton */}
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {Array.from({ length: 6 }).map((_, index) => (
               <Card key={index} className="panel-secondary">
                 <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                   <Skeleton className="h-5 w-1/3 bg-muted" />
                   <Skeleton className="h-5 w-5 rounded-full bg-muted" />
                 </CardHeader>
                 <CardContent className="pb-4 px-4">
                    <Skeleton className="h-10 w-1/4 mt-1 mb-1 bg-muted" />
                    <Skeleton className="h-3 w-1/2 bg-muted" />
                 </CardContent>
                  <CardFooter className="pt-0 pb-4 px-4"><Skeleton className="h-4 w-1/3 bg-muted" /></CardFooter>
               </Card>
             ))}
           </div>
           {/* Charts Skeleton */}
           <div className="grid gap-6 lg:grid-cols-2">
             <Card className="panel-primary col-span-1">
               <CardHeader><Skeleton className="h-6 w-3/4 bg-muted" /></CardHeader>
               <CardContent className="h-[300px] p-4"><Skeleton className="w-full h-full bg-muted" /></CardContent>
             </Card>
             <Card className="panel-primary col-span-1">
               <CardHeader><Skeleton className="h-6 w-3/4 bg-muted" /></CardHeader>
               <CardContent className="h-[300px] p-4"><Skeleton className="w-full h-full bg-muted" /></CardContent>
             </Card>
           </div>
        </div>
      </div>
    );
  }

  // Actual data for cards, derived after loading is complete
  const metricCardsData = [
    { title: "Total Medicines", value: metrics.totalMeds, icon: Boxes, href: "/inventory", color: "text-primary", iconColor: "text-primary" },
    { title: "Expiring Soon", value: metrics.expiringSoon, icon: AlertTriangle, href: "/inventory?filter=expiring", color: "text-warning", iconColor: "text-warning" },
    { title: "Expired Medicines", value: metrics.expired, icon: CalendarOff, href: "/inventory?filter=expired", color: "text-danger", iconColor: "text-danger" },
    { title: "Cold-Chain Breaches", value: metrics.coldChainBreaches, icon: ThermometerSnowflake, href: "/inventory?filter=coldchain", color: "text-danger", iconColor: "text-danger" },
    { title: "Active Shipments", value: metrics.activeShipments, icon: Truck, href: "/shipments", color: "text-info", iconColor: "text-info" },
    { title: "Patient Records Added (6 mo)", value: recordsTrendData.reduce((sum, d) => sum + d.count, 0), icon: ClipboardList, href: "/history", color: "text-info", iconColor: "text-info" },
  ];

  return (
    <div className="space-y-12 animate-fadeIn p-6">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 auto-rows-fr" style={{ gridAutoRows: '1fr' }}>
        {metricCardsData.map((metric, index) => (
          <Card key={index} className="panel-secondary flex flex-col h-full min-h-[140px]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
            </CardHeader>
            <CardContent className="pb-4 px-4 flex-1 flex flex-col justify-center">
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.title === 'Expiring Soon' ? 'Within 7 days' :
                  metric.title === 'Cold-Chain Breaches' ? 'Incidents recorded' :
                  metric.title === 'Total Medicines' ? 'Items in stock' :
                  metric.title === 'Expired Medicines' ? 'Items past date' :
                  metric.title === 'Active Shipments' ? 'Currently tracked' :
                  metric.title.includes('Patient Records') ? 'Past 6 months' : 'Details'}
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-4 px-4">
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" asChild>
                <Link href={metric.href}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="panel-primary col-span-1 flex flex-col h-full min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><LineChart className="text-info" /> Patient Records Trend (6 Mo)</CardTitle>
            <CardDescription>Number of patient records added monthly. {/* TODO: Fetch this data based on clinicId */}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-4 flex-1">
            <ChartContainer config={recordsChartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChartComponent data={recordsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <RechartsLineElement type="monotone" dataKey="count" stroke="hsl(var(--primary-hsl))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary-hsl))', r: 4 }} activeDot={{ r: 6 }} />
                  <ChartLegend content={<ChartLegendContent />} />
                </RechartsLineChartComponent>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="panel-primary col-span-1 flex flex-col h-full min-h-[340px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" /> Recent Activity</CardTitle>
            <CardDescription>Overview of recent inventory changes and alerts. {/* TODO: Fetch this data based on clinicId */}</CardDescription>
          </CardHeader>
          <CardContent className="pl-4 pr-4 flex-1 overflow-y-auto">
            {/* TODO: Replace with real recent activity data from API */}
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">No recent activity to display. {/* TODO: Implement recent activity feed */}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPageWrapper() {
  return (
    <AuthProvider>
      <DashboardPageInner />
    </AuthProvider>
  );
}
