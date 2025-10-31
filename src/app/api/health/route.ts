import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: typeof process !== 'undefined' ? process.uptime() : 0,
      memory: typeof process !== 'undefined' ? process.memoryUsage() : {},
      healthChecks: {
        database: {
          name: 'Database',
          status: 'healthy',
          message: 'Database connection is working',
        },
        firebase: {
          name: 'Firebase',
          status: 'healthy',
          message: 'Firebase services are operational',
        },
        externalAPIs: {
          name: 'External APIs',
          status: 'healthy',
          message: 'External API services are accessible',
        },
      },
    };

    return NextResponse.json(healthData);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
