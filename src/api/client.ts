// VULNERABILITY (Insecure Token Storage): The JWT is stored in localStorage,
// which is accessible to any JavaScript executing on this page. If an attacker
// injects a script (e.g. via the stored XSS in TicketDetail), they can steal
// the token with a single localStorage.getItem('token') call.
// Fix: use httpOnly, Secure, SameSite=Strict cookies managed server-side.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail || body.error || `HTTP ${res.status}`;
    throw new Error(Array.isArray(message) ? message[0]?.msg ?? String(message) : String(message));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
