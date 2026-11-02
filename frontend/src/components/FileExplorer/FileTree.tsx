import { FilePlus, FolderPlus, FolderOpen, FileCode2 } from "lucide-react";
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

  const handleDelete = async (node: FileTreeNode) => {
    await deleteNode(node.id);
  };

  const handleRename = async (node: FileTreeNode, name: string) => {
    await renameNode(node.id, name);
  };

  return (
    <aside className="ide-sidebar">
      <div className="ide-sidebar-heading">
        <div>
          <span className="ide-sidebar-overline">PROJECT</span>
          <strong>Explorer</strong>
        </div>
        {canEdit && (
          <div className="ide-sidebar-actions">
            <button type="button" onClick={() => handleCreateRoot(false)} title="New file" aria-label="New file">
              <FilePlus size={16} />
            </button>
            <button type="button" onClick={() => handleCreateRoot(true)} title="New folder" aria-label="New folder">
              <FolderPlus size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="ide-tree-caption">
        <span>WORKSPACE FILES</span>
        <span>{tree.length.toString().padStart(2, "0")}</span>
      </div>

      <div className="ide-tree-scroll">
        {tree.length === 0 ? (
          <div className="ide-tree-empty">
            <span className="ide-tree-empty-icon"><FolderOpen size={22} strokeWidth={1.5} /></span>
            <strong>No files yet</strong>
            <p>Your project starts with a file.</p>
            {canEdit && (
              <button type="button" onClick={() => handleCreateRoot(false)}>
                <FileCode2 size={14} /> Create a file
              </button>
            )}
          </div>
        ) : (
          <div className="ide-file-tree">
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

      <div className="ide-sidebar-footer">
        <span className="ide-sidebar-footer-dot" />
        <span>{canEdit ? "You can edit this workspace" : "Read-only access"}</span>
      </div>
    </aside>
  );
}
