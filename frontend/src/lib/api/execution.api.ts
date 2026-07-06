import { apiClient } from "./client";
import { useAuthStore } from "../../store/authStore";
import { WorkspaceConfig, RuntimeId } from "../../types/execution.types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const executionApi = {
  getConfig: async (sessionId: string): Promise<WorkspaceConfig> => {
    const { data } = await apiClient.get<{ config: WorkspaceConfig }>(`/execution/${sessionId}`);
    return data.config;
  },

  updateRuntime: async (sessionId: string, runtime: RuntimeId): Promise<WorkspaceConfig> => {
    const { data } = await apiClient.patch<{ config: WorkspaceConfig }>(`/execution/${sessionId}/runtime`, {
      runtime,
    });
    return data.config;
  },

  updateNetworkAccess: async (sessionId: string, networkEnabled: boolean): Promise<WorkspaceConfig> => {
    const { data } = await apiClient.patch<{ config: WorkspaceConfig }>(`/execution/${sessionId}/network`, {
      networkEnabled,
    });
    return data.config;
  },

  resetWorkspace: async (sessionId: string): Promise<void> => {
    await apiClient.post(`/execution/${sessionId}/reset`);
  },

  /**
   * Streams a one-off command's stdout/stderr as it arrives. Uses raw
   * fetch rather than axios because this is a chunked text/plain response,
   * not JSON — axios's response transformers and the shared 401-retry
   * interceptor aren't a good fit for a streaming body, so this
   * deliberately bypasses apiClient for just these two calls.
   */
  async runFile(sessionId: string, filePath: string, onChunk: (text: string) => void): Promise<void> {
    await streamPost(`/execution/${sessionId}/run`, { filePath }, onChunk);
  },

  async installPackages(sessionId: string, packages: string[], onChunk: (text: string) => void): Promise<void> {
    await streamPost(`/execution/${sessionId}/install`, { packages }, onChunk);
  },
};

async function streamPost(path: string, body: unknown, onChunk: (text: string) => void): Promise<void> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // body wasn't JSON (e.g. already started streaming text) — keep default message
    }
    throw new Error(message);
  }

  if (!response.body) {
    // Some environments (very old browsers, certain proxies) may not
    // support streaming bodies — fall back to reading the whole response.
    const text = await response.text();
    onChunk(text);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
