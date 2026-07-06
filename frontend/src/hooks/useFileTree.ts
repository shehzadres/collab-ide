import { useEffect, useCallback, useRef } from "react";
import { filesApi } from "../lib/api/files.api";
import { useFileStore } from "../store/fileStore";
import { CreateFilePayload } from "../types/file.types";

export function useFileTree(sessionId: string) {
  const { tree, setTree, upsertNode, removeNode } = useFileStore();
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const load = useCallback(async () => {
    const requestedSessionId = sessionId;
    const data = await filesApi.getTree(requestedSessionId);
    if (sessionIdRef.current === requestedSessionId) {
      setTree(data);
    }
  }, [sessionId, setTree]);

  useEffect(() => {
    load();
  }, [load]);

  const createNode = useCallback(
    async (payload: CreateFilePayload) => {
      const node = await filesApi.create(payload);
      upsertNode(node);
      return node;
    },
    [upsertNode]
  );

  const deleteNode = useCallback(
    async (id: string) => {
      await filesApi.remove(id);
      removeNode(id);
    },
    [removeNode]
  );

  const renameNode = useCallback(
    async (id: string, name: string) => {
      await filesApi.rename(id, name);
      await load();
    },
    [load]
  );

  return { tree, createNode, deleteNode, renameNode, reload: load };
}
