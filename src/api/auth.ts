import { apiFetch, setToken } from './client';
import type { User } from '../types';

export async function register(email: string, password: string) {
  return apiFetch<{ id: string; email: string; verification_token: string }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

export async function login(email: string, password: string): Promise<string> {
  const data = await apiFetch<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.access_token;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/users/me');
}
