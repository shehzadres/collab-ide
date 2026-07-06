import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFileTree } from "../../hooks/useFileTree";
import { SessionReplay } from "./SessionReplay";
import { FileTreeNode } from "../../types/file.types";

interface ReplayRouteProps {
  sessionId: string;
  recordingId: string;
}

export function ReplayRoute({ sessionId, recordingId }: ReplayRouteProps) {
  const { tree } = useFileTree(sessionId);
  const navigate = useNavigate();
  const [activeFile, setActiveFile] = useState<FileTreeNode | null>(null);

  function findFirstFile(nodes: FileTreeNode[]): FileTreeNode | null {
    for (const node of nodes) {
      if (!node.isFolder) return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  const effectiveFile = activeFile ?? findFirstFile(tree);

  if (!effectiveFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-faint text-sm">
        No files recorded in this session yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-3 py-2 bg-panel border-b border-subtle">
        <select
          value={effectiveFile.id}
          onChange={(e) => {
            const flat = flattenFiles(tree);
            const node = flat.find((n) => n.id === e.target.value);
            if (node) setActiveFile(node);
          }}
          className="text-xs bg-hover text-ink rounded px-2 py-1"
        >
          {flattenFiles(tree).map((f) => (
            <option key={f.id} value={f.id}>
              {f.path}
            </option>
          ))}
        </select>
        <button
          onClick={() => navigate(`/workspace/${sessionId}`)}
          className="text-xs text-muted hover:text-ink"
        >
          Exit replay
        </button>
      </div>
      <SessionReplay
        recordingId={recordingId}
        activeFileId={effectiveFile.id}
        activeFilePath={effectiveFile.path}
      />
    </div>
  );
}

function flattenFiles(nodes: FileTreeNode[]): FileTreeNode[] {
  const result: FileTreeNode[] = [];
  for (const node of nodes) {
    if (!node.isFolder) result.push(node);
    if (node.children) result.push(...flattenFiles(node.children));
  }
  return result;
}
