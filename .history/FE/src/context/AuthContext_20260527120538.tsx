// src/context/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type User = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  /** True while we are reading localStorage on first mount. */
  initializing: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true); // ← new

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const storedUser  = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        // Corrupt localStorage — clear it
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    }

    // Finished reading localStorage — ProtectedRoute can now make a decision
    setInitializing(false);
  }, []);

  // ── Listen for forced logout dispatched by apiFetch on refresh failure ────
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
      // State is already cleared in localStorage by apiFetch before the event
    };

    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  // ── login / logout ────────────────────────────────────────────────────────

  const login = (userData: User, accessToken: string, refreshToken?: string) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("user",  JSON.stringify(userData));
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Always clear local state, even if the server call fails
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        initializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
