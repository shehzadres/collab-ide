import { create } from "zustand";
import { AppNotification, NotificationKind } from "../types/notification.types";

const MAX_NOTIFICATIONS = 50;
const TOAST_AUTO_DISMISS_MS = 5000;

interface NotificationState {
  notifications: AppNotification[];
  toasts: AppNotification[];
  unreadCount: number;
  push: (kind: NotificationKind, message: string, sessionId?: string) => void;
  markAllRead: () => void;
  dismissToast: (id: string) => void;
  clear: () => void;
}

function makeId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,

  push: (kind, message, sessionId) => {
    const notification: AppNotification = {
      id: makeId(),
      kind,
      message,
      createdAt: Date.now(),
      read: false,
      sessionId,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
      toasts: [...state.toasts, notification],
      unreadCount: state.unreadCount + 1,
    }));

    setTimeout(() => {
      get().dismissToast(notification.id);
    }, TOAST_AUTO_DISMISS_MS);
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clear: () => set({ notifications: [], toasts: [], unreadCount: 0 }),
}));
