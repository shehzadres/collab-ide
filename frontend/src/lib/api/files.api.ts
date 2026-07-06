import { apiClient } from "./client";
import { FileTreeNode, CreateFilePayload } from "../../types/file.types";

export const filesApi = {
  getTree: async (sessionId: string): Promise<FileTreeNode[]> => {
    const { data } = await apiClient.get<{ tree: FileTreeNode[] }>(`/files/tree/${sessionId}`);
    return data.tree;
  },

  create: async (payload: CreateFilePayload): Promise<FileTreeNode> => {
    const { data } = await apiClient.post<{ file: FileTreeNode }>("/files", payload);
    return data.file;
  },

  rename: async (id: string, name: string): Promise<FileTreeNode> => {
    const { data } = await apiClient.patch<{ file: FileTreeNode }>(`/files/${id}`, { name });
    return data.file;
  },

  move: async (id: string, parentId: string | null, path: string): Promise<FileTreeNode> => {
    const { data } = await apiClient.patch<{ file: FileTreeNode }>(`/files/${id}/move`, { parentId, path });
    return data.file;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },

  getContent: async (id: string): Promise<{ id: string; path: string; content: string }> => {
    const { data } = await apiClient.get<{ file: { id: string; path: string; content: string } }>(`/files/${id}`);
    return data.file;
  },
};
