import { useEditorStore } from "../../store/editorStore";

export function EditorTabs() {
  const { openFiles, activeFile, setActiveFile, closeFile } = useEditorStore();

  if (openFiles.length === 0) return null;

  return (
    <div className="flex bg-panel border-b border-subtle overflow-x-auto">
      {openFiles.map((file) => {
        const isActive = activeFile?.id === file.id;
        return (
          <div
            key={file.id}
            onClick={() => setActiveFile(file)}
            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-r border-subtle whitespace-nowrap ${
              isActive ? "bg-hover text-ink" : "text-muted hover:bg-hover"
            }`}
          >
            <span>{file.path.split("/").pop()}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
              className="text-faint hover:text-ink"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
