
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, AlertTriangle, CalendarOff, Truck, ThermometerSnowflake, Activity, BrainCircuit, BarChart3, LineChart, ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as RechartsLineChart, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth to get user info

// Placeholder hook for dashboard metrics (keep as is or replace with actual data fetching)
const useDashboardMetrics = () => {
     const [metrics, setMetrics] = React.useState({
        totalMeds: 0, expiringSoon: 0, expired: 0, coldChainBreaches: 0, activeShipments: 0,
     });
     const [loading, setLoading] = React.useState(true);
     React.useEffect(() => {
         const timer = setTimeout(() => {
             setMetrics({ totalMeds: 138, expiringSoon: 5, expired: 3, coldChainBreaches: 1, activeShipments: 4 });
             setLoading(false);
         }, 700);
         return () => clearTimeout(timer);
     }, []);
     return { metrics, loading };
};

// Mock chart data (keep as is or replace)
const expiryChartData = [
  { status: 'Expired', count: 3, fill: 'hsl(var(--danger-hsl))' }, // Red
  { status: 'Expiring', count: 5, fill: 'hsl(var(--warning-hsl))' }, // Warning Orange/Yellow
  { status: 'Safe', count: 130, fill: 'hsl(var(--primary-hsl))' }, // Teal
];
const expiryChartConfig = {
  count: { label: "Count" },
  Expired: { label: "Expired", color: "hsl(var(--danger-hsl))" },
  Expiring: { label: "Expiring Soon", color: "hsl(var(--warning-hsl))" },
  Safe: { label: "Safe", color: "hsl(var(--primary-hsl))" },
} satisfies ChartConfig;

const recordsTrendData = [
  { month: 'Jan', count: 15 }, { month: 'Feb', count: 20 }, { month: 'Mar', count: 18 },
  { month: 'Apr', count: 25 }, { month: 'May', count: 22 }, { month: 'Jun', count: 30 },
];
const recordsChartConfig = {
  count: { label: "Records Added", color: "hsl(var(--primary-hsl))" },
} satisfies ChartConfig;

export default function DashboardPage() {
  // Use profile from AuthContext
  const { profile, authLoading } = useAuth(); // Use profile from context
  const { metrics, loading: metricsLoading } = useDashboardMetrics();
  const isLoading = authLoading || metricsLoading; // Loading depends on auth and metrics

  const metricCards = [
    { title: "Total Medicines", value: metrics.totalMeds, icon: Boxes, href: "/inventory", color: "text-primary", iconColor: "text-primary" },
    { title: "Expiring Soon", value: metrics.expiringSoon, icon: AlertTriangle, href: "/inventory?filter=expiring", color: "text-warning", iconColor: "text-warning" },
    { title: "Expired Medicines", value: metrics.expired, icon: CalendarOff, href: "/inventory?filter=expired", color: "text-danger", iconColor: "text-danger" },
    { title: "Cold-Chain Breaches", value: metrics.coldChainBreaches, icon: ThermometerSnowflake, href: "/inventory?filter=coldchain", color: "text-danger", iconColor: "text-danger" },
    { title: "Active Shipments", value: metrics.activeShipments, icon: Truck, href: "/shipments", color: "text-info", iconColor: "text-info" },
    { title: "Patient Records Added (6 mo)", value: recordsTrendData.reduce((sum, d) => sum + d.count, 0), icon: ClipboardList, href: "/history", color: "text-info", iconColor: "text-info" },
 ];

   const quickActions = [
     { title: "Manage Inventory", icon: Boxes, href: "/inventory", label: "Inventory" },
     { title: "Track Shipments", icon: Truck, href: "/shipments", label: "Shipments" },
     { title: "RxAI Support", icon: BrainCircuit, href: "/rxai", label: "RxAI" },
     // Add more actions if needed based on enabled modules (though module logic is removed for now)
   ];

  return (
    <div className="space-y-12 animate-fadeIn">
       {/* Welcome Banner */}
       <Card className="bg-surface text-foreground shadow-card relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
         <CardHeader className="pl-8 pt-6 pb-6">
           <CardTitle className="text-2xl text-primary">
              {/* Use profile name */}
             {isLoading ? <Skeleton className="h-8 w-48 bg-muted" /> : `Welcome back, ${profile?.name || 'User'}!`}
           </CardTitle>
           <CardDescription className="text-muted-foreground">
             Here's a quick overview of your MediSync Pro workspace.
           </CardDescription>
         </CardHeader>
       </Card>

       {/* Metric Cards */}
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {metricCards.map((metric, index) => (
           <Card key={index} className="shadow-card bg-surface border-border rounded-lg">
             <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
               <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
               <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
             </CardHeader>
             <CardContent className="pb-4 px-4">
               {isLoading ? (
                  <Skeleton className="h-10 w-20 mt-1 mb-1 bg-muted" />
               ) : (
                 <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
               )}
               <p className="text-xs text-muted-foreground">
                 {metric.title === 'Expiring Soon' ? 'Within 7 days' :
                  metric.title === 'Cold-Chain Breaches' ? 'Incidents recorded' :
                  metric.title === 'Total Medicines' ? 'Items in stock' :
                  metric.title === 'Expired Medicines' ? 'Items past date' :
                  metric.title === 'Active Shipments' ? 'Currently tracked' :
                  metric.title.includes('Patient Records') ? 'Past 6 months' : ''}
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

       {/* Charts Section */}
       <div className="grid gap-6 lg:grid-cols-2">
         {/* Expiry Status Bar Chart */}
         <Card className="shadow-card bg-surface border-border rounded-lg col-span-1">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="text-primary" /> Medicine Expiry Status</CardTitle>
             <CardDescription>Overview of stock status based on expiry.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px] p-4">
             {isLoading ? (
                <div className="flex items-center justify-center h-full"><Skeleton className="w-full h-full bg-muted" /></div>
             ) : (
               <ChartContainer config={expiryChartConfig} className="h-full w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={expiryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} width={80} />
                     <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                     <Bar dataKey="count" radius={5}>
                        {expiryChartData.map((entry) => (
                             <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </ChartContainer>
             )}
           </CardContent>
         </Card>

         {/* Patient Records Line Chart */}
         <Card className="shadow-card bg-surface border-border rounded-lg col-span-1">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2"><LineChart className="text-info" /> Patient Records Trend (6 Mo)</CardTitle>
              <CardDescription>Number of patient records added monthly.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px] p-4">
              {isLoading ? (
                 <div className="flex items-center justify-center h-full"><Skeleton className="w-full h-full bg-muted" /></div>
              ) : (
                <ChartContainer config={recordsChartConfig} className="h-full w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <RechartsLineChart data={recordsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }}/>
                       <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} />
                       <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                       <Line type="monotone" dataKey="count" stroke="hsl(var(--primary-hsl))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary-hsl))', r: 4 }} activeDot={{ r: 6 }}/>
                       <ChartLegend content={<ChartLegendContent />} />
                     </RechartsLineChart>
                   </ResponsiveContainer>
                 </ChartContainer>
              )}
           </CardContent>
         </Card>
       </div>

       {/* Quick Actions */}
       <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-3">
             {quickActions.map((action, index) => (
                <Card key={index} className="shadow-card bg-surface border border-border rounded-lg hover:border-primary hover:scale-[1.02] transition-all duration-200">
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

       {/* Optional: Recent Activity Feed */}
       <Card className="shadow-card bg-surface border-border rounded-lg">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
         <CardHeader className="pl-8">
           <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" /> Recent Activity</CardTitle>
           <CardDescription>Overview of recent inventory changes and alerts.</CardDescription>
         </CardHeader>
         <CardContent className="pl-8">
           {isLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-4 w-3/4 bg-muted" />
                 <Skeleton className="h-4 w-1/2 bg-muted" />
               </div>
           ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
           )}
         </CardContent>
       </Card>

    </div>
  );
}
