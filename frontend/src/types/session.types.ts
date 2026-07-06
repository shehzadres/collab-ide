export type RecordingEventType =
  | "YJS_UPDATE"
  | "YJS_SNAPSHOT"
  | "AWARENESS"
  | "TERMINAL_OUTPUT"
  | "TERMINAL_INPUT"
  | "FILE_OPEN";

export interface SessionRecording {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
}

export interface ReplayEvent {
  id: string;
  type: RecordingEventType;
  fileId: string | null;
  payload: string;
  offsetMs: number;
}
