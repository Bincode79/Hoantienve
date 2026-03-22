// File: src/mockFirebase.ts
// Provides a Firebase-like API backed by the Express server API.
// Replaces Supabase direct calls.

export const db = {};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'aerorefund-auth-token';
const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function apiHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  try {
    const fullPath = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(fullPath, {
      ...options,
      headers: {
        ...apiHeaders(),
        ...options.headers,
      },
    });
    
    if (res.status === 204) return { success: true };
    
    // Attempt to parse JSON instead of failing hard.
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data?.error || `API Error: ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[apiFetch] ${options.method || 'GET'} ${path} error:`, err);
    throw err;
  }
}

// Sync auth.currentUser from localStorage
let _authUser: any = null;

function loadAuthUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      _authUser = JSON.parse(raw);
    } else {
      _authUser = null;
    }
  } catch {
    _authUser = null;
  }
}

loadAuthUser();

export const auth = {
  get currentUser() {
    return _authUser;
  },
};

export const signInWithEmailAndPassword = async (_auth: any, emailOrPhone: string, pass: string) => {
  // Determine if it's a mock email or direct phone
  let loginId = emailOrPhone.trim();
  if (emailOrPhone.startsWith('phone_') && emailOrPhone.endsWith('@aerorefund.com')) {
    loginId = emailOrPhone.split('_')[1].split('@')[0];
  } else if (emailOrPhone.includes('@app.aerorefund.local')) {
    loginId = emailOrPhone.split('@')[0];
  }

  const result = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      phone: loginId,
      password: pass,
    }),
  });

  if (result.token) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem('auth_user', JSON.stringify(result.user));
    _authUser = result.user;
    window.dispatchEvent(new Event('aerorefund-auth-change'));
  }

  return { user: result.user };
};

export const onAuthStateChanged = (_auth: any, callback: (user: any) => void) => {
  const handleStorage = () => {
    loadAuthUser();
    callback(_authUser);
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener('aerorefund-auth-change', handleStorage);
  // Initial callback
  callback(_authUser);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('aerorefund-auth-change', handleStorage);
  };
};

export const signOut = async (_auth: any) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('auth_user');
  _authUser = null;
  window.dispatchEvent(new Event('aerorefund-auth-change'));
  // Force reload to clear state
  if (typeof window !== 'undefined') window.location.reload();
};

export const createUserWithEmailAndPassword = async (
  _auth: any,
  phone: string,
  pass: string,
  displayName = 'New User',
) => {
  const result = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      displayName,
      phone,
      password: pass,
    }),
  });

  if (result.token) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem('auth_user', JSON.stringify(result.user));
    _authUser = result.user;
    window.dispatchEvent(new Event('aerorefund-auth-change'));
  }

  return { user: result.user };
};

export const updateProfile = async (user: any, profileUpdates: any) => {
  const uid = user?.uid || _authUser?.uid;
  if (!uid) throw new Error('No user authenticated');

  const result = await apiFetch(`/api/users/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ displayName: profileUpdates.displayName }),
  });

  // Update local storage if current user
  if (_authUser && _authUser.uid === uid) {
    const updated = { ..._authUser, displayName: profileUpdates.displayName };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    _authUser = updated;
    window.dispatchEvent(new Event('aerorefund-auth-change'));
  }
  
  return result;
};

export const adminUpdateUserAuth = async (_uid: string, _newEmail?: string, _newPassword?: string) => {
  const body: any = {};
  if (_newPassword) body.password = _newPassword;
  if (_newEmail) body.email = _newEmail;
  await apiFetch(`/api/users/${_uid}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

export const adminCreateUser = async (payload: any) => {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// ─── Firestore-like helpers ───────────────────────────────────────────────────

export const serverTimestamp = () => new Date().toISOString();
export const Timestamp = {
  fromDate: (date: Date) => date.toISOString(),
  now: () => new Date().toISOString(),
};

// Convert camelCase → snake_case (e.g. userId → user_id)
const toSnake = (str: string) => str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);

const toSnakeCase = (obj: any, table?: string) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = {};
  for (const key in obj) {
    let newKey = toSnake(key);
    if (table === 'users' && key === 'uid') newKey = 'id';
    result[newKey] = obj[key];
  }
  return result;
};

// Convert snake_case → camelCase
const fromSnakeCase = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
    let value = obj[key];

    // Convert ISO date strings to Firebase Timestamp-like objects
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      value = Object.assign(new String(value), {
        toDate: () => date,
        toMillis: () => date.getTime(),
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1e6,
        toISOString: () => value,
        toString: () => value,
      });
    }

    result[camelKey] = value;
  }
  return result;
};

// Normalize table name
const resolveTable = (path: string, ...segments: string[]) => {
  const full = [path, ...segments].join('_').replace(/^_/, '');

  if (full.includes('refund_requests') || full === 'refundRequests') return 'refunds';
  if (full.includes('users') || full === 'user') return 'users';
  if (full === 'config') return 'data/config';
  if (full === 'basedata' || full.includes('basedata')) return 'data/basedata';
  if (full === 'audit_logs' || full.includes('audit_logs') || full === 'adminAuditLog') return 'data/audit-logs';

  if (full.startsWith('chats_')) {
    const parts = full.split('_');
    if (parts.length >= 3 && parts[parts.length - 1] === 'messages') {
      const chatId = parts[1];
      return `data/chats/${chatId}/messages`;
    }
    if (parts.length >= 2 && parts[1] !== 'messages') {
      return 'data/chats';
    }
  }

  if (full.startsWith('data_') || full.startsWith('data/')) {
    return full.replace(/^data_/, 'data/').replace(/_/g, '/');
  }

  return full;
};

export const doc = (_db: any, path: string, ...segments: string[]) => {
  const parts = [path, ...segments];
  const id = parts.pop() || '';
  const table = resolveTable('', ...parts);
  return { id, table };
};

export const collection = (_db: any, path: string, ...segments: string[]) => {
  if (path === 'chats' && segments.length >= 2) {
    const chatId = segments[0];
    const sub = segments[1];
    if (sub === 'messages') {
      return { table: `data/chats/${chatId}/messages`, chatId };
    }
  }
  const table = resolveTable(path, ...segments);
  return { table };
};

export const getDoc = async (docRef: any) => {
  const path = docRef.table === 'data/config'
    ? '/api/data/config'
    : `/api/${docRef.table}/${docRef.id}`;
  const raw = await apiFetch(path);
  const data = raw?.config ?? raw?.item ?? raw?.user ?? raw?.refund ?? raw;
  const d = fromSnakeCase(data);
  if (docRef.table?.includes('users') && d?.uid == null && d?.id != null) {
    d.uid = d.id;
  }
  return {
    exists: () => !!d && Object.keys(d).length > 0,
    data: () => d,
    id: docRef.id,
  };
};

export const setDoc = async (docRef: any, data: any, _options?: any) => {
  const snakeData = toSnakeCase(data, docRef.table);
  if (docRef.table === 'data/config') {
    await apiFetch('/api/data/config', {
      method: 'PATCH',
      body: JSON.stringify(snakeData),
    });
    return;
  }
  if (docRef.id && docRef.id.length > 20) {
    await apiFetch(`/api/${docRef.table}/${docRef.id}`, {
      method: 'PATCH',
      body: JSON.stringify(snakeData),
    });
  } else {
    await apiFetch(`/api/${docRef.table}`, {
      method: 'POST',
      body: JSON.stringify(snakeData),
    });
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  const snakeData = toSnakeCase(data, docRef.table);
  if (docRef.table === 'data/config') {
    await apiFetch('/api/data/config', {
      method: 'PATCH',
      body: JSON.stringify(snakeData),
    });
    return;
  }
  await apiFetch(`/api/${docRef.table}/${docRef.id}`, {
    method: 'PATCH',
    body: JSON.stringify(snakeData),
  });
};

export const addDoc = async (colRef: any, data: any) => {
  const snakeData = toSnakeCase(data, colRef.table);
  const result = await apiFetch(`/api/${colRef.table}`, {
    method: 'POST',
    body: JSON.stringify(snakeData),
  });
  return { id: result.id || result?.data?.id || crypto.randomUUID() };
};

export const deleteDoc = async (docRef: any) => {
  await apiFetch(`/api/${docRef.table}/${docRef.id}`, { method: 'DELETE' });
};

export const where = (field: string, op: string, value: any) => {
  return { type: 'where', field: toSnake(field), op, value };
};

export const orderBy = (field: string, dir: string) => {
  return { type: 'orderBy', field: toSnake(field), dir };
};

export const query = (colRef: any, ...constraints: any[]) => {
  const finalConstraints = [...constraints];
  if (colRef.chatId) {
    finalConstraints.push(where('chatId', '==', colRef.chatId));
  }
  return { ...colRef, constraints: finalConstraints };
};

export const getDocs = async (q: any) => {
  let path = `/api/${q.table}`;
  const params = new URLSearchParams();

  if (q.chatId) {
    params.append('chatId', q.chatId);
  }

  if (q.constraints) {
    for (const c of q.constraints) {
      if (c.type === 'where') params.append(c.field, String(c.value));
      if (c.type === 'orderBy') params.append('_orderBy', c.field);
      if (c.type === 'orderBy') params.append('_orderDir', c.dir);
    }
  }

  if (params.size > 0) path += '?' + params.toString();

  let data: any[] = [];

  try {
    const result = await apiFetch(path);
    if (Array.isArray(result)) {
      data = result;
    } else {
      const key = q.table?.split('/').pop() || '';
      const candidate = result[key] || result.requests || result.users || result.refunds
        || result.logs || result.messages || result.config || result.basedata
        || result.airports || result.airlines || result.routes || result.chats
        || result.data || [];
      data = Array.isArray(candidate) ? candidate : (candidate ? [candidate] : []);
    }
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
      console.warn('[getDocs] Not authenticated, returning empty results');
    } else {
      console.warn('[getDocs] Error:', err?.message);
    }
  }

  return {
    docs: data.map((item: any) => {
      const d = fromSnakeCase(item);
      if (q.table?.includes('users') && d?.uid == null && d?.id != null) {
        d.uid = d.id;
      }
      return { id: item.id, data: () => d };
    }),
    empty: data.length === 0,
    size: data.length,
  };
};

export const onSnapshot = (q: any, callback: any) => {
  let alive = true;
  const pull = () => {
    if (!alive) return;
    getDocs(q).then(r => callback(r));
  };
  pull();
  const pollMs = 10_000;
  const poll = typeof window !== 'undefined' ? window.setInterval(pull, pollMs) : 0;
  return () => {
    alive = false;
    if (typeof window !== 'undefined') window.clearInterval(poll);
  };
};

export const writeBatch = (_db: any) => {
  const ops: Array<() => Promise<void>> = [];
  return {
    update: (docRef: any, data: any) => ops.push(() => updateDoc(docRef, data)),
    delete: (docRef: any) => ops.push(() => deleteDoc(docRef)),
    set: (docRef: any, data: any) => ops.push(() => setDoc(docRef, data)),
    commit: async () => { for (const op of ops) await op(); },
  };
};

export type FirebaseUser = any;
