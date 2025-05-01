
// app/layout.tsx  (Server Component)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers'; // Keep React Query Provider if needed

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
         {/* Removed ThemeProvider and AuthProvider from root */}
         <Providers> {/* React Query */}
             {children}
             <Toaster />
         </Providers>
      </body>
    </html>
  );
}
