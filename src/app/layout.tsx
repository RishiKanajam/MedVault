
// app/layout.tsx  (Server Component)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers'; // React Query Provider
import { ThemeProvider } from "@/components/theme-provider"; // Theme Provider
import AuthProvider from '@/providers/AuthProvider'; // Import the AuthProvider

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
    // Add suppressHydrationWarning to the html tag to help mitigate hydration errors,
    // especially those caused by browser extensions modifying the DOM.
    <html lang="en" suppressHydrationWarning>
      {/* Add suppressHydrationWarning to body as well */}
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
            attribute="class"
            defaultTheme="system" // Default to system theme preference
            enableSystem
            disableTransitionOnChange
        >
           <Providers> {/* React Query */}
             <AuthProvider> {/* Wrap content with AuthProvider */}
               {/* SidebarProvider removed from here as AppLayout handles it */}
               {children}
               <Toaster />
             </AuthProvider>
           </Providers>
         </ThemeProvider>
      </body>
    </html>
  );
}
