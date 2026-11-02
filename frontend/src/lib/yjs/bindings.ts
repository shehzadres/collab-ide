import type * as monaco from "monaco-editor";
import type { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

export async function bindMonacoToYjs(
  editor: monaco.editor.IStandaloneCodeEditor,
  yText: Y.Text,
  provider: WebsocketProvider
): Promise<MonacoBinding> {
  const model = editor.getModel();
  if (!model || model.isDisposed()) {
    throw new Error("Editor model not initialized or already disposed");
  }

  const { MonacoBinding: Binding } = await import("y-monaco");
  return new Binding(yText, model, new Set([editor]), provider.awareness);
}
