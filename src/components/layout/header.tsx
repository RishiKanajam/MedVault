"use client";

import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth as firebaseAuth } from "@/firebase";

export function Header() {
  const authContext = useAuth();
  if (!authContext) throw new Error("AuthProvider is missing");
  const { user, profile, authLoading } = authContext;
  const router = useRouter();
  const pathname = usePathname();

  let displayName = "Guest";
  let email = "";
  if (authLoading) {
    displayName = "...";
  } else if (profile && profile.name) {
    displayName = profile.name;
    email = profile.email || "";
  } else if (user) {
    displayName = user.displayName || "";
    email = user.email || "";
    if (!displayName) {
      const fallbackName = email ? email.split("@")[0] : "";
      displayName = fallbackName || "Guest";
    }
  }

  const subline = profile?.clinicName || "Clinical Command Center";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
    { href: "/shipments", label: "Shipments" },
    { href: "/rxai", label: "RxAI" },
  ];

  const handleProfile = () => router.push("/profile");
  const handleSettings = () => router.push("/settings");
  const handleLogout = async () => {
    if (!firebaseAuth) {
      console.warn("Firebase auth not initialized; cannot sign out.");
      return;
    }
    await signOut(firebaseAuth);
    router.replace("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <SidebarTrigger className="md:hidden" />
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
            MedVault
          </span>
          <span className="text-sm text-muted-foreground">{subline}</span>
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 rounded-full px-3 py-1.5">
                <UserIcon className="h-4 w-4" />
                <span className="hidden text-sm font-medium sm:inline-flex">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  {email ? <p className="text-xs leading-none text-muted-foreground">{email}</p> : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
