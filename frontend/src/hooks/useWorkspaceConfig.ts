import { useEffect, useState, useCallback } from "react";
import { executionApi } from "../lib/api/execution.api";
import { WorkspaceConfig, RuntimeId } from "../types/execution.types";

export function useWorkspaceConfig(sessionId: string) {
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await executionApi.getConfig(sessionId);
      setConfig(c);
      setError(null);
    } catch {
      setError("Failed to load workspace configuration.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const setRuntime = useCallback(
    async (runtime: RuntimeId) => {
      try {
        const updated = await executionApi.updateRuntime(sessionId, runtime);
        setConfig(updated);
      } catch {
        setError("Failed to change runtime. You may need OWNER permission for this session.");
      }
    },
    [sessionId]
  );

  const setNetworkEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        const updated = await executionApi.updateNetworkAccess(sessionId, enabled);
        setConfig(updated);
      } catch {
        setError("Failed to change network access. You may need OWNER permission for this session.");
      }
    },
    [sessionId]
  );

  const resetWorkspace = useCallback(async () => {
    await executionApi.resetWorkspace(sessionId);
    await load();
  }, [sessionId, load]);

  return { config, loading, error, setRuntime, setNetworkEnabled, resetWorkspace, reload: load };
}
