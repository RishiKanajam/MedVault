import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  Ship,
  BrainCircuit,
  FlaskConical,
  Settings,
  ClipboardList, // Icon for Patient History
  Pill, // Generic icon for the app
  ChevronDown,
  ChevronRight,
  User, // For fallback avatar
  LogOut, // Logout Icon
  BarChart // Example for submenu
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger, // Import trigger for mobile
  SidebarMenuSub, // Import Submenu container
  SidebarMenuSubButton, // Import Submenu button
  SidebarMenuSubItem, // Import Submenu item
  useSidebar, // Hook to get sidebar state
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast'; // For logout feedback
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";


// Placeholder - replace with actual Firebase Auth hook/context
const useAuth = () => {
  // Simulate fetching user data
  const [user, setUser] = useState<{ displayName: string; email: string; photoURL?: string } | null>(null);
   const [loading, setLoading] = useState(true);

   React.useEffect(() => {
     const timer = setTimeout(() => {
       setUser({ displayName: "Dr. Anya Sharma", email: "anya.sharma@medsync.pro", photoURL: "https://picsum.photos/id/237/40/40" });
        setLoading(false);
     }, 300); // Simulate loading
     return () => clearTimeout(timer);
   }, []);


   const logout = async () => {
     setLoading(true);
     await new Promise(resolve => setTimeout(resolve, 300)); // Simulate logout delay
     setUser(null);
     setLoading(false);
     console.log("Logout simulated from sidebar hook");
   };

  return { user, loading, logout };
};


// TODO: Fetch enabled modules from Firestore settings/context
const useModules = () => {
    // Simulate fetching module settings
    const [modules, setModules] = useState({
        medTrack: true,
        shipment: true,
        rxAI: true,
        pharmaNet: true,
        patientHistory: true,
        reports: true, // Example: Enable reports module
    });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        // Replace with actual fetch from Firestore/context
        setLoading(false);
      }, 200); // Simulate loading
      return () => clearTimeout(timer);
    }, []);

    return { modules, loading };
};


export function AppSidebar() {
  const { state: sidebarState } = useSidebar(); // Get sidebar collapsed/expanded state
  const { user, logout } = useAuth();
  const { modules, loading: modulesLoading } = useModules();
  const { toast } = useToast();
  const router = useRouter();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});


  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged Out" });
    router.push('/'); // Redirect to landing page
  }

   const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sidebarItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", moduleKey: 'dashboard' as const }, // Always show dashboard
    { href: "/inventory", icon: Boxes, label: "Inventory", moduleKey: 'medTrack' as const },
    { href: "/shipments", icon: Ship, label: "Shipments", moduleKey: 'shipment' as const },
    { href: "/rxai", icon: BrainCircuit, label: "RxAI Support", moduleKey: 'rxAI' as const },
    { href: "/pharmanet", icon: FlaskConical, label: "PharmaNet", moduleKey: 'pharmaNet' as const },
    { href: "/history", icon: ClipboardList, label: "Patient History", moduleKey: 'patientHistory' as const },
    // Example Submenu (if needed later)
    {
      label: "Reports", icon: BarChart, moduleKey: 'reports' as const, // Add 'reports' to modules if needed
      submenu: [
         { href: "/reports/inventory", label: "Inventory Reports" },
         { href: "/reports/usage", label: "Usage Analytics" },
      ]
    }
  ];

  // Filter items based on enabled modules (ensure 'dashboard' and 'settings' are always present if they exist)
  const filteredItems = sidebarItems.filter(item =>
     item.moduleKey === 'dashboard' || (item.moduleKey && modules[item.moduleKey])
   );


  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-between">
         <Link href="/dashboard" className="flex items-center gap-2 flex-grow overflow-hidden">
            <Pill className="w-6 h-6 text-primary shrink-0" />
            {sidebarState === 'expanded' && (
               <h1 className="text-xl font-semibold truncate text-sidebar-foreground">MediSync Pro</h1>
            )}
         </Link>
         {/* Mobile Trigger - Handled by Sidebar component internally now */}
         {/* <SidebarTrigger className="md:hidden" />  */}
      </SidebarHeader>
      <Separator className="mb-2 bg-sidebar-border" />

      <SidebarContent className="flex-1 overflow-y-auto px-2">
        <SidebarMenu>
          {modulesLoading ? (
             // Skeleton Loaders
             Array.from({ length: 5 }).map((_, index) => (
               <SidebarMenuItem key={index}>
                 <div className={cn(
                   "flex items-center gap-2 p-2 rounded-md h-10",
                   sidebarState === 'collapsed' && 'justify-center w-10 h-10' // Adjust for collapsed state
                 )}>
                   <Skeleton className={cn("h-5 w-5 rounded bg-sidebar-accent/30", sidebarState === 'collapsed' && 'h-6 w-6')} />
                   {sidebarState === 'expanded' && <Skeleton className="h-4 w-24 rounded bg-sidebar-accent/30" />}
                 </div>
               </SidebarMenuItem>
             ))
          ) : (
             filteredItems.map((item) => (
             <SidebarMenuItem key={item.label}>
                {item.submenu ? (
                   <Collapsible open={openSubmenus[item.label]} onOpenChange={() => toggleSubmenu(item.label)}>
                      <CollapsibleTrigger asChild>
                         <SidebarMenuButton
                           variant="ghost"
                           className="justify-between w-full"
                           tooltip={sidebarState === 'collapsed' ? item.label : undefined}
                           data-state={openSubmenus[item.label] ? 'open' : 'closed'} // Add data-state
                          >
                           <span className="flex items-center gap-2">
                             <item.icon />
                              {sidebarState === 'expanded' && <span>{item.label}</span>}
                            </span>
                            {sidebarState === 'expanded' && (
                              openSubmenus[item.label] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            )}
                          </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {/* Apply background color and shadow to the CollapsibleContent */}
                      <CollapsibleContent className="mt-1">
                         <div className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            {/* Apply overlay-secondary here for the submenu background */}
                           <SidebarMenuSub className="overlay-secondary">
                             {item.submenu.map(subItem => (
                               <SidebarMenuSubItem key={subItem.label}>
                                  <SidebarMenuSubButton asChild isActive={router.pathname === subItem.href}> {/* Use SubButton */}
                                     <Link href={subItem.href}>
                                        {/* Optionally add a sub-icon or indent further */}
                                        {subItem.label}
                                      </Link>
                                  </SidebarMenuSubButton>
                               </SidebarMenuSubItem>
                              ))}
                           </SidebarMenuSub>
                         </div>
                      </CollapsibleContent>
                   </Collapsible>
                ) : (
                   <SidebarMenuButton asChild tooltip={sidebarState === 'collapsed' ? item.label : undefined} isActive={router.pathname === item.href}>
                      <Link href={item.href}>
                         <item.icon />
                         {sidebarState === 'expanded' && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <Separator className="mt-auto bg-sidebar-border" />

      <SidebarFooter className="p-2 space-y-2">
          {/* Settings Link */}
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip={sidebarState === 'collapsed' ? "Settings" : undefined} isActive={router.pathname === '/settings'}>
                  <Link href="/settings">
                    <Settings />
                    {sidebarState === 'expanded' && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

           {/* User Info & Logout */}
           <div className={cn(
             "flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent", // Use accent for hover
             sidebarState === 'collapsed' ? 'justify-center' : 'justify-between'
            )}>
             <Link href="#" onClick={(e) => { e.preventDefault(); /* Open Profile Modal via Layout state? */ console.log("Avatar clicked - open profile modal");}} className="flex items-center gap-2 overflow-hidden">
                 <Avatar className="h-8 w-8">
                     <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} data-ai-hint="user avatar placeholder" />
                     <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                         {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                     </AvatarFallback>
                 </Avatar>
                 {sidebarState === 'expanded' && (
                     <div className="flex flex-col text-xs truncate text-sidebar-foreground">
                         <span className="font-medium">{user?.displayName || 'User'}</span>
                         <span className="text-muted-foreground">{user?.email || ''}</span>
                     </div>
                 )}
              </Link>
              {sidebarState === 'expanded' && (
                 <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                     <LogOut className="h-4 w-4" />
                     <span className="sr-only">Logout</span>
                 </Button>
              )}
           </div>
      </SidebarFooter>
    </Sidebar>
  );
}
