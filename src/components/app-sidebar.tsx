import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  // Ship, // Consider Truck icon from previous version if 'Ship' is not ideal
  BrainCircuit,
  FlaskConical,
  Settings,
  ClipboardList,
  Pill,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  BarChart,
  Truck // Added Truck icon as an alternative
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
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useUserContext } from '@/context/UserContext'; // Use the context hook
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';


// Define Module Keys explicitly for type safety
type ModuleKey = 'medTrack' | 'shipment' | 'rxAI' | 'pharmaNet' | 'patientHistory' | 'reports' | 'dashboard';

// Interface for sidebar items, including module key
interface SidebarItemConfig {
    href?: string;
    icon: React.ElementType;
    label: string;
    moduleKey: ModuleKey;
    submenu?: SubmenuItemConfig[];
}

interface SubmenuItemConfig {
    href: string;
    label: string;
}


export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const { authUser, profile, loading: userLoading } = useUserContext(); // Get user and profile from context
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

   // Extract module settings from the profile
   const moduleSettings = profile?.settings?.modules; // Adjusted to new profile structure
   const modulesLoading = userLoading; // Loading state depends on user context loading


  const handleLogout = async () => {
     try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login'); // Redirect to login after successful logout
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Error", description: "Failed to log out.", variant: "destructive" });
    }
  }

   const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sidebarItems: SidebarItemConfig[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", moduleKey: 'dashboard' },
    { href: "/inventory", icon: Boxes, label: "Inventory", moduleKey: 'medTrack' },
    { href: "/shipments", icon: Truck, label: "Shipments", moduleKey: 'shipment' }, // Using Truck icon
    { href: "/rxai", icon: BrainCircuit, label: "RxAI Support", moduleKey: 'rxAI' },
    { href: "/pharmanet", icon: FlaskConical, label: "PharmaNet", moduleKey: 'pharmaNet' },
    { href: "/history", icon: ClipboardList, label: "Patient History", moduleKey: 'patientHistory' },
    // { // Example Reports submenu - enable if 'reports' module exists
    //   label: "Reports", icon: BarChart, moduleKey: 'reports',
    //   submenu: [
    //      { href: "/reports/inventory", label: "Inventory Reports" },
    //      { href: "/reports/usage", label: "Usage Analytics" },
    //   ]
    // }
  ];


  // Filter items based on module settings from the user's profile
  // For anonymous users, moduleSettings will be undefined, so they see all items by default
  // unless specific logic is added to restrict for anonymous users.
  const filteredItems = sidebarItems.filter(item =>
     item.moduleKey === 'dashboard' || (authUser && !authUser.isAnonymous && moduleSettings && moduleSettings[item.moduleKey]) || (authUser && authUser.isAnonymous) // Guests see all modules by default
   );


   const isLoading = modulesLoading; // Use the loading state from context

  const getDisplayName = () => {
    if (authUser?.isAnonymous) return "Guest User";
    return profile?.name || authUser?.displayName || "User";
  };

  const getDisplayEmail = () => {
    if (authUser?.isAnonymous) return "guest@example.com";
    return authUser?.email || "";
  }

  const getAvatarFallback = () => {
    if (authUser?.isAnonymous) return "G";
    const name = profile?.name || authUser?.displayName;
    return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
  }

  return (
    <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-[var(--sidebar-width)]">
      <SidebarHeader className="p-4 flex items-center justify-between">
         <Link href="/dashboard" className="flex items-center gap-2 flex-grow overflow-hidden">
            <Pill className="w-6 h-6 text-primary shrink-0" />
            {sidebarState === 'expanded' && (
               <h1 className="text-xl font-semibold truncate">MediSync Pro</h1>
            )}
         </Link>
      </SidebarHeader>
      <Separator className="mb-2 bg-sidebar-border" />

      <SidebarContent className="flex-1 overflow-y-auto px-2">
        <SidebarMenu>
          {isLoading && !authUser ? ( // Show skeleton only if truly loading and no authUser yet
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
                            variant="ghost"
                            className={cn(
                                "justify-between w-full hover:bg-sidebar-hover",
                                isSubmenuActive && "bg-sidebar-accent text-sidebar-foreground"
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
                           <SidebarMenuSub className="bg-sidebar-submenu-background rounded-md">
                             {item.submenu.map(subItem => {
                                const isSubItemActive = pathname === subItem.href;
                                return (
                                   <SidebarMenuSubItem key={subItem.label}>
                                     <SidebarMenuSubButton asChild isActive={isSubItemActive} href={subItem.href}>
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
                    <SidebarMenuButton asChild tooltip={sidebarState === 'collapsed' ? item.label : undefined} isActive={isActive} variant="ghost" href={item.href!}>
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
               <SidebarMenuButton asChild tooltip={sidebarState === 'collapsed' ? "Settings" : undefined} isActive={pathname === '/settings'} variant="ghost" href="/settings">
                  <Link href="/settings">
                    <Settings />
                    {sidebarState === 'expanded' && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

           {/* User Info Section - Uses profile from context */}
           <div className={cn(
             "flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-hover",
             sidebarState === 'collapsed' ? 'justify-center' : 'justify-between'
            )}>
              {/* Make Avatar clickable to open profile modal - Example, can be linked to settings or modal */}
             <div className="flex items-center gap-2 overflow-hidden">
                 <Avatar className="h-8 w-8">
                     <AvatarImage src={authUser?.isAnonymous ? undefined : (profile?.photoURL || authUser?.photoURL || undefined)} alt={getDisplayName()} data-ai-hint="user avatar placeholder" />
                     <AvatarFallback className="bg-sidebar-hover text-sidebar-foreground">
                         {getAvatarFallback()}
                     </AvatarFallback>
                 </Avatar>
                 {sidebarState === 'expanded' && (
                     <div className="flex flex-col text-xs truncate">
                         <span className="font-medium">{getDisplayName()}</span>
                         <span className="text-sidebar-foreground/70">{getDisplayEmail()}</span>
                     </div>
                 )}
              </div>
              {sidebarState === 'expanded' && (
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
