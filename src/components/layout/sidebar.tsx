"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  Brain,
  Pill,
  Settings,
  Truck,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react"
import { useAuth } from '@/providers/AuthProvider';

const modules = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "RxAI",
    href: "/rxai",
    icon: Brain,
  },
  {
    title: "PharmaNet",
    href: "/pharmanet",
    icon: Pill,
  },
  {
    title: "Shipments",
    href: "/shipments",
    icon: Truck,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, authLoading } = useAuth();

  let displayName = 'Guest';
  let role = 'Guest';
  if (authLoading) {
    displayName = '...';
    role = '';
  } else if (profile && profile.name) {
    displayName = profile.name;
    role = 'User';
  } else if (user) {
    displayName = user.displayName || 'Guest';
    role = user.isAnonymous ? 'Guest' : 'User';
  }

  // Initials for avatar fallback
  const initials = displayName && displayName !== 'Guest' && displayName !== '...' ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'G';

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="text-lg font-semibold">MediSync Pro</span>
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {modules.map((module) => {
          const isActive = pathname === module.href
          return (
            <Link
              key={module.href}
              href={module.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-sidebar-hover",
                isActive && "bg-sidebar-accent text-sidebar-foreground"
              )}
            >
              <module.icon className="h-5 w-5" />
              <span>{module.title}</span>
              <ChevronRight
                className={cn(
                  "ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100",
                  isActive && "opacity-100"
                )}
              />
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent/20 flex items-center justify-center">
            <span className="text-sm font-medium">{initials}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-sidebar-foreground/60">{role}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 