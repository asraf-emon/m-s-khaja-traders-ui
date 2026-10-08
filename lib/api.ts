import { API_URL } from './shop';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

type ApiEnvelope<T> = { success: boolean; message: string; data: T; error?: unknown };

export async function api<T>(path: string, options: {
  method?: string;
  body?: unknown;
  token?: string | null;
  form?: FormData;
} = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (!options.form) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body || options.form ? 'POST' : 'GET'),
      headers,
      body: options.form ?? (options.body ? JSON.stringify(options.body) : undefined),
    });
  } catch {
    throw new ApiError('Network error. Check that the API is running.', 0);
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !json?.success) {
    throw new ApiError(json?.message || 'Request failed', response.status, json?.error);
  }
  return json.data;
}

export async function authorizedBlob(path: string, token: string) {
  const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ApiError('Could not open the file', response.status);
  return response.blob();
}
