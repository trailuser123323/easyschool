const FALLBACK_API_URL = "http://localhost:5000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || FALLBACK_API_URL
).replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function getAuthToken() {
  return localStorage.getItem("token") || "";
}

export function authHeaders(headers = {}) {
  const token = getAuthToken();
  return token
    ? {
        ...headers,
        Authorization: `Bearer ${token}`,
      }
    : headers;
}
