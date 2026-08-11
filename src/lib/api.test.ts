import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, api } from './api';

afterEach(() => vi.restoreAllMocks());

describe('local API error handling', () => {
  it('explains when the local service cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    await expect(api.login('person@example.com', 'password123')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Local service is unavailable. Start the app with npm run dev.',
    });
  });

  it('keeps useful JSON errors from the local service', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    await expect(api.register('person@example.com', 'password123')).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: 'ApiError',
        status: 409,
        message: 'An account with this email already exists',
      }),
    );
  });
});
