import type { Task, TaskCreateInput, TaskUpdateInput } from '../types';
import { getStoredToken } from '../auth/tokenStorage';
import { emitAuthLost } from '../auth/authEvents';

const API = '/api';

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...options?.headers,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new Error(
      msg.includes('fetch') || msg.includes('Failed')
        ? 'Cannot reach backend. Is it running at http://localhost:4000?'
        : msg
    );
  }
  if (res.status === 401) {
    emitAuthLost();
    const err = await res.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error((err as { error?: string }).error ?? 'Please sign in again');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface GetTasksParams {
  forDate?: string;
  fromDate?: string;
  toDate?: string;
  /** Tasks with no scheduled date */
  outstanding?: boolean;
}

export async function getTasksByRange(params: GetTasksParams = {}): Promise<Task[]> {
  const sp = new URLSearchParams();
  if (params.forDate) sp.set('forDate', params.forDate);
  if (params.fromDate) sp.set('fromDate', params.fromDate);
  if (params.toDate) sp.set('toDate', params.toDate);
  if (params.outstanding) sp.set('outstanding', 'true');
  const q = sp.toString();
  return request<Task[]>(`/tasks${q ? `?${q}` : ''}`);
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}

export async function getSettings(): Promise<{ expirationDays: number }> {
  return request<{ expirationDays: number }>('/settings');
}

export async function updateSettings(expirationDays: number): Promise<{ expirationDays: number }> {
  return request<{ expirationDays: number }>('/settings', {
    method: 'PATCH',
    body: JSON.stringify({ expirationDays }),
  });
}
