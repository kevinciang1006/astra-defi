/**
 * @jest-environment node
 */

// Mock NextResponse to avoid Request polyfill issues
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { success, error, errors, ErrorCode } from '../response';

describe('success', () => {
  it('creates a successful response with data', async () => {
    const response = success({ message: 'Hello' });
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data).toEqual({ message: 'Hello' });
    expect(response.status).toBe(200);
  });

  it('allows custom status code', async () => {
    const response = success({ id: 1 }, 201);
    expect(response.status).toBe(201);
  });
});

describe('error', () => {
  it('creates an error response', async () => {
    const response = error(ErrorCode.BAD_REQUEST, 'Invalid input', 400);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toBe('Invalid input');
    expect(response.status).toBe(400);
  });

  it('defaults to 500 status', async () => {
    const response = error(ErrorCode.INTERNAL_ERROR, 'Server error');
    expect(response.status).toBe(500);
  });
});

describe('errors helpers', () => {
  it('badRequest returns 400', async () => {
    const response = errors.badRequest('Bad data');
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toBe('Bad data');
  });

  it('unauthorized returns 401', async () => {
    const response = errors.unauthorized();
    expect(response.status).toBe(401);
  });

  it('forbidden returns 403', async () => {
    const response = errors.forbidden();
    expect(response.status).toBe(403);
  });

  it('notFound returns 404', async () => {
    const response = errors.notFound('User not found');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error.message).toBe('User not found');
  });

  it('validationError returns 400', async () => {
    const response = errors.validationError('Email is required');
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toBe('Email is required');
  });

  it('rateLimited returns 429', async () => {
    const response = errors.rateLimited();
    expect(response.status).toBe(429);
  });

  it('internalError returns 500', async () => {
    const response = errors.internalError();
    expect(response.status).toBe(500);
  });

  it('serviceUnavailable returns 503', async () => {
    const response = errors.serviceUnavailable();
    expect(response.status).toBe(503);
  });

  it('externalApiError returns 502', async () => {
    const response = errors.externalApiError('CoinGecko API down');
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error.message).toBe('CoinGecko API down');
  });
});

describe('ErrorCode', () => {
  it('contains all expected error codes', () => {
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCode.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
    expect(ErrorCode.EXTERNAL_API_ERROR).toBe('EXTERNAL_API_ERROR');
  });
});
