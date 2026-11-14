type MonacoWorkerEnvironment = {
  getWorkerUrl?: (moduleId: string, label: string) => string;
  [key: string]: unknown;
};

export async function loadMonacoEditor() {
  const workerMainUrl = new URL(
    "/monaco/vs/base/worker/workerMain.js",
    window.location.origin
  ).toString();

  const runtime = globalThis as typeof globalThis & {
    MonacoEnvironment?: MonacoWorkerEnvironment;
  };

  runtime.MonacoEnvironment = {
    ...runtime.MonacoEnvironment,
    getWorkerUrl: (_moduleId: string, label: string) => `${workerMainUrl}#${label}`,
  };

  const editorModule = await import("@monaco-editor/react");

  editorModule.loader.config({
    paths: { vs: "/monaco/vs" },
  });

  return { default: editorModule.default };
}
