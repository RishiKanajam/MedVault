'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, AlertTriangle, CalendarOff, Truck, ThermometerSnowflake, Activity, BrainCircuit, BarChart3, LineChart } from 'lucide-react'; // Use BarChart3, LineChart
import { Skeleton } from '@/components/ui/skeleton';
// Import chart components
import { Bar, BarChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as RechartsLineChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

// Placeholder hook for user data
const useUser = () => {
    const [user, setUser] = React.useState<{ name: string } | null>(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        const timer = setTimeout(() => { setUser({ name: "Dr. Anya Sharma" }); setLoading(false); }, 500);
        return () => clearTimeout(timer);
    }, []);
    return { user, loading };
};

// Placeholder hook for dashboard metrics
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

// Mock chart data
const expiryChartData = [
  { status: 'Expired', count: 3, fill: 'hsl(var(--danger-hsl))' }, // Red
  { status: 'Expiring', count: 5, fill: 'hsl(var(--warning-hsl))' }, // Warning Orange/Yellow
  { status: 'Safe', count: 130, fill: 'hsl(var(--primary-hsl))' }, // Teal
];
const expiryChartConfig = {
  count: { label: "Count" },
  expired: { label: "Expired", color: "hsl(var(--danger-hsl))" },
  expiring: { label: "Expiring Soon", color: "hsl(var(--warning-hsl))" },
  safe: { label: "Safe", color: "hsl(var(--primary-hsl))" },
} satisfies ChartConfig;

const recordsTrendData = [
  { month: 'Jan', count: 15 }, { month: 'Feb', count: 20 }, { month: 'Mar', count: 18 },
  { month: 'Apr', count: 25 }, { month: 'May', count: 22 }, { month: 'Jun', count: 30 },
];
const recordsChartConfig = {
  count: { label: "Records Added", color: "hsl(var(--primary-hsl))" }, // Teal
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { metrics, loading: metricsLoading } = useDashboardMetrics();
  const isLoading = userLoading || metricsLoading;

  const metricCards = [
    { title: "Total Medicines", value: metrics.totalMeds, icon: Boxes, href: "/inventory", color: "text-primary", iconColor: "text-primary" }, // Teal
    { title: "Expiring Soon", value: metrics.expiringSoon, icon: AlertTriangle, href: "/inventory?filter=expiring", color: "text-warning", iconColor: "text-warning" }, // Warning Orange/Yellow
    { title: "Expired Medicines", value: metrics.expired, icon: CalendarOff, href: "/inventory?filter=expired", color: "text-danger", iconColor: "text-danger" }, // Danger Red
    { title: "Cold-Chain Breaches", value: metrics.coldChainBreaches, icon: ThermometerSnowflake, href: "/inventory?filter=coldchain", color: "text-danger", iconColor: "text-danger" }, // Danger Red
    { title: "Active Shipments", value: metrics.activeShipments, icon: Truck, href: "/shipments", color: "text-info", iconColor: "text-info" }, // Info Purple
    // Optional Patient Records Card
    { title: "Patient Records Added (6 mo)", value: recordsTrendData.reduce((sum, d) => sum + d.count, 0), icon: ClipboardList, href: "/history", color: "text-info", iconColor: "text-info" }, // Info Purple
 ];

   const quickActions = [
     { title: "Manage Inventory", icon: Boxes, href: "/inventory", label: "Inventory" },
     { title: "Track Shipments", icon: Truck, href: "/shipments", label: "Shipments" },
     { title: "RxAI Support", icon: BrainCircuit, href: "/rxai", label: "RxAI" },
     // Add more actions if needed
   ];

  return (
    // Increased spacing between sections (space-y-12 = 48px)
    <div className="space-y-12 animate-fadeIn">
       {/* Welcome Banner - Use primary color */}
       <Card className="bg-primary text-primary-foreground shadow-card">
         <CardHeader className="border-none pt-6"> {/* Removed accent bar style from Card component */}
           <CardTitle className="text-2xl">
             {isLoading ? <Skeleton className="h-8 w-48 bg-white/30" /> : `Welcome back, ${user?.name || 'User'}!`}
           </CardTitle>
           <CardDescription className="text-primary-foreground/80">
             Here's a quick overview of your MediSync Pro workspace.
           </CardDescription>
         </CardHeader>
       </Card>

       {/* Metric Cards - Responsive grid (3 cols on desktop, 1 on mobile) */}
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {metricCards.map((metric, index) => (
           <Card key={index} className="shadow-card bg-surface border-border rounded-lg"> {/* White bg, custom shadow, rounded */}
             <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
               <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
               <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
             </CardHeader>
             <CardContent className="pb-4 px-4">
               {isLoading ? (
                  <Skeleton className="h-10 w-20 mt-1 mb-1 bg-gray-200" />
               ) : (
                 // Larger font size for value
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
                {/* Link uses primary color */}
               <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" asChild>
                 <Link href={metric.href}>View Details</Link>
               </Button>
             </CardFooter>
           </Card>
         ))}
       </div>

       {/* Charts Section - Use ChartContainer */}
       <div className="grid gap-6 lg:grid-cols-2">
         {/* Expiry Status Bar Chart */}
         <Card className="shadow-card bg-surface border-border rounded-lg col-span-1">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="text-primary" /> Medicine Expiry Status</CardTitle>
             <CardDescription>Overview of stock status based on expiry.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px] p-4">
             {isLoading ? (
                <div className="flex items-center justify-center h-full"><Skeleton className="w-full h-full bg-gray-200" /></div>
             ) : (
               <ChartContainer config={expiryChartConfig} className="h-full w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={expiryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} />
                     <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                     <Bar dataKey="count" radius={5}>
                        {expiryChartData.map((entry) => (
                            <div key={entry.status} style={{backgroundColor: entry.fill}} /> // Use Cell for individual bar colors
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
                 <div className="flex items-center justify-center h-full"><Skeleton className="w-full h-full bg-gray-200" /></div>
              ) : (
                <ChartContainer config={recordsChartConfig} className="h-full w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <RechartsLineChart data={recordsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }}/>
                       <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground-hsl))' }} />
                       <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                       <Line type="monotone" dataKey="count" stroke="hsl(var(--primary-hsl))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary-hsl))', r: 4 }} activeDot={{ r: 6 }}/>
                        <ChartLegend content={<ChartLegendContent />} />
                     </RechartsLineChart>
                   </ResponsiveContainer>
                 </ChartContainer>
              )}
           </CardContent>
         </Card>
       </div>


       {/* Quick Actions - 3 columns */}
       <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
           {/* flex-wrap container for responsiveness */}
          <div className="grid gap-6 md:grid-cols-3">
             {quickActions.map((action, index) => (
                <Card key={index} className="shadow-card bg-surface border border-border rounded-lg hover:border-primary hover:scale-[1.02] transition-all duration-200">
                 <Link href={action.href} className="block h-full">
                    <CardContent className="pt-8 pb-6 flex flex-col items-center justify-center text-center h-full">
                       {/* Icon uses primary color */}
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
         <CardHeader>
           <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" /> Recent Activity</CardTitle>
           <CardDescription>Overview of recent inventory changes and alerts.</CardDescription>
         </CardHeader>
         <CardContent>
           {isLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-4 w-3/4 bg-gray-200" />
                 <Skeleton className="h-4 w-1/2 bg-gray-200" />
               </div>
           ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
           )}
         </CardContent>
       </Card>

    </div>
  );
}

// Helper component for BarChart Cell - Recharts v2 requires this approach for individual bar colors if not using 'fill' directly in data
// Or you can directly add 'fill' property to expiryChartData items as done above. If that works, this helper is not needed.
// const CustomizedBar = (props: any) => {
//   const { fill, x, y, width, height } = props;
//   return <rect x={x} y={y} width={width} height={height} fill={fill} />;
// };
