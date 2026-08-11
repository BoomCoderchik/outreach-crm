import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import { createHealthResponse } from './health.js';

const LOOPBACK_HOST = '127.0.0.1';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

export function resolveServiceHost(
  host: string | undefined,
  unsafeAllowNetwork: string | undefined,
) {
  const requestedHost = host?.trim() || LOOPBACK_HOST;
  const isLoopback =
    requestedHost === 'localhost' || requestedHost === LOOPBACK_HOST || requestedHost === '::1';

  if (isLoopback || unsafeAllowNetwork === 'true') {
    return requestedHost;
  }

  throw new Error('Refusing non-loopback HOST without UNSAFE_ALLOW_NETWORK=true');
}

function respondJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, { 'content-type': JSON_CONTENT_TYPE });
  response.end(JSON.stringify(payload));
}

function handleRequest(request: IncomingMessage, response: ServerResponse, version: string) {
  const url = new URL(request.url ?? '/', `http://${LOOPBACK_HOST}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    respondJson(response, 200, createHealthResponse(version));
    return;
  }

  respondJson(response, 404, { error: 'Not found' });
}

export function createServiceServer(version: string): Server {
  return createServer((request, response) => handleRequest(request, response, version));
}
