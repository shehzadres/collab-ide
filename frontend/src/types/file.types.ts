export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  parentId: string | null;
  children?: FileTreeNode[];
}

export interface CreateFilePayload {
  name: string;
  path: string;
  isFolder: boolean;
  parentId?: string | null;
  sessionId: string;
}
