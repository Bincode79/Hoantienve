/**
 * Custom API client — replaces Supabase client for data operations.
 * Auth token stored in localStorage under AUTH_TOKEN_KEY.
 */

const TOKEN_KEY = 'aerorefund-auth-token';
const API_BASE = ''; // Relative URL — uses current origin

// ── Token helpers ────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core request ─────────────────────────────────────────────────────────
async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = {};
  
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    } else {
      console.warn(`[API] Expected JSON but got ${contentType}. URL: ${path}`);
    }
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Auth API ─────────────────────────────────────────────────────────────

export const authApi = {
  login: async (phone: string, password: string) => {
    return request('POST', '/api/auth/login', { phone, password });
  },

  register: async (displayName: string, phone: string, password: string) => {
    return request('POST', '/api/auth/register', { displayName, phone, password });
  },

  me: async () => {
    return request('GET', '/api/auth/me');
  },

  logout: async () => {
    return request('POST', '/api/auth/logout');
  },

  verifyToken: async (token: string) => {
    return request('POST', '/api/auth/verify-token', { token });
  },
};

export const usersApi = {
  list: async () => request('GET', '/api/users'),
  get: async (uid: string) => request('GET', `/api/users/${uid}`),
  create: async (data: any) => request('POST', '/api/users', data),
  update: async (uid: string, data: any) => request('PATCH', `/api/users/${uid}`, data),
  delete: async (uid: string) => request('DELETE', `/api/users/${uid}`),
};

export const refundsApi = {
  list: async () => request('GET', '/api/refunds'),
  get: async (id: string) => request('GET', `/api/refunds/${id}`),
  create: async (data: any) => request('POST', '/api/refunds', data),
  update: async (id: string, data: any) => request('PATCH', `/api/refunds/${id}`, data),
  delete: async (id: string) => request('DELETE', `/api/refunds/${id}`),
};

export const dataApi = {
  getConfig: async () => request('GET', '/api/data/config'),
  updateConfig: async (data: any) => request('PATCH', '/api/data/config', data),
  getBasedata: async () => request('GET', '/api/data/basedata'),
  createBasedata: async (data: any) => request('POST', '/api/data/basedata', data),
  getAirports: async () => request('GET', '/api/data/airports'),
  getAirlines: async () => request('GET', '/api/data/airlines'),
  getPopularRoutes: async () => request('GET', '/api/data/popular-routes'),
  getAuditLogs: async () => request('GET', '/api/data/audit-logs'),
  getChats: async () => request('GET', '/api/data/chats'),
  createChat: async (data?: any) => request('POST', '/api/data/chats', data ?? {}),
  getMessages: async (chatId: string) => request('GET', `/api/data/chats/${chatId}/messages`),
  sendMessage: async (chatId: string, text: string) => request('POST', `/api/data/chats/${chatId}/messages`, { text }),
};
