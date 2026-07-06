import { useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { FileTreeNode } from "../../types/file.types";
import { useFileStore } from "../../store/fileStore";

interface FileNodeProps {
  node: FileTreeNode;
  depth: number;
  canEdit: boolean;
  onSelectFile: (node: FileTreeNode) => void;
  onCreateChild: (parent: FileTreeNode, isFolder: boolean) => void;
  onDelete: (node: FileTreeNode) => void;
  onRename: (node: FileTreeNode, name: string) => void;
}

const ICON_SIZE = 14;

// A small square icon-button used for row-level actions (new file, rename,
// delete, ...). Kept local to this file since its hover/active treatment is
// specific to the tight row height of a tree — a generic IconButton would
// need its own sizing variant to look right here anyway.
function RowAction({
  title,
  onClick,
  tone = "default",
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  tone?: "default" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "danger"
      ? "hover:text-danger hover:bg-danger/10"
      : tone === "warning"
        ? "hover:text-warning hover:bg-warning/10"
        : "hover:text-accent hover:bg-accent/10";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-5 h-5 rounded text-faint transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function FileNode({ node, depth, canEdit, onSelectFile, onCreateChild, onDelete, onRename }: FileNodeProps) {
  const { expanded, toggleExpanded } = useFileStore();
  const isOpen = expanded.has(node.id);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(node.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleClick = () => {
    if (node.isFolder) {
      toggleExpanded(node.id);
    } else {
      onSelectFile(node);
    }
  };

  const submitRename = () => {
    setRenaming(false);
    if (nameInput.trim() && nameInput !== node.name) {
      onRename(node, nameInput.trim());
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      // Auto-cancel the pending confirmation so a stray click on the row
      // later doesn't land on an armed delete button.
      window.setTimeout(() => setConfirmingDelete(false), 2500);
      return;
    }
    setConfirmingDelete(false);
    onDelete(node);
  };

  const FolderIcon = isOpen ? FolderOpen : Folder;

  return (
    <div>
      <div
        className="relative flex items-center gap-1.5 pr-2 py-1 text-sm text-ink hover:bg-hover cursor-pointer group"
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={handleClick}
      >
        {/* Indent guides: one hairline per ancestor level, VS Code style */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 bottom-0 w-px bg-border/60"
            style={{ left: i * 14 + 16 }}
          />
        ))}

        <span
          className={`flex items-center justify-center w-3.5 h-3.5 shrink-0 text-faint transition-transform duration-100 ${
            node.isFolder && isOpen ? "rotate-90" : ""
          }`}
        >
          {node.isFolder && <ChevronRight size={12} strokeWidth={2.5} />}
        </span>

        <span className="shrink-0 text-faint">
          {node.isFolder ? (
            <FolderIcon size={ICON_SIZE} strokeWidth={1.75} />
          ) : (
            <File size={ICON_SIZE} strokeWidth={1.75} />
          )}
        </span>

        {renaming ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setNameInput(node.name);
                setRenaming(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-hover border border-accent rounded px-1 py-0 text-xs text-ink flex-1 outline-none"
          />
        ) : (
          <span className="flex-1 truncate">{node.name}</span>
        )}

        {canEdit && !renaming && (
          <div
            className={`flex items-center gap-0.5 transition-opacity ${
              confirmingDelete ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {node.isFolder && !confirmingDelete && (
              <>
                <RowAction
                  title="New file"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateChild(node, false);
                  }}
                >
                  <FilePlus size={13} strokeWidth={1.75} />
                </RowAction>
                <RowAction
                  title="New folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateChild(node, true);
                  }}
                >
                  <FolderPlus size={13} strokeWidth={1.75} />
                </RowAction>
              </>
            )}
            {!confirmingDelete && (
              <RowAction
                title="Rename"
                tone="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenaming(true);
                }}
              >
                <Pencil size={13} strokeWidth={1.75} />
              </RowAction>
            )}
            <RowAction
              title={confirmingDelete ? "Click again to confirm" : "Delete"}
              tone="danger"
              onClick={handleDeleteClick}
            >
              {confirmingDelete ? <Check size={13} strokeWidth={2} /> : <Trash2 size={13} strokeWidth={1.75} />}
            </RowAction>
          </div>
        )}
      </div>

      {node.isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNode
              key={child.id}
              node={child}
              depth={depth + 1}
              canEdit={canEdit}
              onSelectFile={onSelectFile}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
