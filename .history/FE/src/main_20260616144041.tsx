// src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Toaster } from "./components/ui/Toaster";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <themeProvider>
  <ToastProvider>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </ToastProvider>
);
