import { NextRequest } from 'next/server';
import { verifySession } from './auth';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export class SecurityService {
  // Rate limiting
  static checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 }
  ): boolean {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
      return true;
    }

    if (current.count >= config.maxRequests) {
      return false;
    }

    current.count++;
    rateLimitStore.set(key, current);
    return true;
  }

  // Input sanitization
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .slice(0, 1000); // Limit length
  }

  // SQL injection prevention (for any raw queries)
  static sanitizeForQuery(input: string): string {
    return input
      .replace(/['";\\]/g, '') // Remove SQL injection characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comments
      .replace(/\*\//g, '');
  }

  // XSS prevention
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // CSRF token generation and validation
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, you'd validate against stored tokens
    // For now, we'll use a simple comparison
    return token === sessionToken;
  }

  // File upload security
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large' };
    }

    return { valid: true };
  }

  // Secure headers
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://api.firebase.com https://*.googleapis.com",
        "frame-ancestors 'none'",
      ].join('; '),
    };
  }

  // Authentication middleware
  static async requireAuth(req: NextRequest) {
    try {
      const decodedToken = await verifySession(req);
      return { success: true, user: decodedToken };
    } catch (error) {
      return { success: false, error: 'Authentication required' };
    }
  }

  // Permission checking
  static async checkPermission(
    req: NextRequest,
    requiredPermission: string
  ): Promise<{ success: boolean; error?: string }> {
    const authResult = await this.requireAuth(req);
    if (!authResult.success) {
      return { success: false, error: authResult.error ?? 'Authentication required' };
    }

    // Check user permissions (implement based on your permission system)
    const user = authResult.user;
    const permissions = user?.customClaims?.permissions || [];
    
    if (!permissions.includes(requiredPermission)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    return { success: true };
  }

  // Audit logging
  static logSecurityEvent(
    event: string,
    details: Record<string, any>,
    userId?: string
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      details,
      ip: 'unknown', // Extract from request in real implementation
    };

    console.log('Security Event:', logEntry);
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to security monitoring service
    }
  }
}

// Security middleware for API routes
export function withSecurity(
  handler: (req: NextRequest) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    rateLimit?: RateLimitConfig;
    permissions?: string[];
  } = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = req.headers.get('x-forwarded-for') || 
                        req.headers.get('x-real-ip') || 
                        'unknown';
        
        if (!SecurityService.checkRateLimit(clientIP, options.rateLimit)) {
          SecurityService.logSecurityEvent('RATE_LIMIT_EXCEEDED', { clientIP });
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Authentication
      if (options.requireAuth) {
        const authResult = await SecurityService.requireAuth(req);
        if (!authResult.success) {
          return new Response(
            JSON.stringify({ success: false, error: authResult.error }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Permissions
      if (options.permissions && options.permissions.length > 0) {
        for (const permission of options.permissions) {
          const permResult = await SecurityService.checkPermission(req, permission);
          if (!permResult.success) {
            return new Response(
              JSON.stringify({ success: false, error: permResult.error }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      // Execute handler
      const response = await handler(req);
      
      // Add security headers
      const securityHeaders = SecurityService.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      SecurityService.logSecurityEvent('SECURITY_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Security error occurred' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
