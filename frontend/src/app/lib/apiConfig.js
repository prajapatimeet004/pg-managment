function normalizeBaseUrl(raw, fallback) {
  const value = (raw || fallback || "").trim();
  if (!value) return fallback;

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/+$/, "");
  }

  return `https://${value.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL,
  "http://127.0.0.1:8000"
);

export const AUTH_API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_AUTH_API_URL,
  "http://127.0.0.1:3000"
);

export function getWebSocketUrl(baseUrl = API_BASE_URL) {
  const wsBase = baseUrl.replace(/^http/i, "ws");
  return `${wsBase}/ws`;
}

export function buildApiUrl(path, baseUrl = API_BASE_URL) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${baseUrl}/`).toString();
}
