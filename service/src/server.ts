import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import { createHealthResponse } from './health.js';
import {
  pickProjectFolder as openProjectFolder,
  type FolderPickerResult,
} from './folder-picker.js';
import {
  addProject,
  authenticateUser,
  createSession,
  createUser,
  deleteProject,
  deleteSession,
  getUserForSession,
  listProjects,
  normalizeEmail,
  publicUser,
  validateEmail,
} from './storage.js';

const LOOPBACK_HOST = '127.0.0.1';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
const SESSION_COOKIE = 'outreach_session';
const MAX_BODY_BYTES = 32_000;

export type ServiceDependencies = {
  pickProjectFolder?: () => Promise<FolderPickerResult>;
};

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
  response.writeHead(statusCode, {
    'content-type': JSON_CONTENT_TYPE,
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function respondWithSession(response: ServerResponse, token: string) {
  response.setHeader(
    'set-cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`,
  );
}

function clearSession(response: ServerResponse) {
  response.setHeader('set-cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function getSessionToken(request: IncomingMessage) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith(`${SESSION_COOKIE}=`));
  return sessionCookie?.split('=').slice(1).join('=').trim();
}

async function readBody(request: IncomingMessage) {
  let body = '';
  for await (const chunk of request) {
    body += chunk.toString();
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error('Request body is too large');
  }
  if (!body) return {} as Record<string, unknown>;
  const parsed = JSON.parse(body) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Request body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function handleAuthFailure(response: ServerResponse) {
  respondJson(response, 401, { error: 'Authentication required' });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  version: string,
  dependencies: ServiceDependencies,
) {
  const url = new URL(request.url ?? '/', `http://${LOOPBACK_HOST}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    respondJson(response, 200, createHealthResponse(version));
    return;
  }

  try {
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readBody(request);
      const email = isString(body.email) ? normalizeEmail(body.email) : '';
      const password = isString(body.password) ? body.password : '';
      if (!validateEmail(email)) {
        respondJson(response, 400, { error: 'Enter a valid email address' });
        return;
      }
      if (password.length < 8 || password.length > 200) {
        respondJson(response, 400, { error: 'Password must be between 8 and 200 characters' });
        return;
      }
      const user = createUser(email, password);
      if (!user) {
        respondJson(response, 409, { error: 'An account with this email already exists' });
        return;
      }
      respondWithSession(response, createSession(user.id));
      respondJson(response, 201, { user: publicUser(user) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readBody(request);
      const email = isString(body.email) ? body.email : '';
      const password = isString(body.password) ? body.password : '';
      const user = authenticateUser(email, password);
      if (!user) {
        respondJson(response, 401, { error: 'Email or password is incorrect' });
        return;
      }
      respondWithSession(response, createSession(user.id));
      respondJson(response, 200, { user: publicUser(user) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      deleteSession(getSessionToken(request));
      clearSession(response);
      respondJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = getUserForSession(getSessionToken(request));
      if (!user) {
        handleAuthFailure(response);
        return;
      }
      respondJson(response, 200, { user: publicUser(user) });
      return;
    }

    const user = getUserForSession(getSessionToken(request));
    if (!user) {
      if (url.pathname.startsWith('/api/')) handleAuthFailure(response);
      else respondJson(response, 404, { error: 'Not found' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/projects') {
      respondJson(response, 200, { projects: listProjects(user.id) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/projects/pick-folder') {
      try {
        const selection = await (dependencies.pickProjectFolder ?? openProjectFolder)();
        respondJson(
          response,
          200,
          selection.kind === 'selected'
            ? { folderPath: selection.folderPath }
            : { cancelled: true },
        );
      } catch {
        respondJson(response, 500, { error: 'Could not open the Windows folder picker' });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/projects') {
      const body = await readBody(request);
      const name = isString(body.name) ? body.name.trim() : '';
      const folderPath = isString(body.folderPath) ? body.folderPath.trim() : '';
      if (!name || name.length > 120) {
        respondJson(response, 400, {
          error: 'Project name is required and must be under 120 characters',
        });
        return;
      }
      if (!folderPath || folderPath.length > 500) {
        respondJson(response, 400, {
          error: 'Folder path is required and must be under 500 characters',
        });
        return;
      }
      const project = addProject(user.id, name, folderPath);
      respondJson(response, 201, { project });
      return;
    }

    const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (request.method === 'DELETE' && projectMatch) {
      const removed = deleteProject(user.id, projectMatch[1]);
      respondJson(
        response,
        removed ? 200 : 404,
        removed ? { ok: true } : { error: 'Project not found' },
      );
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    respondJson(response, message === 'Request body is too large' ? 413 : 400, { error: message });
    return;
  }

  respondJson(response, 404, { error: 'Not found' });
}

export function createServiceServer(
  version: string,
  dependencies: ServiceDependencies = {},
): Server {
  return createServer((request, response) => {
    void handleRequest(request, response, version, dependencies);
  });
}
