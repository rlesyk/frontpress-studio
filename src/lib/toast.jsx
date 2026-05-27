import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Bottom-right toast stack. Each toast slides in from the right, lingers for
// `duration` ms, then slides out. Identity is by id so re-renders don't
// re-trigger the entry animation; new toasts stack atop existing ones.
//
// Optional `action: { label, onClick }` renders a button beside the message
// (e.g. Undo on a soft-delete). The button's callback also dismisses the
// toast unless it returns false.

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, { tone = 'success', duration = 2400, action, copyText } = {}) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, tone, duration, action, copyText }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {createPortal(<ToastStack toasts={toasts} onDismiss={dismiss} />, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  // Two-step animation: render hidden (translate-x), then flip to visible on
  // the next frame so CSS picks up the transition.
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const tones = {
    success: 'bg-zinc-900 text-white',
    error:   'bg-red-600 text-white',
    info:    'bg-zinc-700 text-white',
  };

  const hasAction = !!toast.action;
  // Errors get copy-on-click so the user can paste long stack traces /
  // API responses elsewhere. The toast stays visible after copy so the
  // user can read it; a separate × button dismisses.
  const copyable = toast.tone === 'error' && !hasAction;

  function handleAction(e) {
    e.stopPropagation();
    const result = toast.action.onClick();
    // Dismiss unless the handler explicitly returned false (e.g. error path
    // that wants the toast to stay visible while it retries).
    if (result !== false) onDismiss();
  }

  async function handleBodyClick() {
    if (copyable) {
      // Prefer the explicit copyText if the caller supplied one (e.g. the
      // full original GitHub error when we're showing a short summary).
      const raw = toast.copyText ?? toast.message;
      const text = typeof raw === 'string' ? raw : String(raw);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        // Reset the "Copied ✓" label after a moment, but DON'T dismiss —
        // the user wants the message visible so they can read or recopy.
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard API can fail (insecure context, denied permissions).
        // Don't dismiss either — the message is still useful on-screen.
      }
      return;
    }
    if (!hasAction) onDismiss();
  }

  function handleDismissClick(e) {
    e.stopPropagation();
    onDismiss();
  }

  return (
    <div
      onClick={hasAction ? undefined : handleBodyClick}
      title={copyable ? 'Click to copy details' : undefined}
      className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-md px-3.5 py-2 text-[13px] font-medium shadow-modal transition-all duration-200 ${
        hasAction ? '' : 'cursor-pointer'
      } ${tones[toast.tone] || tones.success} ${shown ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
      role="status"
    >
      <span className="min-w-0 flex-1">{copied ? 'Copied ✓' : toast.message}</span>
      {hasAction && (
        <button
          type="button"
          onClick={handleAction}
          className="shrink-0 rounded px-2 py-1 text-[12px] font-semibold underline decoration-white/50 underline-offset-2 hover:bg-white/10 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {toast.action.label}
        </button>
      )}
      {copyable && (
        <button
          type="button"
          onClick={handleDismissClick}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
