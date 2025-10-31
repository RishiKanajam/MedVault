import { lazy, useEffect, useState } from 'react';
import type { ComponentType } from 'react';

// Performance monitoring
export class PerformanceService {
  private static marks = new Map<string, number>();

  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) : 0;
    
    if (startTime) {
      const duration = endTime - startTime;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
    
    return 0;
  }

  static async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.mark(`${name}-start`);
    try {
      const result = await operation();
      this.measure(`${name}-end`, `${name}-start`);
      return result;
    } catch (error) {
      this.measure(`${name}-error`, `${name}-start`);
      throw error;
    }
  }
}

// Lazy loading utilities
export function lazyImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}

// Code splitting for routes
export const LazyDashboard = lazyImport(() => import('@/app/(app)/dashboard/page'));
export const LazyInventory = lazyImport(() => import('@/app/(app)/inventory/page'));
export const LazyShipments = lazyImport(() => import('@/app/(app)/shipments/page'));
export const LazyRxAI = lazyImport(() => import('@/app/(app)/rxai/page'));
export const LazyPharmaNet = lazyImport(() => import('@/app/(app)/pharmanet/page'));
export const LazyHistory = lazyImport(() => import('@/app/(app)/history/page'));
export const LazySettings = lazyImport(() => import('@/app/(app)/settings/page'));

// Image optimization
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export function optimizeImage(
  src: string,
  _options: ImageOptimizationOptions = {}
): string {
  // In a real implementation, you'd use a service like Cloudinary or ImageKit
  // For now, return the original src
  return src;
}

// Bundle analysis
export function analyzeBundle() {
  if (process.env.NODE_ENV === 'development') {
    // Log bundle information
    console.log('Bundle Analysis:', {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });
  }
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
}

// Performance optimization hooks
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    PerformanceService.mark(`${componentName}-mount`);
    
    return () => {
      PerformanceService.measure(`${componentName}-unmount`, `${componentName}-mount`);
    };
  }, [componentName]);
}

// Debounced function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttled function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Virtual scrolling for large lists
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}
