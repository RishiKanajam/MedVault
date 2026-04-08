"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth as firebaseAuth } from "@/firebase";

const PAGE_NAMES: Record<string, string> = {
  dashboard:  "Dashboard",
  inventory:  "Inventory",
  shipments:  "Shipments",
  rxai:       "RxAI",
  pharmanet:  "PharmaNet",
  history:    "Patient History",
  settings:   "Settings",
  profile:    "Profile",
};

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments
    .filter((s) => !["auth", "(app)"].includes(s))
    .map((seg, i, arr) => ({
      label: PAGE_NAMES[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      href: "/" + arr.slice(0, i + 1).join("/"),
      isLast: i === arr.length - 1,
    }));
}

export function Header() {
  const authContext = useAuth();
  if (!authContext) throw new Error("AuthProvider is missing");
  const { user, profile, authLoading } = authContext;
  const router = useRouter();
  const breadcrumbs = useBreadcrumb();

  const displayName = authLoading
    ? "…"
    : profile?.name || user?.displayName || user?.email?.split("@")[0] || "User";

  const email = profile?.email || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
    router.replace("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile sidebar trigger */}
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground md:hidden" />

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              {crumb.isLast ? (
                <span className="truncate font-semibold text-foreground">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Right — user menu only (no theme toggle) */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2.5 rounded-full px-2.5 hover:bg-muted/60"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                  <AvatarImage
                    src={profile?.photoURL || user?.photoURL || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground sm:inline">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  {email && (
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
