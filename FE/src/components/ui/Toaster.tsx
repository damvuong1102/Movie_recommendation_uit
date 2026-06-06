// src/components/ui/Toaster.tsx
//
// Drop this once inside your layout (or in App.tsx) and it will render all
// active toasts in the top-right corner, stacked from the top.
//
// Animation is pure CSS via Tailwind — no Motion dependency needed.

import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToast, ToastVariant } from "../../context/ToastContext";

// ─── Per-variant config ───────────────────────────────────────────────────────

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  success: {
    bg:     "bg-green-50 dark:bg-green-950/60",
    border: "border-green-200 dark:border-green-800",
    text:   "text-green-800 dark:text-green-200",
    icon:   <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
  },
  error: {
    bg:     "bg-red-50 dark:bg-red-950/60",
    border: "border-red-200 dark:border-red-800",
    text:   "text-red-800 dark:text-red-200",
    icon:   <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  },
  info: {
    bg:     "bg-blue-50 dark:bg-blue-950/60",
    border: "border-blue-200 dark:border-blue-800",
    text:   "text-blue-800 dark:text-blue-200",
    icon:   <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  },
  warning: {
    bg:     "bg-amber-50 dark:bg-amber-950/60",
    border: "border-amber-200 dark:border-amber-800",
    text:   "text-amber-800 dark:text-amber-200",
    icon:   <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    // Portal-like fixed overlay — sits above everything
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const v = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="alert"
            className={[
              // Layout
              "flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg",
              // Animation — slides in from the right, fades out on dismiss
              "animate-in slide-in-from-right-4 fade-in duration-200",
              // Pointer events back on each toast individually
              "pointer-events-auto",
              v.bg,
              v.border,
            ].join(" ")}
          >
            {/* Icon */}
            <span className="mt-0.5">{v.icon}</span>

            {/* Message */}
            <p className={`flex-1 text-sm font-medium leading-snug ${v.text}`}>
              {t.message}
            </p>

            {/* Dismiss button */}
            <button
              onClick={() => dismiss(t.id)}
              className={`shrink-0 mt-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity ${v.text}`}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
