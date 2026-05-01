const DEFAULT_BASE_URL = "/api";

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
}

export async function apiFetch(path, options = {}) {
  const url = new URL(path, getApiBaseUrl());
  const {
    method = "GET",
    headers = {},
    body,
    signal,
    ...rest
  } = options;

  const normalizedHeaders = new Headers(headers);
  const hasBody = body !== undefined && body !== null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && !normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(url.toString(), {
    method,
    headers: normalizedHeaders,
    body: hasBody && !isFormData && typeof body !== "string" ? JSON.stringify(body) : body,
    signal,
    ...rest
  });

  const contentType = res.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && payload.error) ||
      (payload && typeof payload === "object" && payload.detail) ||
      (typeof payload === "string" && payload) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}
