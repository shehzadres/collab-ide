import { apiClient } from "./client";
import { SessionRecording, ReplayEvent } from "../../types/session.types";

export const sessionsApi = {
  start: async (sessionId: string): Promise<{ recordingId: string; startedAt: number }> => {
    const { data } = await apiClient.post(`/sessions/${sessionId}/start`);
    return data;
  },

  stop: async (sessionId: string): Promise<SessionRecording> => {
    const { data } = await apiClient.post(`/sessions/${sessionId}/stop`);
    return data.recording;
  },

  list: async (sessionId: string): Promise<SessionRecording[]> => {
    const { data } = await apiClient.get(`/sessions/${sessionId}/recordings`);
    return data.recordings;
  },

  replay: async (recordingId: string): Promise<ReplayEvent[]> => {
    const { data } = await apiClient.get(`/sessions/recordings/${recordingId}/replay`);
    return data.events;
  },
};
