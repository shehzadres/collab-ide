import { create } from "zustand";
import { FileTreeNode } from "../types/file.types";

interface FileState {
  tree: FileTreeNode[];
  expanded: Set<string>;
  setTree: (tree: FileTreeNode[]) => void;
  toggleExpanded: (id: string) => void;
  upsertNode: (node: FileTreeNode) => void;
  removeNode: (id: string) => void;
}

function insertNode(tree: FileTreeNode[], node: FileTreeNode): FileTreeNode[] {
  if (!node.parentId) {
    const exists = tree.some((n) => n.id === node.id);
    return exists ? tree.map((n) => (n.id === node.id ? node : n)) : [...tree, node];
  }

  return tree.map((n) => {
    if (n.id === node.parentId) {
      const children = n.children ?? [];
      const exists = children.some((c) => c.id === node.id);
      return {
        ...n,
        children: exists
          ? children.map((c) => (c.id === node.id ? node : c))
          : [...children, node],
      };
    }
    if (n.children) {
      return { ...n, children: insertNode(n.children, node) };
    }
    return n;
  });
}

function deleteNode(tree: FileTreeNode[], id: string): FileTreeNode[] {
  return tree
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: deleteNode(n.children, id) } : n));
}

export const useFileStore = create<FileState>((set, get) => ({
  tree: [],
  expanded: new Set(),

  setTree: (tree) => set({ tree }),

  toggleExpanded: (id) => {
    const next = new Set(get().expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    set({ expanded: next });
  },

  upsertNode: (node) => set({ tree: insertNode(get().tree, node) }),

  removeNode: (id) => set({ tree: deleteNode(get().tree, id) }),
}));
