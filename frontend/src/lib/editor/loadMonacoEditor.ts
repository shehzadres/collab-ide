export async function loadMonacoEditor() {
  const editorModule = await import("@monaco-editor/react");

  editorModule.loader.config({
    paths: { vs: "/node_modules/monaco-editor/min/vs" },
  });

  return { default: editorModule.default };
}
