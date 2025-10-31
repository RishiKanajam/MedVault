'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  // Ship, // Consider Truck icon from previous version if 'Ship' is not ideal
  BrainCircuit,
  FlaskConical,
  Settings,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Truck, // Added Truck icon as an alternative
  Loader2,
  Pill
} from 'lucide-react';
import {
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
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
  const { state: sidebarState, setOpen } = useSidebar();
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

   // Extract module settings from the profile
   // const moduleSettings = profile?.settings?.modules; 
   const modulesLoading = authLoading || profileLoading; // Loading state depends on auth context loading

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

  const navSections: Array<{
    title: string;
    items: SidebarItemConfig[];
  }> = [
    {
      title: "Overview",
      items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", moduleKey: "dashboard" }],
    },
    {
      title: "Operations",
      items: [
        { href: "/inventory", icon: Boxes, label: "Inventory", moduleKey: "medTrack" },
        { href: "/shipments", icon: Truck, label: "Shipments", moduleKey: "shipment" },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { href: "/rxai", icon: BrainCircuit, label: "RxAI Support", moduleKey: "rxAI" },
        { href: "/pharmanet", icon: FlaskConical, label: "PharmaNet", moduleKey: "pharmaNet" },
        { href: "/history", icon: ClipboardList, label: "Patient History", moduleKey: "patientHistory" },
      ],
    },
  ];

  const isLoading = modulesLoading && !user;
  const visibleSections = user ? navSections : [];

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

  useEffect(() => {
    if (sidebarState === 'collapsed') {
      setOpen(true);
    }
  }, [sidebarState, setOpen]);

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
    <div className="flex h-full flex-col">
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Pill className="h-4 w-4" />
          </div>
          {sidebarState === 'expanded' && (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">MedVault</p>
              <p className="text-xs text-muted-foreground">Care Workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-border/60" />

      <SidebarContent className="flex-1 overflow-y-auto px-2 py-4">
        <nav className="space-y-6">
          {isLoading && !user ? (
            <SidebarMenu>
              {Array.from({ length: 6 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <div
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-xl border border-border/30 bg-background/70 px-3",
                      sidebarState === "collapsed" && "h-10 w-10 justify-center border-transparent px-0"
                    )}
                  >
                    <Skeleton
                      className={cn(
                        "h-5 w-5 rounded-full bg-muted",
                        sidebarState === "collapsed" && "h-5 w-5"
                      )}
                    />
                    {sidebarState === "expanded" && <Skeleton className="h-4 w-24 rounded bg-muted" />}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : (
            visibleSections.map((section, index) => (
              <div key={section.title} className="space-y-2">
                {sidebarState === "expanded" && (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                    {section.title}
                  </p>
                )}
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = item.href ? pathname === item.href : false;
                    const isSubmenuActive = item.submenu?.some((sub) => pathname === sub.href) ?? false;

                    return (
                      <SidebarMenuItem key={item.label}>
                        {item.submenu ? (
                          <Collapsible
                            open={Boolean(openSubmenus[item.label])}
                            onOpenChange={() => toggleSubmenu(item.label)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                variant="ghost"
                                className={cn(
                                  "w-full justify-between rounded-xl border border-transparent px-3",
                                  isSubmenuActive && "border-primary/30 bg-primary/10 text-primary"
                                )}
                                data-state={openSubmenus[item.label] ? "open" : "closed"}
                                asChild
                                {...(sidebarState === "collapsed" ? { tooltip: item.label } : {})}
                              >
                                <span className="flex items-center gap-2">
                                  <item.icon className={cn(isSubmenuActive && "text-primary")} />
                                  {sidebarState === "expanded" && <span className="text-sm font-medium">{item.label}</span>}
                                </span>
                                {sidebarState === "expanded" &&
                                  (openSubmenus[item.label] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  ))}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-1">
                              <SidebarMenuSub className="space-y-1 rounded-xl border border-border/40 bg-background/80 p-1.5">
                                {item.submenu.map((subItem) => {
                                  const isSubItemActive = pathname === subItem.href;
                                  return (
                                    <SidebarMenuSubItem key={subItem.label}>
                                      <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                        <Link href={subItem.href}>
                                          <span className="text-sm">{subItem.label}</span>
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
                            className={cn(
                              "rounded-xl border border-transparent px-3",
                              isActive && "border-primary/30 bg-primary/10 text-primary"
                            )}
                            {...(sidebarState === "collapsed" ? { tooltip: item.label } : {})}
                          >
                            <Link href={item.href!} className="flex w-full items-center gap-3">
                              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                              {sidebarState === "expanded" && <span className="text-sm font-medium">{item.label}</span>}
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
                {sidebarState === "expanded" && index !== visibleSections.length - 1 ? (
                  <Separator className="mx-3 bg-border/40" />
                ) : null}
              </div>
            ))
          )}
        </nav>
      </SidebarContent>

      <Separator className="mt-auto bg-border/60" />

      <SidebarFooter className="p-4">
        <div className="space-y-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/settings"}
                variant="ghost"
                className={cn(
                  "rounded-xl border border-transparent px-3",
                  pathname === "/settings" && "border-primary/30 bg-primary/10 text-primary"
                )}
                {...(sidebarState === "collapsed" ? { tooltip: "Settings" } : {})}
              >
                <Link href="/settings" className="flex w-full items-center gap-3">
                  <Settings className="h-4 w-4" />
                  {sidebarState === "expanded" && <span className="text-sm font-medium">Settings</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border/50 bg-background/90 px-3 py-3",
              sidebarState === "collapsed" && "flex-col border-border/20 px-2 py-4 text-center"
            )}
          >
            <Avatar className="h-10 w-10 border border-border/40">
              <AvatarImage
                src={
                  user?.isAnonymous
                    ? undefined
                    : profile?.photoURL || user?.photoURL || undefined
                }
                alt={getDisplayName()}
                data-ai-hint="user avatar placeholder"
              />
              <AvatarFallback className="bg-muted text-foreground">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
            {sidebarState === "expanded" ? (
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-foreground">{getDisplayName()}</p>
                <p className="truncate text-xs text-muted-foreground">{getDisplayEmail()}</p>
              </div>
            ) : null}
            {sidebarState === "expanded" ? (
              <Button variant="ghost" size="sm" className="h-8 px-3" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </div>
  );
}
