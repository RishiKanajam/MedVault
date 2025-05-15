"use client"

import { User as UserIcon, Pill, Stethoscope, HeartPulse } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

export function Header() {
  const auth = useAuth();
  if (!auth) throw new Error('AuthProvider is missing');
  const { user, profile, authLoading } = auth;
  const router = useRouter();

  let displayName = 'Guest';
  let email = '';
  if (authLoading) {
    displayName = '...';
    email = '';
  } else if (profile && profile.name) {
    displayName = profile.name;
    email = profile.email || '';
  } else if (user) {
    displayName = user.displayName || '';
    email = user.email || '';
    if (!displayName) {
      // Fallback to email username
      displayName = email ? email.split('@')[0] : 'Guest';
    }
  }

  const handleProfile = () => router.push('/profile');
  const handleSettings = () => router.push('/settings');
  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/auth/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-semibold text-primary">MediSync Pro</span>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  {email && <p className="text-xs leading-none text-muted-foreground">{email}</p>}
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
  )
} 