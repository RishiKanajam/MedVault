import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { formatValidationError } from './validation';

export class ApiHandler {
  static async handleRequest<T>(
    req: NextRequest,
    schema: z.ZodSchema<T>,
    handler: (data: T, req: NextRequest) => Promise<any>
  ) {
    try {
      // Validate content type
      const contentType = req.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return NextResponse.json(
          { success: false, error: 'Content-Type must be application/json' },
          { status: 400 }
        );
      }

      // Parse and validate request body
      const body = await req.json();
      const validatedData = schema.parse(body);

      // Execute handler
      const result = await handler(validatedData, req);

      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      console.error('API Handler Error:', error);

      if (error instanceof z.ZodError) {
        const validationError = formatValidationError(error);
        return NextResponse.json(
          { success: false, error: validationError.message, details: validationError.details },
          { status: 400 }
        );
      }

      // Check if error has a statusCode property (for custom error handling)
      if (error?.statusCode === 401) {
        return NextResponse.json(
          { success: false, error: error.message || 'Unauthorized' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  }

  static async handleGetRequest<T>(
    req: NextRequest,
    schema: z.ZodSchema<T>,
    handler: (data: T, req: NextRequest) => Promise<any>
  ) {
    try {
      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const params = Object.fromEntries(searchParams.entries());
      const validatedData = schema.parse(params);

      // Execute handler
      const result = await handler(validatedData, req);

      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      console.error('API Handler Error:', error);

      if (error instanceof z.ZodError) {
        const validationError = formatValidationError(error);
        return NextResponse.json(
          { success: false, error: validationError.message, details: validationError.details },
          { status: 400 }
        );
      }

      // Check if error has a statusCode property (for custom error handling)
      if (error?.statusCode === 401) {
        return NextResponse.json(
          { success: false, error: error.message || 'Unauthorized' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  }

  static success<T>(data: T): NextResponse {
    return NextResponse.json({ success: true, data });
  }

  static error(message: string, status: number = 500, details?: any): NextResponse {
    return NextResponse.json(
      { success: false, error: message, details },
      { status }
    );
  }

  static validationError(errors: any[]): NextResponse {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }

  static forbidden(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 }
    );
  }

  static notFound(message: string = 'Not found'): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 }
    );
  }
}
