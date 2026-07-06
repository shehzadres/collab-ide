import { useCallback } from "react";
import { sessionsApi } from "../lib/api/sessions.api";
import { useSessionStore } from "../store/sessionStore";

export function useSessionRecording(sessionId: string) {
  const { isRecording, activeRecordingId, setRecording } = useSessionStore();

  const start = useCallback(async () => {
    try {
      const { recordingId } = await sessionsApi.start(sessionId);
      setRecording(recordingId);
    } catch (err) {
      alert("You don't have permission to start a recording for this session.");
    }
  }, [sessionId, setRecording]);

  const stop = useCallback(async () => {
    try {
      await sessionsApi.stop(sessionId);
    } finally {
      setRecording(null);
    }
  }, [sessionId, setRecording]);

  return { isRecording, activeRecordingId, start, stop };
}
