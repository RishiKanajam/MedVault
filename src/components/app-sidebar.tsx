import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  Ship,
  BrainCircuit,
  FlaskConical,
  Settings,
  ClipboardList,
  Pill,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  BarChart
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
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
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder - replace with actual Firebase Auth hook/context
const useAuth = () => {
  const [user, setUser] = useState<{ displayName: string; email: string; photoURL?: string } | null>(null);
   const [loading, setLoading] = useState(true);

   React.useEffect(() => {
     const timer = setTimeout(() => {
       setUser({ displayName: "Dr. Anya Sharma", email: "anya.sharma@medsync.pro", photoURL: "https://picsum.photos/id/237/40/40" });
        setLoading(false);
     }, 300);
     return () => clearTimeout(timer);
   }, []);


   const logout = async () => {
     setLoading(true);
     await new Promise(resolve => setTimeout(resolve, 300));
     setUser(null);
     setLoading(false);
     console.log("Logout simulated from sidebar hook");
   };

  return { user, loading, logout };
};

// Placeholder - replace with actual module settings hook
const useModules = () => {
    const [modules, setModules] = useState({
        medTrack: true,
        shipment: true,
        rxAI: true,
        pharmaNet: true,
        patientHistory: true,
        reports: true,
    });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }, []);

    return { modules, loading };
};

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const { user, loading: userLoading, logout } = useAuth();
  const { modules, loading: modulesLoading } = useModules();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged Out" });
    router.push('/');
  }

   const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sidebarItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", moduleKey: 'dashboard' as const },
    { href: "/inventory", icon: Boxes, label: "Inventory", moduleKey: 'medTrack' as const },
    { href: "/shipments", icon: Ship, label: "Shipments", moduleKey: 'shipment' as const },
    { href: "/rxai", icon: BrainCircuit, label: "RxAI Support", moduleKey: 'rxAI' as const },
    { href: "/pharmanet", icon: FlaskConical, label: "PharmaNet", moduleKey: 'pharmaNet' as const },
    { href: "/history", icon: ClipboardList, label: "Patient History", moduleKey: 'patientHistory' as const },
    {
      label: "Reports", icon: BarChart, moduleKey: 'reports' as const,
      submenu: [
         { href: "/reports/inventory", label: "Inventory Reports" },
         { href: "/reports/usage", label: "Usage Analytics" },
      ]
    }
  ];

  const filteredItems = sidebarItems.filter(item =>
     item.moduleKey === 'dashboard' || (item.moduleKey && modules[item.moduleKey])
   );

   const isLoading = userLoading || modulesLoading;

  return (
    // Apply sidebar background and fixed width
    <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border" style={{ width: '240px' }}>
      <SidebarHeader className="p-4 flex items-center justify-between">
         <Link href="/dashboard" className="flex items-center gap-2 flex-grow overflow-hidden">
             {/* Use primary color for the pill icon */}
            <Pill className="w-6 h-6 text-primary shrink-0" />
            {sidebarState === 'expanded' && (
               <h1 className="text-xl font-semibold truncate">MediSync Pro</h1>
            )}
         </Link>
      </SidebarHeader>
      <Separator className="mb-2 bg-sidebar-border" />

      <SidebarContent className="flex-1 overflow-y-auto px-2">
        <SidebarMenu>
          {isLoading ? (
             Array.from({ length: 6 }).map((_, index) => (
               <SidebarMenuItem key={index}>
                 <div className={cn(
                   "flex items-center gap-2 p-2 rounded-md h-10",
                   sidebarState === 'collapsed' && 'justify-center w-10 h-10'
                 )}>
                   <Skeleton className={cn("h-5 w-5 rounded bg-sidebar-hover", sidebarState === 'collapsed' && 'h-6 w-6')} />
                   {sidebarState === 'expanded' && <Skeleton className="h-4 w-24 rounded bg-sidebar-hover" />}
                 </div>
               </SidebarMenuItem>
             ))
          ) : (
             filteredItems.map((item) => {
              const isActive = item.href ? pathname === item.href : false;
              const isSubmenuActive = item.submenu?.some(sub => pathname === sub.href) ?? false;

              return (
                <SidebarMenuItem key={item.label}>
                  {item.submenu ? (
                    <Collapsible open={openSubmenus[item.label]} onOpenChange={() => toggleSubmenu(item.label)}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            variant="ghost" // Use ghost for consistent styling
                            className={cn(
                                "justify-between w-full hover:bg-sidebar-hover", // Hover state
                                isSubmenuActive && "bg-sidebar-accent text-sidebar-foreground" // Active state for submenu parent
                            )}
                            tooltip={sidebarState === 'collapsed' ? item.label : undefined}
                            data-state={openSubmenus[item.label] ? 'open' : 'closed'}
                          >
                            <span className="flex items-center gap-2">
                              <item.icon className={cn(isSubmenuActive && "text-sidebar-foreground")} />
                                {sidebarState === 'expanded' && <span>{item.label}</span>}
                              </span>
                              {sidebarState === 'expanded' && (
                                openSubmenus[item.label] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                              )}
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                           {/* Use sidebar-submenu-background */}
                           <SidebarMenuSub className="bg-sidebar-submenu-background rounded-md">
                             {item.submenu.map(subItem => {
                                const isSubItemActive = pathname === subItem.href;
                                return (
                                   <SidebarMenuSubItem key={subItem.label}>
                                      {/* Pass isActive to SubButton */}
                                     <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                       <Link href={subItem.href}>
                                          <span>{subItem.label}</span>
                                        </Link>
                                     </SidebarMenuSubButton>
                                   </SidebarMenuSubItem>
                                );
                             })}
                           </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    // Pass isActive prop to SidebarMenuButton
                    <SidebarMenuButton asChild tooltip={sidebarState === 'collapsed' ? item.label : undefined} isActive={isActive} variant="ghost">
                        <Link href={item.href!}>
                          <item.icon />
                          {sidebarState === 'expanded' && <span>{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })
          )}
        </SidebarMenu>
      </SidebarContent>

      <Separator className="mt-auto bg-sidebar-border" />

      <SidebarFooter className="p-2 space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip={sidebarState === 'collapsed' ? "Settings" : undefined} isActive={pathname === '/settings'} variant="ghost">
                  <Link href="/settings">
                    <Settings />
                    {sidebarState === 'expanded' && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

           <div className={cn(
             "flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-hover", // Hover uses lighter charcoal
             sidebarState === 'collapsed' ? 'justify-center' : 'justify-between'
            )}>
             <Link href="#" onClick={(e) => { e.preventDefault(); console.log("Avatar clicked - open profile modal");}} className="flex items-center gap-2 overflow-hidden">
                 <Avatar className="h-8 w-8">
                     <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} data-ai-hint="user avatar placeholder" />
                     {/* Fallback uses sidebar hover color */}
                     <AvatarFallback className="bg-sidebar-hover text-sidebar-foreground">
                         {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                     </AvatarFallback>
                 </Avatar>
                 {sidebarState === 'expanded' && (
                     <div className="flex flex-col text-xs truncate">
                         <span className="font-medium">{user?.displayName || 'User'}</span>
                         <span className="text-sidebar-foreground/70">{user?.email || ''}</span>
                     </div>
                 )}
              </Link>
              {sidebarState === 'expanded' && (
                 // Logout button uses ghost variant for consistency
                 <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground">
                     <LogOut className="h-4 w-4" />
                     <span className="sr-only">Logout</span>
                 </Button>
              )}
           </div>
      </SidebarFooter>
    </Sidebar>
  );
}
