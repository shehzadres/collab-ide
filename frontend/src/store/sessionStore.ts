import { create } from "zustand";

interface SessionState {
  isRecording: boolean;
  activeRecordingId: string | null;
  setRecording: (recordingId: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isRecording: false,
  activeRecordingId: null,
  setRecording: (recordingId) =>
    set({ isRecording: !!recordingId, activeRecordingId: recordingId }),
}));
