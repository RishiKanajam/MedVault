'use client';
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
  Truck, // Added Truck icon as an alternative
  Loader2
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
import { useAuth } from '@/providers/AuthProvider'; // Use the consolidated AuthContext hook
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
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

   // Extract module settings from the profile
   // const moduleSettings = profile?.settings?.modules; 
   const modulesLoading = loading; // Loading state depends on auth context loading

   console.log('[AppSidebar] user:', user, 'profile:', profile, 'loading:', loading);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account.',
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error logging out',
        description: 'There was a problem logging out. Please try again.',
        variant: 'destructive',
      });
    }
  };

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


  // Show all modules for authenticated users
  const filteredItems = user ? sidebarItems : [];

  const isLoading = modulesLoading && !user;

  const getDisplayName = () => {
    return profile?.name || user?.displayName || "User";
  };

  const getDisplayEmail = () => {
    return user?.email || "";
  }

  const getAvatarFallback = () => {
    const name = profile?.name || user?.displayName;
    return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
  }

  // If we're still loading auth state, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // If we're not authenticated, don't show the sidebar
  if (!user || !profile) {
    return null;
  }

  return (
    <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-[var(--sidebar-width)]">
      <SidebarHeader className="p-4 flex items-center justify-between">
         {/* Remove Pill icon and app name from sidebar header */}
      </SidebarHeader>
      <Separator className="mb-2 bg-sidebar-border" />

      <SidebarContent className="flex-1 overflow-y-auto px-2">
        <SidebarMenu>
          {isLoading && !user ? ( 
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
                            asChild
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      variant="ghost"
                      tooltip={sidebarState === 'collapsed' ? item.label : undefined}
                    >
                        <Link href={item.href!} className="flex items-center gap-2 w-full">
                          <item.icon className={cn(isActive && "text-sidebar-foreground")} />
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
             "flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-hover",
             sidebarState === 'collapsed' ? 'justify-center' : 'justify-between'
            )}>
             <div className="flex items-center gap-2 overflow-hidden">
                 <Avatar className="h-8 w-8">
                     <AvatarImage src={user?.isAnonymous ? undefined : (profile?.photoURL || user?.photoURL || undefined)} alt={getDisplayName()} data-ai-hint="user avatar placeholder" />
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
                 <Link
                   href="/logout"
                   className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-hover"
                   onClick={handleLogout}
                 >
                   <LogOut className="h-4 w-4" />
                   <span className="sr-only">Logout</span>
                 </Link>
              )}
           </div>
      </SidebarFooter>
    </Sidebar>
  );
}
