export interface EditorFile {
  id: string;
  path: string;
  language: string;
  content: string;
}

export interface RemoteCursor {
  clientId: number;
  userId: string;
  username: string;
  color: string;
  line: number;
  column: number;
}
