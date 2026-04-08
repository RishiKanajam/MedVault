'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  BrainCircuit,
  FlaskConical,
  Settings,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Truck,
  Loader2,
  Pill,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

type ModuleKey =
  | 'medTrack'
  | 'shipment'
  | 'rxAI'
  | 'pharmaNet'
  | 'patientHistory'
  | 'reports'
  | 'dashboard';

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

const navSections: Array<{ title: string; items: SidebarItemConfig[] }> = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', moduleKey: 'dashboard' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/inventory', icon: Boxes,  label: 'Inventory',  moduleKey: 'medTrack' },
      { href: '/shipments', icon: Truck,  label: 'Shipments',  moduleKey: 'shipment' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/rxai',     icon: BrainCircuit,  label: 'RxAI Support',    moduleKey: 'rxAI' },
      { href: '/pharmanet', icon: FlaskConical,  label: 'PharmaNet',       moduleKey: 'pharmaNet' },
      { href: '/history',   icon: ClipboardList, label: 'Patient History', moduleKey: 'patientHistory' },
    ],
  },
];

export function AppSidebar() {
  const { state: sidebarState, setOpen } = useSidebar();
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const isLoading = (authLoading || profileLoading) && !user;
  const expanded = sidebarState === 'expanded';

  useEffect(() => {
    if (sidebarState === 'collapsed') setOpen(true);
  }, [sidebarState, setOpen]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: 'Signed out', description: 'You have been signed out.' });
    } catch {
      toast({ title: 'Error', description: 'Could not sign out.', variant: 'destructive' });
    }
  };

  const toggleSubmenu = (key: string) =>
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const displayName  = profile?.name || user?.displayName || 'User';
  const displayEmail = user?.email || '';
  const initials     = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-4">
        <div className={cn('flex items-center', expanded ? 'gap-3' : 'justify-center')}>
          {/* Icon badge */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
            <Pill className="h-4.5 w-4.5 text-white" />
          </div>
          {expanded && (
            <div>
              <p className="text-sm font-bold leading-none tracking-tight text-foreground">
                MedVault
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                Care Workspace
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-border" />

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <SidebarContent className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-5">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-0.5">
              {expanded && (
                <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = item.href ? pathname === item.href : false;
                  const isSubmenuActive = item.submenu?.some((s) => pathname === s.href) ?? false;

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
                                'w-full justify-between rounded-xl px-2.5 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                isSubmenuActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              )}
                            >
                              <span className="flex items-center gap-2.5">
                                <item.icon className="h-4 w-4 shrink-0" />
                                {expanded && <span className="text-sm">{item.label}</span>}
                              </span>
                              {expanded && (
                                openSubmenus[item.label]
                                  ? <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                                  : <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-0.5">
                            <SidebarMenuSub className="ml-2 space-y-0.5 border-l border-border/60 pl-3">
                              {item.submenu.map((sub) => (
                                <SidebarMenuSubItem key={sub.label}>
                                  <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                                    <Link href={sub.href}>
                                      <span className="text-sm">{sub.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          variant="ghost"
                          className={cn(
                            'rounded-xl px-2.5 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isActive && 'bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary/90 hover:text-white font-medium'
                          )}
                        >
                          <Link href={item.href!} className="flex w-full items-center gap-2.5">
                            <item.icon className="h-4 w-4 shrink-0" />
                            {expanded && <span className="text-sm">{item.label}</span>}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>

              {sectionIndex !== navSections.length - 1 && (
                <div className="mt-3" />
              )}
            </div>
          ))}
        </nav>
      </SidebarContent>

      <Separator className="bg-border" />

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <SidebarFooter className="p-3">
        {/* Settings */}
        <SidebarMenu className="mb-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/settings'}
              variant="ghost"
              className={cn(
                'rounded-xl px-2.5 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                pathname === '/settings' && 'bg-primary text-white hover:bg-primary/90 hover:text-white font-medium'
              )}
            >
              <Link href="/settings" className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 shrink-0" />
                {expanded && <span className="text-sm">Settings</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User row */}
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-2.5',
            !expanded && 'flex-col justify-center gap-2'
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/15">
            <AvatarImage
              src={user?.isAnonymous ? undefined : profile?.photoURL || user?.photoURL || undefined}
              alt={displayName}
            />
            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
              {initials || <User className="h-3.5 w-3.5" />}
            </AvatarFallback>
          </Avatar>

          {expanded && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-none text-foreground">
                  {displayName}
                </p>
                {displayEmail && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{displayEmail}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="sr-only">Sign out</span>
              </Button>
            </>
          )}

          {!expanded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="sr-only">Sign out</span>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </div>
  );
}
