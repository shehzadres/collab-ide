export interface TemplateFile {
  path: string;
  content: string;
  isFolder?: boolean;
}

export interface ProjectTemplate {
  id: string;
  label: string;
  description: string;
  language: string;
  files: TemplateFile[];
}
