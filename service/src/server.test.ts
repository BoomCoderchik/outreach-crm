import { once } from 'node:events';
import { request } from 'node:http';

import { describe, expect, it } from 'vitest';

import { createServiceServer, resolveServiceHost } from './server';

async function startEphemeralServer() {
  const server = createServiceServer('0.1.0');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral TCP address');
  }
  return { server, port: address.port };
}

async function get(port: number, path: string) {
  return new Promise<{ statusCode?: number; contentType?: string; body: string }>(
    (resolve, reject) => {
      const httpRequest = request({ host: '127.0.0.1', port, path, method: 'GET' }, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            contentType: response.headers['content-type'],
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      });
      httpRequest.on('error', reject);
      httpRequest.end();
    },
  );
}

describe('local service HTTP contract', () => {
  it('serves a JSON health response and a JSON 404 without using a fixed port', async () => {
    const { server, port } = await startEphemeralServer();

    try {
      const health = await get(port, '/health');
      expect(health.statusCode).toBe(200);
      expect(health.contentType).toContain('application/json');
      expect(JSON.parse(health.body)).toEqual({
        status: 'ok',
        service: 'outreach-crm-local-service',
        version: '0.1.0',
      });

      const missing = await get(port, '/missing');
      expect(missing.statusCode).toBe(404);
      expect(missing.contentType).toContain('application/json');
      expect(JSON.parse(missing.body)).toEqual({ error: 'Not found' });
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
