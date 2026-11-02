import { create } from "zustand";
import { EditorFile } from "../types/editor.types";

interface EditorState {
  activeFile: EditorFile | null;
  openFiles: EditorFile[];
  setActiveFile: (file: EditorFile) => void;
  openFile: (file: EditorFile) => void;
  closeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeFile: null,
  openFiles: [],

  setActiveFile: (file) => set({ activeFile: file }),

  openFile: (file) => {
    const { openFiles } = get();
    const existingIndex = openFiles.findIndex((f) => f.id === file.id);

    if (existingIndex === -1) {
      set({ openFiles: [...openFiles, file], activeFile: file });
    } else {
      const next = [...openFiles];
      next[existingIndex] = file;
      set({ openFiles: next, activeFile: file });
    }
  },

  updateFileContent: (id, content) => {
    const { openFiles, activeFile } = get();
    const nextFiles = openFiles.map((file) => file.id === id ? { ...file, content } : file);
    set({
      openFiles: nextFiles,
      activeFile: activeFile?.id === id ? { ...activeFile, content } : activeFile,
    });
  },

  closeFile: (id) => {
    const { openFiles, activeFile } = get();
    const closingIndex = openFiles.findIndex((f) => f.id === id);
    if (closingIndex === -1) return;

    const remaining = openFiles.filter((f) => f.id !== id);
    const wasActive = activeFile?.id === id;

    const nextActive = wasActive
      ? remaining[Math.min(closingIndex, remaining.length - 1)] ?? null
      : activeFile;

    set({ openFiles: remaining, activeFile: nextActive });
  },
}));
