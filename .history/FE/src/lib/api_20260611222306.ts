// src/lib/api.ts

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Token refresh failed");
  }

  const newAccessToken: string = data.data.accessToken;
  localStorage.setItem("token", newAccessToken);
  return newAccessToken;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<any> {
  const token = localStorage.getItem("token");

  const correctEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const res = await fetch(`${BASE_URL}/api${correctEndpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // ── Happy path ───────────────────────────────────────────────────────────
  if (res.ok) {
    return res.json();
  }

  // ── 401 handling ─────────────────────────────────────────────────────────
  if (res.status === 401 && !_isRetry) {
    try {
      // Share one refresh call across concurrent 401s
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;

      // Retry the original request once with the new token
      return apiFetch(endpoint, options, true);
    } catch {
      // Refresh failed — clear everything and let the app redirect to /login.
      // We dispatch a custom event so AuthContext can react without a circular
      // import between api.ts and AuthContext.tsx.
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:logout"));
      throw new Error("Session expired. Please log in again.");
    }
  }

  // ── Other errors ──────────────────────────────────────────────────────────
  let errorMessage = "API Error";
  try {
    const data = await res.json();
    errorMessage = data.message || errorMessage;
  } catch {
    // response body wasn't JSON
  }

  const error = Object.assign(new Error(errorMessage), { status: res.status });
  throw error;
}