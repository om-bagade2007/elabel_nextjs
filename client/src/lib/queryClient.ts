import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from './auth';

let refreshPromise: Promise<string | null> | null = null;

async function refreshSessionToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session?.access_token) {
          return null;
        }
        return data.session.access_token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  let token = session?.access_token;

  // If token exists and is about to expire or already expired, proactively refresh
  if (token && session?.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    const refreshedToken = await refreshSessionToken();
    if (refreshedToken) {
      token = refreshedToken;
    }
  }

  const makeRequest = (t?: string | null) => {
    const headers = new Headers(init.headers);
    if (t) {
      headers.set('Authorization', `Bearer ${t}`);
    }
    return fetch(input, { ...init, headers, credentials: 'include' });
  };

  let res = await makeRequest(token);

  // If server returns 401 and we sent a token, try refreshing once and retry
  if (res.status === 401 && token) {
    const refreshedToken = await refreshSessionToken();
    if (refreshedToken) {
      res = await makeRequest(refreshedToken);
    } else {
      console.warn('Session has expired and could not be refreshed. Logging out.');
      try {
        await useAuth.getState().logout();
      } catch (err) {
        console.debug('Error logging out during 401 recovery:', err);
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
  }

  return res;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
  },
): Promise<any> {
  const { method = 'GET', data } = options || {};

  const res = await apiFetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  await throwIfResNotOk(res);

  if (method === 'DELETE') {
    return null;
  }

  return await res.json();
}

type UnauthorizedBehavior = 'returnNull' | 'throw';
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await apiFetch(queryKey[0] as string, {
      credentials: 'include',
    });

    if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'throw' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
