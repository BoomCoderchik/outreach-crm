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

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new ApiError(payload.error ?? 'Something went wrong', response.status);
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
  addProject: (name: string, folderPath: string) =>
    request<{ project: Project }>('/api/projects', {
      method: 'POST',
      body: { name, folderPath },
    }),
  deleteProject: (id: string) =>
    request<{ ok: true }>(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
