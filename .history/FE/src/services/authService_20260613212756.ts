// src/services/authService.ts
import { apiFetch } from "../lib/api";

export async function login(username: string, password: string) {
 
  if (username === "admin" && password === "admin123") {
    const mockAdminResponse = {
      success: true,
      message: "Mock Login Successful",
      data: {
        accessToken: "mock-access-token-for-admin-demo-only",
        refreshToken: "mock-refresh-token-for-admin-demo-only",
        user: {
          id: "admin-id-001",
          username: "admin",
          displayName: "Quản Trị Viên (Demo)",
          role: "ROLE_ADMIN" 
        }
      }
    };

    localStorage.setItem("token", mockAdminResponse.data.accessToken);
    localStorage.setItem("refreshToken", mockAdminResponse.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(mockAdminResponse.data.user));

    return mockAdminResponse;
  }
  // ──────────────────────────────────────────────────────────────────────────

  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  return apiFetch("/auth/logout", { method: "POST" }).catch(() => {
  });
}