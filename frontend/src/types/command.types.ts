export interface PaletteCommand {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  keywords?: string[];
  run: () => void;
}
