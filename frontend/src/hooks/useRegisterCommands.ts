import { useEffect } from "react";
import { useCommandPaletteStore } from "../store/commandPaletteStore";
import { PaletteCommand } from "../types/command.types";

/**
 * Registers a set of commands with the global command palette for the
 * lifetime of the calling component. Pass a stable array (e.g. built with
 * useMemo) to avoid churn — every call re-registers on dependency change.
 */
export function useRegisterCommands(commands: PaletteCommand[]) {
  const register = useCommandPaletteStore((s) => s.register);

  useEffect(() => {
    const unregister = register(commands);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commands]);
}
