import { useState, useRef, useEffect } from "react";
import { useNotificationStore } from "../../store/notificationStore";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clear } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) markAllRead();
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        title="Notifications"
        className="relative text-xs text-muted hover:text-ink px-2 py-1 rounded hover:bg-hover"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-danger text-white text-[9px] flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 max-h-80 overflow-y-auto bg-panel border border-border rounded-md shadow-popover z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-subtle">
            <span className="text-xs font-semibold text-ink">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clear} className="text-xs text-faint hover:text-ink">
                Clear all
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-faint">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-3 py-2 border-b border-subtle/60 last:border-0">
                <p className="text-xs text-ink leading-snug">{n.message}</p>
                <span className="text-[10px] text-faint">{timeAgo(n.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
