const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';
const runtimeDefaultApiBaseUrl =
  typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:4000' : '';

const API_BASE_URL = envApiBaseUrl || runtimeDefaultApiBaseUrl;
const API_TIMEOUT_MS = 15000;

const buildUrl = (path: string): string => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};

export const apiFetch = (path: string, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort('Request timed out'), API_TIMEOUT_MS);

  return fetch(buildUrl(path), {
    ...init,
    signal: controller.signal,
  }).finally(() => {
    window.clearTimeout(timeoutId);
  });
};

export const getAuthHeaders = (includeContentType = false): HeadersInit => {
  const token = localStorage.getItem('token');

  return {
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
