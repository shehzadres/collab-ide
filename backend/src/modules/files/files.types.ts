export interface CreateFileDto {
  name: string;
  path: string;
  isFolder: boolean;
  parentId?: string | null;
  sessionId: string;
}

export interface UpdateFileDto {
  name?: string;
  content?: string;
  path?: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  parentId: string | null;
  children?: FileTreeNode[];
}
