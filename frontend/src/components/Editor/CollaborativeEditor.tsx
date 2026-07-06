import { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { useEditorStore } from "../../store/editorStore";
import { useYjsProvider } from "../../hooks/useYjsProvider";
import { useAwareness } from "../../hooks/useAwareness";
import { useTheme } from "../../hooks/useTheme";
import { getFileText } from "../../lib/yjs/ydoc";
import { bindMonacoToYjs } from "../../lib/yjs/bindings";
import { UserAvatars } from "../Presence/UserAvatars";

interface CollaborativeEditorProps {
  roomId: string;
}

export function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const { activeFile } = useEditorStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const cursorListenerRef = useRef<monaco.IDisposable | null>(null);

  const { doc, provider } = useYjsProvider(roomId);
  const peers = useAwareness(provider);
  const { theme } = useTheme();

  function attachBinding() {
    bindingRef.current?.destroy();
    bindingRef.current = null;

    if (!editorRef.current || !activeFile || !doc || !provider) return;

    const model = editorRef.current.getModel();
    if (!model || model.isDisposed()) return;

    const yText = getFileText(doc, activeFile.id);
    bindingRef.current = bindMonacoToYjs(editorRef.current, yText, provider);
  }

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;

    editorInstance.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      smoothScrolling: true,
      cursorBlinking: "smooth",
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "off",
      scrollBeyondLastLine: false,
    });

    cursorListenerRef.current?.dispose();
    cursorListenerRef.current = editorInstance.onDidChangeCursorPosition((e) => {
      provider?.awareness.setLocalStateField("cursor", {
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    attachBinding();
  };

  useEffect(() => {
    attachBinding();
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile?.id, doc, provider]);

  useEffect(() => {
    return () => {
      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;
      bindingRef.current?.destroy();
      bindingRef.current = null;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col bg-bg">
        <UserAvatars peers={peers} />
        <div className="flex-1 flex items-center justify-center text-faint text-sm">
          Select a file to begin editing
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col">
      <UserAvatars peers={peers} />
      <div className="flex-1">
        <Editor
          key={activeFile.id}
          height="100%"
          path={activeFile.path}
          defaultLanguage={activeFile.language}
          theme={theme.monacoTheme}
          onMount={handleMount}
          options={{
            fontFamily: "'Fira Code', monospace",
            fontLigatures: true,
          }}
        />
      </div>
    </div>
  );
}
