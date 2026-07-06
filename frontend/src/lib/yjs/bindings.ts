import * as monaco from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function bindMonacoToYjs(
  editor: monaco.editor.IStandaloneCodeEditor,
  yText: Y.Text,
  provider: WebsocketProvider
): MonacoBinding {
  const model = editor.getModel();
  if (!model || model.isDisposed()) {
    throw new Error("Editor model not initialized or already disposed");
  }

  return new MonacoBinding(yText, model, new Set([editor]), provider.awareness);
}
