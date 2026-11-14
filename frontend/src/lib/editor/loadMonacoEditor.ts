export async function loadMonacoEditor() {
  const editorModule = await import("@monaco-editor/react");

  editorModule.loader.config({
    paths: { vs: "/monaco/vs" },
  });

  return { default: editorModule.default };
}
