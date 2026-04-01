const FALLBACK_API_URL = "http://localhost:5000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || FALLBACK_API_URL
).replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function resolveApiAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return apiUrl(path);
  return apiUrl(`/${path}`);
}
