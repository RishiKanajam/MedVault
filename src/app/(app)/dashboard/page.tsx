'use client'; // Needed for hooks and client-side interactions

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, AlertTriangle, CalendarOff, Truck, ThermometerSnowflake, Activity, FlaskConical, BrainCircuit, BarChart } from 'lucide-react'; // Added BarChart
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Placeholder hook for user data - Replace with actual auth context/hook
const useUser = () => {
    // Simulate loading user data
    const [user, setUser] = React.useState<{ name: string } | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setUser({ name: "Dr. Anya Sharma" }); // Example user
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return { user, loading };
};

// Placeholder hook for dashboard metrics - Replace with React Query fetch
const useDashboardMetrics = () => {
     // Simulate loading metrics data
     const [metrics, setMetrics] = React.useState({
        totalMeds: 0,
        expiringSoon: 0,
        expired: 0,
        coldChainBreaches: 0,
        activeShipments: 0,
     });
     const [loading, setLoading] = React.useState(true);

     React.useEffect(() => {
         const timer = setTimeout(() => {
             // TODO: Fetch actual data from Firestore using React Query
             setMetrics({
                 totalMeds: 138,
                 expiringSoon: 5, // Within 7 days
                 expired: 3,
                 coldChainBreaches: 1,
                 activeShipments: 4,
             });
             setLoading(false);
         }, 700); // Simulate fetch delay
         return () => clearTimeout(timer);
     }, []);

     return { metrics, loading };
};


export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { metrics, loading: metricsLoading } = useDashboardMetrics();

  const isLoading = userLoading || metricsLoading;

  const metricCards = [
    { title: "Total Medicines", value: metrics.totalMeds, icon: Boxes, href: "/inventory", color: "text-primary", valueColor: "text-primary" },
    { title: "Expiring Soon", value: metrics.expiringSoon, icon: AlertTriangle, href: "/inventory?filter=expiring", color: "text-orange-500", valueColor: "text-orange-500" }, // Accent color for icon and value
    { title: "Expired Medicines", value: metrics.expired, icon: CalendarOff, href: "/inventory?filter=expired", color: "text-destructive", valueColor: "text-destructive" }, // Destructive color for icon and value
    { title: "Cold-Chain Breaches", value: metrics.coldChainBreaches, icon: ThermometerSnowflake, href: "/inventory?filter=coldchain", color: "text-blue-500", valueColor: "text-blue-500" }, // Blue for cold chain
    { title: "Active Shipments", value: metrics.activeShipments, icon: Truck, href: "/shipments", color: "text-purple-500", valueColor: "text-purple-500" }, // Example purple color
  ];

   const quickActions = [
     { title: "Manage Inventory", icon: Boxes, href: "/inventory", label: "inventory" },
     { title: "Track Shipments", icon: Truck, href: "/shipments", label: "shipments" },
     { title: "RxAI Support", icon: BrainCircuit, href: "/rxai", label: "RxAI" },
     { title: "PharmaNet", icon: FlaskConical, href: "/pharmanet", label: "PharmaNet"},
     // Removed Reports quick action as it's now a submenu in sidebar
     // { title: "View Reports", icon: BarChart, href: "/reports/inventory", label: "reports" },
   ];

  return (
    <div className="space-y-6 animate-fadeIn">
       {/* Welcome Banner */}
       <Card className="bg-gradient-to-r from-primary to-teal-600 text-primary-foreground shadow-lg"> {/* Increased shadow */}
         <CardHeader>
           <CardTitle className="text-2xl">
             {isLoading ? (
               <Skeleton className="h-8 w-48 bg-white/30" />
             ) : (
               `Welcome back, ${user?.name || 'User'}!`
             )}
           </CardTitle>
           <CardDescription className="text-primary-foreground/80">
             Here's a quick overview of your MediSync Pro workspace.
           </CardDescription>
         </CardHeader>
       </Card>

       {/* Metric Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
         {metricCards.map((metric, index) => (
           <Card key={index} className="shadow-md hover:shadow-lg transition-shadow"> {/* Added shadow */}
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
               <metric.icon className={`h-4 w-4 ${metric.color}`} />
             </CardHeader>
             <CardContent className="pb-4">
               {isLoading ? (
                  <Skeleton className="h-8 w-16" />
               ) : (
                 <div className={`text-2xl font-bold ${metric.value > 0 ? metric.valueColor : ''}`}>{metric.value}</div>
               )}
               <p className="text-xs text-muted-foreground">
                 {metric.title === 'Expiring Soon' ? 'Within 7 days' :
                  metric.title === 'Cold-Chain Breaches' ? 'Incidents recorded' :
                  metric.title === 'Total Medicines' ? 'Items in stock' :
                  metric.title === 'Expired Medicines' ? 'Items past date' :
                  metric.title === 'Active Shipments' ? 'Currently tracked' : ''}
               </p>
             </CardContent>
             <CardFooter className="pt-0 pb-4 px-6">
               <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                 <Link href={metric.href}>View Details</Link>
               </Button>
             </CardFooter>
           </Card>
         ))}
       </div>

       {/* Quick Actions */}
       <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow hover:border-primary/50 shadow-md"> {/* Added shadow */}
                 <Link href={action.href} className="block h-full">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
                        <action.icon className="h-10 w-10 text-primary mb-3" />
                        <p className="font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Access the {action.label || action.title.toLowerCase()} section.</p>
                    </CardContent>
                 </Link>
                </Card>
             ))}
          </div>
       </div>

       {/* Optional: Recent Activity Feed */}
       <Card className="shadow-md"> {/* Added shadow */}
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Recent Activity</CardTitle>
           <CardDescription>Overview of recent inventory changes and alerts.</CardDescription>
         </CardHeader>
         <CardContent>
           {/* Placeholder - Replace with actual activity feed component */}
           {isLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
               </div>
           ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
              // TODO: Map through recent activity items fetched via React Query
           )}
         </CardContent>
       </Card>

    </div>
  );
}
