import { FilePlus, FolderPlus, FolderOpen } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { useFileTree } from "../../hooks/useFileTree";
import { useSessionRole } from "../../hooks/useSessionRole";
import { useNotificationStore } from "../../store/notificationStore";
import { FileNode } from "./FileNode";
import { FileTreeNode } from "../../types/file.types";
import { getLanguageFromPath } from "../../lib/editor/languageMap";
import { filesApi } from "../../lib/api/files.api";

interface FileTreeProps {
  sessionId: string;
}

export function FileTree({ sessionId }: FileTreeProps) {
  const { tree, createNode, deleteNode, renameNode } = useFileTree(sessionId);
  const { openFile } = useEditorStore();
  const pushNotification = useNotificationStore((s) => s.push);
  // Mirrors the backend's actual enforcement (requireFileSessionRole("EDITOR")
  // on files.routes.ts) — this only hides buttons that would otherwise fail
  // server-side; it isn't itself the security boundary.
  const { hasAtLeast } = useSessionRole(sessionId);
  const canEdit = hasAtLeast("EDITOR");

  const handleSelectFile = async (node: FileTreeNode) => {
    try {
      const file = await filesApi.getContent(node.id);
      openFile({
        id: file.id,
        path: file.path,
        language: getLanguageFromPath(file.path),
        content: file.content,
      });
    } catch {
      pushNotification("error", `Could not open "${node.name}"`);
    }
  };

  function uniqueName(base: string, isFolder: boolean, siblings: FileTreeNode[]): string {
    const existingNames = new Set(siblings.map((s) => s.name));
    if (!existingNames.has(base)) return base;

    const ext = isFolder ? "" : base.includes(".") ? base.slice(base.lastIndexOf(".")) : "";
    const stem = isFolder ? base : base.slice(0, base.length - ext.length);
    let i = 2;
    let candidate = `${stem}-${i}${ext}`;
    while (existingNames.has(candidate)) {
      i += 1;
      candidate = `${stem}-${i}${ext}`;
    }
    return candidate;
  }

  const handleCreateChild = async (parent: FileTreeNode, isFolder: boolean) => {
    const base = isFolder ? "new-folder" : "new-file.ts";
    const name = uniqueName(base, isFolder, parent.children ?? []);
    await createNode({
      name,
      path: `${parent.path}/${name}`,
      isFolder,
      parentId: parent.id,
      sessionId,
    });
  };

  const handleCreateRoot = async (isFolder: boolean) => {
    const base = isFolder ? "new-folder" : "new-file.ts";
    const name = uniqueName(base, isFolder, tree);
    await createNode({
      name,
      path: `/${name}`,
      isFolder,
      parentId: null,
      sessionId,
    });
  };

  // Deletion confirmation now lives inline in FileNode itself (an armed,
  // two-click "confirm" state on the trash icon) rather than here — a native
  // confirm() dialog renders in OS chrome and breaks the editor's visual
  // frame, so the confirmation step needed to move into the row itself.
  const handleDelete = async (node: FileTreeNode) => {
    await deleteNode(node.id);
  };

  const handleRename = async (node: FileTreeNode, name: string) => {
    await renameNode(node.id, name);
  };

  return (
    <div className="w-60 h-full bg-panel border-r border-subtle flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-subtle">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">Explorer</span>
        {canEdit && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleCreateRoot(false)}
              className="flex items-center justify-center w-5 h-5 rounded text-faint hover:text-accent hover:bg-accent/10 transition-colors"
              title="New file"
            >
              <FilePlus size={13} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => handleCreateRoot(true)}
              className="flex items-center justify-center w-5 h-5 rounded text-faint hover:text-accent hover:bg-accent/10 transition-colors"
              title="New folder"
            >
              <FolderPlus size={13} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {tree.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <FolderOpen size={22} strokeWidth={1.5} className="text-faint" />
          <p className="text-xs text-faint">No files yet</p>
          {canEdit && (
            <button
              type="button"
              onClick={() => handleCreateRoot(false)}
              className="text-xs text-accent hover:underline"
            >
              Create your first file
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 py-1">
          {tree.map((node) => (
            <FileNode
              key={node.id}
              node={node}
              depth={0}
              canEdit={canEdit}
              onSelectFile={handleSelectFile}
              onCreateChild={handleCreateChild}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
