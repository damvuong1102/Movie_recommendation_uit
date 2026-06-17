// src/routes/ProtectedRoute.tsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div
            className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin"
          />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  // }

  return <>{children}</>;
}
