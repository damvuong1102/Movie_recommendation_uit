// src/lib/api.ts

const BASE_URL = "https://movie4you-hqf0.onrender.com").replace(/\/$/, "");

let refreshPromise: Promise<string> | null = null;

function shouldAttachAuth(endpoint: string, method: string) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const normalizedMethod = method.toUpperCase();

  if (normalizedEndpoint.startsWith("/auth/login") || normalizedEndpoint.startsWith("/auth/register")) {
    return false;
  }

  if (
    normalizedMethod === "GET" &&
    (normalizedEndpoint.startsWith("/movies") ||
      normalizedEndpoint.startsWith("/genres") ||
      normalizedEndpoint.startsWith("/recommendations"))
  ) {
    return false;
  }

  return true;
}

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
  const method = options.method || "GET";
  const includeAuth = shouldAttachAuth(correctEndpoint, method);

  const res = await fetch(`${BASE_URL}/api${correctEndpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(includeAuth && token ? { Authorization: `Bearer ${token}` } : {}),
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

      return apiFetch(endpoint, options, true);
    } catch {
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
  }

  const error = Object.assign(new Error(errorMessage), { status: res.status });
  throw error;
}
