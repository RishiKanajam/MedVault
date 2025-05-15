"use client"

import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <div className="flex-1">
        <Header />
        <main className="container py-6">
          {children}
        </main>
      </div>
    </div>
  )
} 