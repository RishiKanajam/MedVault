// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers'; // For React Query
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/providers/AuthProvider';

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
    // Add suppressHydrationWarning to mitigate common browser extension issues
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
         <ThemeProvider
             attribute="class"
             defaultTheme="system" // Default to system theme preference
             enableSystem
             disableTransitionOnChange
         >
            <AuthProvider>
              <Providers> {/* This is for React Query */}
                  {children}
                  <Toaster />
              </Providers>
            </AuthProvider>
         </ThemeProvider>
      </body>
    </html>
  );
}
