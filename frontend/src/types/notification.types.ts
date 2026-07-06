export type NotificationKind = "info" | "success" | "warning" | "error" | "mention";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  message: string;
  createdAt: number;
  read: boolean;
  /** Optional: which session this relates to, for click-through navigation. */
  sessionId?: string;
}
