import { useEffect, useRef, lazy, Suspense } from "react";
import type { OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useTheme } from "../../hooks/useTheme";

const Editor = lazy(() => import("@monaco-editor/react"));

interface ReplayEditorViewProps {
  content: string;
  language: string;
}

export function ReplayEditorView({ content, language }: ReplayEditorViewProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.updateOptions({ readOnly: true, minimap: { enabled: false } });
  };

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (model && model.getValue() !== content) {
      model.setValue(content);
    }
  }, [content]);

  return (
    <Suspense fallback={<div className="ide-monaco-loading">Preparing replay editor…</div>}>
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={content}
        theme={theme.monacoTheme}
        onMount={handleMount}
        options={{ readOnly: true, fontSize: 13 }}
      />
    </Suspense>
  );
}

