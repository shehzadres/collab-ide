const EXT_LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  yml: "yaml",
  yaml: "yaml",
  sh: "shell",
};

export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return EXT_LANGUAGE_MAP[ext] || "plaintext";
}
