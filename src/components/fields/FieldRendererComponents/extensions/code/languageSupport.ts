/**
 * Code Language Support
 * Lists all supported code languages for syntax highlighting
 * 
 * @requirements 5.2
 */

export interface CodeLanguage {
  id: string;
  label: string;
}

export const SUPPORTED_CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash / Shell' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'graphql', label: 'GraphQL' },
  { id: 'xml', label: 'XML' },
  { id: 'plaintext', label: 'Plain Text' },
];
