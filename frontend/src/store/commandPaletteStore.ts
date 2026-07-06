import { create } from "zustand";
import { PaletteCommand } from "../types/command.types";

interface CommandPaletteState {
  isOpen: boolean;
  commands: PaletteCommand[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  /**
   * Commands are registered by whichever component owns the relevant action
   * (terminal panel, file tree, theme switcher, etc.) and unregistered on
   * unmount via the returned cleanup, so the palette's command list always
   * matches what's actually available on the current screen.
   */
  register: (commands: PaletteCommand[]) => () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({
  isOpen: false,
  commands: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  register: (newCommands) => {
    set((state) => ({ commands: [...state.commands, ...newCommands] }));
    const ids = new Set(newCommands.map((c) => c.id));
    return () => {
      set((state) => ({ commands: state.commands.filter((c) => !ids.has(c.id)) }));
    };
  },
}));
