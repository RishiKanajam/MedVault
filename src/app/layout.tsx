import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers'; // React Query Provider
import { ThemeProvider } from "@/components/theme-provider"; // Theme Provider
import { UserProvider } from '@/context/UserContext'; // Import UserProvider
import { ClientSideAuthGuard } from '@/hooks/useAuthGuard'; // Import the client-side guard component

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'MediSync Pro',
  description: 'Integrated Medical Management & Clinical Support',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <UserProvider>
              <Providers> {/* React Query */}
                  <SidebarProvider>
                      {/* Wrap the main content with the client-side guard */}
                      {/* This handles loading spinners and redirects based on auth state */}
                      <ClientSideAuthGuard>
                          {children}
                      </ClientSideAuthGuard>
                      <Toaster />
                  </SidebarProvider>
              </Providers>
          </UserProvider>
         </ThemeProvider>
      </body>
    </html>
  );
}
