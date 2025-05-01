import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  Ship,
  BrainCircuit,
  FlaskConical,
  Settings,
  LogIn,
  UserPlus,
  Pill, // Generic icon for the app
  ClipboardList, // Icon for Patient History
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// TODO: Replace with actual auth state and module settings from context/state management
// These should ideally come from a global state/context, not hardcoded here.
const isAuthenticated = true; // Assume authenticated within the AppLayout context
const modules = {
  medTrack: true,
  shipment: true,
  rxAI: true,
  pharmaNet: true,
  patientHistory: true, // Add the new module toggle state
}; // Placeholder

export function AppSidebar() {
  // Removed redundant isAuthenticated check, as this component is rendered within AppLayout which handles auth.
  // Module visibility should be based on fetched settings.

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
           <Pill className="w-6 h-6 text-primary" />
           <h1 className="text-xl font-semibold">MediSync Pro</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
              {/* Always show Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Module-based Links */}
              {modules.medTrack && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Inventory">
                    <Link href="/inventory">
                      <Boxes />
                      Inventory
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {modules.shipment && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Shipments">
                    <Link href="/shipments">
                      <Ship />
                      Shipments
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {modules.rxAI && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="RxAI Support">
                    <Link href="/rxai">
                      <BrainCircuit />
                      RxAI Support
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {modules.pharmaNet && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="PharmaNet">
                    <Link href="/pharmanet">
                      <FlaskConical />
                      PharmaNet
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Add Patient History Link */}
              {modules.patientHistory && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Patient History">
                    <Link href="/history">
                      <ClipboardList />
                      Patient History
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
        </SidebarMenu>
      </SidebarContent>

      <Separator />

      <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             {/* Logout Button is handled in AppLayout dropdown */}
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
