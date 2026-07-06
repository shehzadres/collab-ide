export type RecordingEventType =
  | "YJS_UPDATE"
  | "YJS_SNAPSHOT"
  | "AWARENESS"
  | "TERMINAL_OUTPUT"
  | "TERMINAL_INPUT"
  | "FILE_OPEN";

export interface RecordEventDto {
  sessionId: string;
  recordingId: string;
  type: RecordingEventType;
  fileId?: string;
  payload: Buffer;
  offsetMs: number;
}

export interface ReplayEvent {
  id: string;
  type: RecordingEventType;
  fileId: string | null;
  payload: string;
  offsetMs: number;
}
