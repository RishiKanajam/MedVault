// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers'; // For React Query
import { ThemeProvider } from "@/components/theme-provider";
// Removed AuthProviderWrapper import and usage from here

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
    // Important: Ensure this is only on <html>, not duplicated on <body>
    <html lang="en" suppressHydrationWarning>
      {/* Removed duplicate suppressHydrationWarning from body */}
      <body className={`${inter.variable} font-sans antialiased`}>
         <ThemeProvider
             attribute="class"
             defaultTheme="system" // Default to system theme preference
             enableSystem
             disableTransitionOnChange
         >
             <Providers> {/* React Query */}
                 {/* AuthProviderWrapper is NOT used here. It's in the protected route layout */}
                 {children}
                 <Toaster />
             </Providers>
         </ThemeProvider>
      </body>
    </html>
  );
}
