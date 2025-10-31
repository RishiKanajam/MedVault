import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // External service errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface AppErrorShape {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: any;
  readonly statusCode: number;
  readonly isOperational: boolean;
}

export class AppError extends Error implements AppErrorShape {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error factory functions
export const createError = {
  unauthorized: (message: string = 'Unauthorized', details?: any) =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401, true, details),
  
  validation: (message: string = 'Validation failed', details?: any) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, true, details),
  
  notFound: (message: string = 'Resource not found', details?: any) =>
    new AppError(ErrorCode.RESOURCE_NOT_FOUND, message, 404, true, details),
  
  forbidden: (message: string = 'Forbidden', details?: any) =>
    new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403, true, details),
  
  database: (message: string = 'Database error', details?: any) =>
    new AppError(ErrorCode.DATABASE_ERROR, message, 500, true, details),
  
  external: (message: string = 'External service error', details?: any) =>
    new AppError(ErrorCode.EXTERNAL_API_ERROR, message, 502, true, details),
  
  internal: (message: string = 'Internal server error', details?: any) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500, false, details),
};

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Unknown error occurred',
      code: ErrorCode.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}

// Error handler for client-side
export function handleClientError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

// Async error wrapper for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw error; // Let the error bubble up to be handled by handleApiError
    }
  };
}

// Retry mechanism for external API calls
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw createError.external(
          `Operation failed after ${maxRetries} attempts`,
          { originalError: lastError.message }
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}
