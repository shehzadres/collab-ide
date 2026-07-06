import { useEffect } from "react";
import { useThemeStore, applyThemeToDocument } from "../store/themeStore";
import { getTheme } from "../lib/theme/themes";

export function useTheme() {
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  return { themeId, setTheme, theme: getTheme(themeId) };
}
