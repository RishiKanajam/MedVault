import { cache } from 'react';

// In-memory cache for server-side caching
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheService {
  // Server-side caching with React cache
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000 } = options; // Default 5 minutes

    // Check memory cache first
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Store in memory cache
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    return data;
  }

  // Invalidate cache by key
  static invalidate(key: string): void {
    memoryCache.delete(key);
  }

  // Invalidate cache by tag
  static invalidateByTag(tag: string): void {
    for (const [key, value] of memoryCache.entries()) {
      if (value.data.tags && value.data.tags.includes(tag)) {
        memoryCache.delete(key);
      }
    }
  }

  // Clear all cache
  static clear(): void {
    memoryCache.clear();
  }

  // Get cache stats
  static getStats() {
    return {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
    };
  }
}

// React cache wrapper
export const cachedFetch = cache(async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    next: { revalidate: 300 }, // 5 minutes
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
});

// Cached API calls
export const cachedApiCall = cache(async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> => {
  return CacheService.getOrSet(key, fetcher, { ttl });
});
