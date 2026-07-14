const FALLBACK_API_URL = "http://localhost:5000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || FALLBACK_API_URL
).replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function authFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const opts = { ...options, headers };
  const res = await fetch(path, opts);

  // Surface 401 so callers can handle re-authentication if needed
  if (res.status === 401) {
    try {
      // clear stored user/token on auth failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
  }

  return res;
}

export function resolveApiAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("data:")) return path;

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (url.pathname.startsWith("/uploads/")) {
        return apiUrl(url.pathname);
      }
      return path;
    } catch {
      return path;
    }
  }

  if (path.startsWith("/")) return apiUrl(path);
  return apiUrl(`/${path}`);
}
