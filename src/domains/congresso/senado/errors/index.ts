import { logger } from '@/app/monitoring';

/**
 * Base class for API errors
 */
export abstract class ApiError extends Error {
  /**
   * HTTP status code
   */
  public readonly status: number;
  
  /**
   * Error code for client identification
   */
  public readonly code: string;
  
  /**
   * Optional additional details
   */
  public readonly details?: unknown;
  
  /**
   * Constructor
   * 
   * @param message Error message
   * @param status HTTP status code
   * @param code Error code
   * @param details Additional details
   */
  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    
    // Log error for monitoring
    logger.error(`API Error [${code}]: ${message}`, { status, details });
  }
  
  /**
   * Convert to JSON for response
   */
  toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        status: this.status,
        details: this.details,
      }
    };
  }
}

/**
 * Error for validation failures
 */
export class ValidationApiError extends ApiError {
  /**
   * Constructor
   * 
   * @param message Error message
   * @param fieldErrors Field-specific errors
   */
  constructor(
    message: string,
    fieldErrors: Record<string, string[]>
  ) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      { fields: fieldErrors }
    );
  }
}

/**
 * Error for resource not found
 */
export class NotFoundApiError extends ApiError {
  /**
   * Constructor
   * 
   * @param message Error message
   * @param resourceId Optional resource ID
   */
  constructor(
    message: string,
    resourceId?: string | number
  ) {
    super(
      message,
      404,
      'RESOURCE_NOT_FOUND',
      resourceId ? { resourceId } : undefined
    );
  }
}

/**
 * Error for server-side issues
 */
export class ServerApiError extends ApiError {
  /**
   * Constructor
   * 
   * @param message Error message
   * @param originalError Original error message
   */
  constructor(
    message: string,
    originalError?: string
  ) {
    super(
      message,
      500,
      'SERVER_ERROR',
      originalError ? { originalError } : undefined
    );
  }
}

/**
 * Error for network issues
 */
export class NetworkApiError extends ApiError {
  /**
   * Constructor
   * 
   * @param message Error message
   * @param details Additional details
   */
  constructor(
    message: string,
    details?: unknown
  ) {
    super(
      message,
      503,
      'NETWORK_ERROR',
      details
    );
  }
}

/**
 * Error for rate limiting
 */
export class RateLimitApiError extends ApiError {
  /**
   * Constructor
   * 
   * @param message Error message
   * @param retryAfter When to retry (in seconds)
   */
  constructor(
    message: string,
    retryAfter?: number
  ) {
    super(
      message,
      429,
      'RATE_LIMIT_EXCEEDED',
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * Error for cache issues
 */
export class CacheApiError extends ApiError {
  /**
   * Constructor
   * 
   * @param message Error message
   * @param operation Cache operation that failed
   */
  constructor(
    message: string,
    operation: string
  ) {
    super(
      message,
      500,
      'CACHE_ERROR',
      { operation }
    );
  }
}
