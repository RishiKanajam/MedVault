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
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// TODO: Replace with actual auth state and module settings
// const isAuthenticated = false; // Placeholder - Temporarily set to true for testing
const isAuthenticated = true;
const modules = {
  medTrack: true,
  shipment: true,
  rxAI: true,
  pharmaNet: true,
  rndAlerts: true, // Assuming PharmaNet includes R&D Alerts for now
}; // Placeholder

export function AppSidebar() {
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
          {isAuthenticated ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

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
            </>
          ) : (
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Login">
                  <Link href="/login">
                    <LogIn />
                    Login
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <Separator />

      <SidebarFooter className="p-2">
        {isAuthenticated ? (
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             {/* TODO: Add Logout Button Here (will be handled in AppLayout dropdown) */}
          </SidebarMenu>
        ) : (
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip="Sign Up">
                 <Link href="/signup">
                   <UserPlus />
                   Sign Up
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
