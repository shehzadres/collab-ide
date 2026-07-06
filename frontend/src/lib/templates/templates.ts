import { ProjectTemplate } from "../../types/template.types";

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    label: "Blank session",
    description: "Start with an empty file tree.",
    language: "plaintext",
    files: [],
  },
  {
    id: "node-starter",
    label: "Node.js starter",
    description: "A minimal Node.js script and package.json.",
    language: "javascript",
    files: [
      {
        path: "/package.json",
        content: JSON.stringify({ name: "session-app", version: "1.0.0", main: "index.js" }, null, 2),
      },
      {
        path: "/index.js",
        content: "console.log('Hello from Collab IDE!');\n",
      },
    ],
  },
  {
    id: "python-starter",
    label: "Python starter",
    description: "A minimal Python entry point.",
    language: "python",
    files: [
      {
        path: "/main.py",
        content: "def main():\n    print('Hello from Collab IDE!')\n\n\nif __name__ == '__main__':\n    main()\n",
      },
    ],
  },
  {
    id: "html-starter",
    label: "HTML/CSS/JS starter",
    description: "A static page with separate CSS and JS files.",
    language: "html",
    files: [
      {
        path: "/index.html",
        content:
          "<!doctype html>\n<html>\n  <head>\n    <link rel=\"stylesheet\" href=\"style.css\" />\n  </head>\n  <body>\n    <h1>Hello, Collab IDE</h1>\n    <script src=\"script.js\"></script>\n  </body>\n</html>\n",
      },
      { path: "/style.css", content: "body {\n  font-family: sans-serif;\n}\n" },
      { path: "/script.js", content: "console.log('loaded');\n" },
    ],
  },
];

export function getTemplate(id: string): ProjectTemplate {
  return PROJECT_TEMPLATES.find((t) => t.id === id) ?? PROJECT_TEMPLATES[0];
}
