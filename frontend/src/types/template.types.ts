import type { RuntimeId } from "./execution.types";

export interface TemplateFile {
  path: string;
  content: string;
  isFolder?: boolean;
}

export interface ProjectTemplate {
  id: string;
  runtime?: RuntimeId;
  label: string;
  description: string;
  language: string;
  files: TemplateFile[];
}
