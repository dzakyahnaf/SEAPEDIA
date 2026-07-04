const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "seapedia_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function extractMessage(data) {
  if (!data || !data.detail) return "Terjadi kesalahan. Coba lagi.";
  if (typeof data.detail === "string") return data.detail;
  // Error validasi Pydantic: ambil pesan pertama yang paling informatif.
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const err = data.detail[0];
    const field = err.loc ? err.loc[err.loc.length - 1] : "";
    return field ? `${field}: ${err.msg}` : err.msg;
  }
  return "Terjadi kesalahan. Coba lagi.";
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(extractMessage(data), res.status);
  return data;
}
