import { NextResponse } from 'next/server';

// Standardized API response types
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Common error codes
export const ErrorCode = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Create a successful API response.
 */
export function success<T>(data: T, status: number = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error API response.
 */
export function error(
  code: ErrorCodeType,
  message: string,
  status: number = 500
): NextResponse<ApiError> {
  // Log server errors
  if (status >= 500) {
    console.error(`[API Error] ${code}: ${message}`);
  }

  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

// Pre-built common error responses
export const errors = {
  badRequest: (message: string = 'Invalid request') =>
    error(ErrorCode.BAD_REQUEST, message, 400),

  unauthorized: (message: string = 'Authentication required') =>
    error(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message: string = 'Access denied') => error(ErrorCode.FORBIDDEN, message, 403),

  notFound: (message: string = 'Resource not found') =>
    error(ErrorCode.NOT_FOUND, message, 404),

  validationError: (message: string) => error(ErrorCode.VALIDATION_ERROR, message, 400),

  rateLimited: (message: string = 'Too many requests') =>
    error(ErrorCode.RATE_LIMITED, message, 429),

  internalError: (message: string = 'Internal server error') =>
    error(ErrorCode.INTERNAL_ERROR, message, 500),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    error(ErrorCode.SERVICE_UNAVAILABLE, message, 503),

  externalApiError: (message: string = 'External service error') =>
    error(ErrorCode.EXTERNAL_API_ERROR, message, 502),
};
