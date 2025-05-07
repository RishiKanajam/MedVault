// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, AlertTriangle, CalendarOff, Truck, ThermometerSnowflake, Activity, BrainCircuit, BarChart3, LineChart, FileText as ClipboardList } from 'lucide-react'; // Renamed FileText to ClipboardList
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart as RechartsBarChart, Line as RechartsLineElement, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as RechartsLineChartComponent, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useAuth } from '@/providers/AuthProvider';

// Mock data hook (with comments for future API integration)
const useDashboardMetrics = () => {
     const [metrics, setMetrics] = React.useState({
        totalMeds: 0, expiringSoon: 0, expired: 0, coldChainBreaches: 0, activeShipments: 0,
     });
     const [loading, setLoading] = React.useState(true);

     React.useEffect(() => {
         // Simulate API call
         const timer = setTimeout(() => {
             // TODO: Replace with actual API call to fetch dashboard metrics based on clinicId
             // Example: fetch(`/api/dashboard/metrics?clinicId=${profile.clinicId}`).then(res => res.json()).then(data => setMetrics(data));
             setMetrics({ totalMeds: 138, expiringSoon: 5, expired: 3, coldChainBreaches: 1, activeShipments: 4 });
             setLoading(false);
         }, 700);
         return () => clearTimeout(timer);
     }, []);
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


export default function DashboardPage() {
  const { user, profile, authLoading } = useAuth();
  const { metrics, loading: metricsLoading } = useDashboardMetrics();

  // Combined loading state for page content (auth already handled by AuthProvider)
  const isLoadingContent = metricsLoading;

  const getWelcomeMessage = () => {
    if (user?.isAnonymous) return "Welcome, Guest!";
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

   const quickActionsData = [
     { title: "Manage Inventory", icon: Boxes, href: "/inventory", label: "Inventory" },
     { title: "Track Shipments", icon: Truck, href: "/shipments", label: "Shipments" },
     { title: "RxAI Support", icon: BrainCircuit, href: "/rxai", label: "RxAI" },
   ];

  return (
    <div className="space-y-12 animate-fadeIn p-6">
       <Card className="panel-primary relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
         <CardHeader className="pl-8 pt-6 pb-6">
           <CardTitle className="text-2xl text-primary">
            {getWelcomeMessage()}
           </CardTitle>
           <CardDescription className="text-muted-foreground">
             Here's a quick overview of your MediSync Pro workspace.
           </CardDescription>
         </CardHeader>
       </Card>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {metricCardsData.map((metric, index) => (
           <Card key={index} className="panel-secondary">
             <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
               <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
               <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
             </CardHeader>
             <CardContent className="pb-4 px-4">
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

       <div className="grid gap-6 lg:grid-cols-2">
         <Card className="panel-primary col-span-1">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="text-primary" /> Medicine Expiry Status</CardTitle>
             <CardDescription>Overview of stock status based on expiry. {/* TODO: Fetch this data based on clinicId */}</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px] p-4">
               <ChartContainer config={expiryChartConfig} className="h-full w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <RechartsBarChart data={expiryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} width={80} />
                     <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                     <Bar dataKey="count" radius={5}>
                        {expiryChartData.map((entry) => (
                             <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                        ))}
                     </Bar>
                   </RechartsBarChart>
                 </ResponsiveContainer>
               </ChartContainer>
           </CardContent>
         </Card>

         <Card className="panel-primary col-span-1">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2"><LineChart className="text-info" /> Patient Records Trend (6 Mo)</CardTitle>
              <CardDescription>Number of patient records added monthly. {/* TODO: Fetch this data based on clinicId */}</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px] p-4">
                <ChartContainer config={recordsChartConfig} className="h-full w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <RechartsLineChartComponent data={recordsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }}/>
                       <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} />
                       <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                       <RechartsLineElement type="monotone" dataKey="count" stroke="hsl(var(--primary-hsl))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary-hsl))', r: 4 }} activeDot={{ r: 6 }}/>
                       <ChartLegend content={<ChartLegendContent />} />
                     </RechartsLineChartComponent>
                   </ResponsiveContainer>
                 </ChartContainer>
           </CardContent>
         </Card>
       </div>

       <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-3">
             {quickActionsData.map((action, index) => (
                <Card key={index} className="panel-primary hover:border-primary hover:scale-[1.02] transition-all duration-200">
                 <Link href={action.href} className="block h-full">
                    <CardContent className="pt-8 pb-6 flex flex-col items-center justify-center text-center h-full">
                        <action.icon className="h-10 w-10 text-primary mb-4" />
                        <p className="font-medium text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Access the {action.label} section.</p>
                    </CardContent>
                 </Link>
                </Card>
             ))}
          </div>
       </div>

       <Card className="panel-primary relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
         <CardHeader className="pl-8">
           <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" /> Recent Activity</CardTitle>
           <CardDescription>Overview of recent inventory changes and alerts. {/* TODO: Fetch this data based on clinicId */}</CardDescription>
         </CardHeader>
         <CardContent className="pl-8">
              <p className="text-sm text-muted-foreground">No recent activity to display. {/* TODO: Implement recent activity feed */}</p>
         </CardContent>
       </Card>
    </div>
  );
}
