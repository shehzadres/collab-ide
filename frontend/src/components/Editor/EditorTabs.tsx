import { FileCode2, X } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";

export function EditorTabs() {
  const { openFiles, activeFile, setActiveFile, closeFile } = useEditorStore();

  if (openFiles.length === 0) {
    return <div className="ide-tabs-empty"><span>NO OPEN FILES</span></div>;
  }

  return (
    <div className="ide-tabs" role="tablist" aria-label="Open files">
      {openFiles.map((file) => {
        const isActive = activeFile?.id === file.id;
        return (
          <div
            key={file.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => setActiveFile(file)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveFile(file);
              }
            }}
            className={`ide-tab ${isActive ? "active" : ""}`}
          >
            <FileCode2 size={14} />
            <span>{file.path.split("/").pop()}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
              className="ide-tab-close"
              aria-label={`Close ${file.path.split("/").pop()}`}
              title="Close file"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
