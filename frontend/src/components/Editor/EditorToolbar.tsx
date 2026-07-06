interface EditorToolbarProps {
  fileName?: string;
  connected: boolean;
}

export function EditorToolbar({ fileName, connected }: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-panel border-b border-subtle text-xs">
      <span className="text-muted truncate">{fileName ?? "No file open"}</span>
      <span className={connected ? "text-success" : "text-danger"}>
        {connected ? "● synced" : "● offline"}
      </span>
    </div>
  );
}
