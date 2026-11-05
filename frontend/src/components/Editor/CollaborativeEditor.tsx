import { useRef, useEffect, lazy, Suspense } from "react";
import { loader } from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { Code2 } from "lucide-react";
import type { MonacoBinding } from "y-monaco";
import { useEditorStore } from "../../store/editorStore";
import { useYjsProvider } from "../../hooks/useYjsProvider";
import { useAwareness } from "../../hooks/useAwareness";
import { useTheme } from "../../hooks/useTheme";
import { getFileText } from "../../lib/yjs/ydoc";
import { bindMonacoToYjs } from "../../lib/yjs/bindings";
import { filesApi } from "../../lib/api/files.api";
import { UserAvatars } from "../Presence/UserAvatars";

const Editor = lazy(() => import("@monaco-editor/react"));

interface CollaborativeEditorProps {
  roomId: string;
}

export function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const { activeFile } = useEditorStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const cursorListenerRef = useRef<monaco.IDisposable | null>(null);
  const bindingGenerationRef = useRef(0);
  const saveTimerRef = useRef<number | null>(null);
  const saveObserverRef = useRef<((event: unknown, transaction: { local: boolean }) => void) | null>(null);
  const saveTextRef = useRef<ReturnType<typeof getFileText> | null>(null);

  const { doc, provider, connected, synced } = useYjsProvider(roomId);
  const peers = useAwareness(provider);
  const { theme } = useTheme();

  const clearSaveSubscription = () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (saveObserverRef.current && saveTextRef.current) {
      saveTextRef.current.unobserve(saveObserverRef.current);
    }
    saveObserverRef.current = null;
    saveTextRef.current = null;
  };

  async function attachBinding() {
    const generation = ++bindingGenerationRef.current;
    clearSaveSubscription();
    bindingRef.current?.destroy();
    bindingRef.current = null;

    const editor = editorRef.current;
    if (!editor || !activeFile || !doc || !provider || !synced) return;

    const model = editor.getModel();
    if (!model || model.isDisposed()) return;

    const yText = getFileText(doc, activeFile.id);
    const fileId = activeFile.id;

    const saveObserver = (_event: unknown, transaction: { local: boolean }) => {
      if (!transaction.local) return;

      const content = yText.toString();
      useEditorStore.getState().updateFileContent(fileId, content);

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        void filesApi.updateContent(fileId, content).catch((error) => {
          console.error("Could not save the latest file contents", error);
        });
      }, 500);
    };

    yText.observe(saveObserver);
    saveObserverRef.current = saveObserver;
    saveTextRef.current = yText;

    if (yText.length === 0 && activeFile.content) {
      doc.transact(() => yText.insert(0, activeFile.content));
    }
    useEditorStore.getState().updateFileContent(fileId, yText.toString());

    try {
      const binding = await bindMonacoToYjs(editor, yText, provider);
      if (generation !== bindingGenerationRef.current || editorRef.current !== editor) {
        binding.destroy();
        return;
      }
      bindingRef.current = binding;
    } catch (error) {
      clearSaveSubscription();
      console.error("Could not bind editor to the shared document", error);
    }
  }

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;

    editorInstance.updateOptions({
      fontSize: 13,
      minimap: { enabled: false },
      wordWrap: "on",
      smoothScrolling: true,
      cursorBlinking: "smooth",
      automaticLayout: true,
      tabSize: 2,
      scrollBeyondLastLine: false,
    });

    cursorListenerRef.current?.dispose();
    cursorListenerRef.current = editorInstance.onDidChangeCursorPosition((e) => {
      provider?.awareness.setLocalStateField("cursor", {
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    void attachBinding();
  };

  useEffect(() => {
    void attachBinding();
    return () => {
      bindingGenerationRef.current += 1;
      clearSaveSubscription();
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile?.id, doc, provider, synced]);

  useEffect(() => {
    return () => {
      bindingGenerationRef.current += 1;
      clearSaveSubscription();
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
      <div className="ide-empty-editor" data-yjs-connected={connected ? "true" : "false"} data-yjs-synced={synced ? "true" : "false"}>
        <UserAvatars peers={peers} />
        <div className="ide-empty-editor-content">
          <div className="ide-empty-editor-mark"><Code2 size={28} strokeWidth={1.45} /></div>
          <p className="ide-empty-editor-kicker">READY WHEN YOU ARE</p>
          <h2>Start with a file.</h2>
          <p>Choose something from the Explorer or create a new file to begin.</p>
          <div className="ide-empty-editor-hint"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd><span>Open command palette</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ide-editor-root flex-1 h-full flex flex-col" data-yjs-connected={connected ? "true" : "false"} data-yjs-synced={synced ? "true" : "false"}>
      <UserAvatars peers={peers} />
      <div className="ide-monaco-wrap">
        <Suspense fallback={<div className="ide-monaco-loading">Preparing editor…</div>}>
          <Editor
            key={activeFile.id}
            height="100%"
            path={activeFile.path}
            defaultLanguage={activeFile.language}
            theme={theme.monacoTheme}
            onMount={handleMount}
            options={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              lineHeight: 22,
              fontLigatures: true,
              minimap: { enabled: false },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              padding: { top: 20, bottom: 20 },
              renderLineHighlight: "gutter",
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Serve Monaco's AMD loader from the installed package instead of relying on the default CDN.
loader.config({ paths: { vs: "/node_modules/monaco-editor/min/vs" } });
