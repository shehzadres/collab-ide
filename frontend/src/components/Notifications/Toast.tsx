import { AppNotification } from "../../types/notification.types";

interface ToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const KIND_STYLES: Record<AppNotification["kind"], string> = {
  info: "border-info/40 bg-info/10 text-info",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  error: "border-danger/40 bg-danger/10 text-danger",
  mention: "border-purple-500/40 bg-purple-500/10 text-purple-200",
};

export function Toast({ notification, onDismiss }: ToastProps) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-3 py-2 rounded-md border text-xs shadow-popover ${KIND_STYLES[notification.kind]}`}
      role="status"
    >
      <span className="leading-snug">{notification.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="opacity-60 hover:opacity-100 flex-shrink-0"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
