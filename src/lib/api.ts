export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  folderPath: string;
  createdAt: string;
};

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function serviceErrorMessage(status: number, hasJsonPayload = true) {
  if (
    status === 0 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    (status === 500 && !hasJsonPayload)
  ) {
    return 'Local service is unavailable. Start the app with npm run dev.';
  }
  if (status >= 500)
    return 'Local service could not complete the request. Check its terminal output.';
  return 'Something went wrong';
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(serviceErrorMessage(0), 0);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json().catch(() => ({}))) as { error?: string } & T)
    : ({} as { error?: string } & T);
  if (!response.ok) {
    throw new ApiError(
      payload.error ??
        serviceErrorMessage(response.status, contentType.includes('application/json')),
      response.status,
    );
  }
  return payload;
}

export const api = {
  me: () => request<{ user: User }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/register', { method: 'POST', body: { email, password } }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  listProjects: () => request<{ projects: Project[] }>('/api/projects'),
  pickProjectFolder: () =>
    request<{ folderPath: string } | { cancelled: true }>('/api/projects/pick-folder', {
      method: 'POST',
    }),
  addProject: (name: string, folderPath: string) =>
    request<{ project: Project }>('/api/projects', {
      method: 'POST',
      body: { name, folderPath },
    }),
  deleteProject: (id: string) =>
    request<{ ok: true }>(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
