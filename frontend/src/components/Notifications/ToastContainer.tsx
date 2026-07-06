import { useNotificationStore } from "../../store/notificationStore";
import { Toast } from "./Toast";

export function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-72 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast notification={t} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}
