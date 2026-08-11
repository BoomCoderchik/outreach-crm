import { describe, expect, it } from 'vitest';

import { createHealthResponse } from './health';

describe('createHealthResponse', () => {
  it('returns a stable public service health contract', () => {
    expect(createHealthResponse('0.1.0')).toEqual({
      status: 'ok',
      service: 'outreach-crm-local-service',
      version: '0.1.0',
    });
  });
});
