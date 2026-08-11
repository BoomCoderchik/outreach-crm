import { once } from 'node:events';
import { request } from 'node:http';

import { describe, expect, it } from 'vitest';

import { createServiceServer } from './server';
import { resolveServiceHost } from './server';
import type { FolderPickerResult } from './folder-picker';

type HttpResponse = {
  statusCode?: number;
  contentType?: string;
  body: string;
  setCookie?: string;
};

async function startEphemeralServer(pickProjectFolder?: () => Promise<FolderPickerResult>) {
  const server = createServiceServer(
    '0.1.0',
    pickProjectFolder ? { pickProjectFolder } : undefined,
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral TCP address');
  }
  return { server, port: address.port };
}

async function requestJson(
  port: number,
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; cookie?: string } = {},
) {
  return new Promise<HttpResponse>((resolve, reject) => {
    const httpRequest = request(
      {
        host: '127.0.0.1',
        port,
        path,
        method: options.method ?? 'GET',
        headers: {
          ...(options.body ? { 'content-type': 'application/json' } : {}),
          ...(options.cookie ? { cookie: options.cookie } : {}),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            contentType: response.headers['content-type'],
            body: Buffer.concat(chunks).toString('utf8'),
            setCookie: response.headers['set-cookie']?.[0],
          });
        });
      },
    );
    httpRequest.on('error', reject);
    if (options.body) httpRequest.write(JSON.stringify(options.body));
    httpRequest.end();
  });
}

describe('local service HTTP contract', () => {
  it('serves a JSON health response and a JSON 404 without using a fixed port', async () => {
    const { server, port } = await startEphemeralServer();

    try {
      const health = await requestJson(port, '/health');
      expect(health.statusCode).toBe(200);
      expect(health.contentType).toContain('application/json');
      expect(JSON.parse(health.body)).toEqual({
        status: 'ok',
        service: 'outreach-crm-local-service',
        version: '0.1.0',
      });

      const missing = await requestJson(port, '/missing');
      expect(missing.statusCode).toBe(404);
      expect(missing.contentType).toContain('application/json');
      expect(JSON.parse(missing.body)).toEqual({ error: 'Not found' });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});

describe('project folder picker endpoint', () => {
  it('returns the selected folder to the authenticated account', async () => {
    const { server, port } = await startEphemeralServer(async () => ({
      kind: 'selected',
      folderPath: 'C:\\Work\\Founder outreach',
    }));

    try {
      const registration = await requestJson(port, '/api/auth/register', {
        method: 'POST',
        body: {
          email: `picker-${Date.now()}@example.com`,
          password: 'local-password-123',
        },
      });
      const cookie = registration.setCookie?.split(';')[0];
      const picker = await requestJson(port, '/api/projects/pick-folder', {
        method: 'POST',
        cookie,
      });

      expect(picker.statusCode).toBe(200);
      expect(JSON.parse(picker.body)).toEqual({ folderPath: 'C:\\Work\\Founder outreach' });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('returns cancellation without an error when the user closes the picker', async () => {
    const { server, port } = await startEphemeralServer(async () => ({ kind: 'cancelled' }));

    try {
      const registration = await requestJson(port, '/api/auth/register', {
        method: 'POST',
        body: {
          email: `cancel-picker-${Date.now()}@example.com`,
          password: 'local-password-123',
        },
      });
      const cookie = registration.setCookie?.split(';')[0];
      const picker = await requestJson(port, '/api/projects/pick-folder', {
        method: 'POST',
        cookie,
      });

      expect(picker.statusCode).toBe(200);
      expect(JSON.parse(picker.body)).toEqual({ cancelled: true });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('requires a local account session', async () => {
    const { server, port } = await startEphemeralServer(async () => ({
      kind: 'selected',
      folderPath: 'C:\\Private',
    }));

    try {
      const picker = await requestJson(port, '/api/projects/pick-folder', { method: 'POST' });

      expect(picker.statusCode).toBe(401);
      expect(JSON.parse(picker.body)).toEqual({ error: 'Authentication required' });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});

describe('local service host policy', () => {
  it('defaults to loopback and rejects network binding without explicit opt-in', () => {
    expect(resolveServiceHost(undefined, undefined)).toBe('127.0.0.1');
    expect(() => resolveServiceHost('0.0.0.0', undefined)).toThrow(
      'Refusing non-loopback HOST without UNSAFE_ALLOW_NETWORK=true',
    );
    expect(resolveServiceHost('0.0.0.0', 'true')).toBe('0.0.0.0');
  });
});
