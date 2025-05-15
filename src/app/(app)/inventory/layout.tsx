'use client';

import { Toaster } from '@/components/ui/toaster';

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 