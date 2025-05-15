'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Optional: If you want React Query DevTools
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configure global query options here if needed
      // staleTime: 1000 * 60 * 5, // 5 minutes
      // refetchOnWindowFocus: false,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
       {/* Optional: Add React Query DevTools for debugging */}
       {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
