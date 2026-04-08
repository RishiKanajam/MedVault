import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

const setNodeEnv = (value: string) => {
  const originalValue = process.env.NODE_ENV;
  Object.defineProperty(process.env, 'NODE_ENV', {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
  return () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      enumerable: true,
      value: originalValue,
      writable: true,
    });
  };
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('should render error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('should show retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.getByText('Reload page')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should reset error state when retry is clicked', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // Prepare next render without errors
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Click retry to reset the boundary
    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => {
      expect(screen.getByText('No error')).toBeTruthy();
    });
  });

  it('should show error details in development mode', () => {
    const restoreEnv = setNodeEnv('development');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error details')).toBeTruthy();

    restoreEnv();
  });

  it('should not show error details in production mode', () => {
    const restoreEnv = setNodeEnv('production');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error details')).toBeNull();

    restoreEnv();
  });
});
