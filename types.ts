export enum DiagramType {
  MERMAID = 'MERMAID',
  EXCALIDRAW = 'EXCALIDRAW'
}

export interface MermaidConfig {
    theme: 'dark' | 'default' | 'forest' | 'neutral';
}

export interface DiagramState {
  mermaidCode: string;
  excalidrawElements: any[]; // Using any[] to avoid heavy type dependency on excalidraw types here
  title: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: DiagramType;
  preview: string;
  state: DiagramState;
}

export const SUPPORTED_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (High Quality)' },
];

export const TEMPLATES = [
  { 
    name: 'Flowchart', 
    type: DiagramType.MERMAID, 
    code: `graph TD\n  A[Start] --> B{Decision}\n  B -- Yes --> C[Process]\n  B -- No --> D[End]` 
  },
  { 
    name: 'Sequence', 
    type: DiagramType.MERMAID, 
    code: `sequenceDiagram\n  Alice->>John: Hello John, how are you?\n  John-->>Alice: Great!` 
  },
  { 
    name: 'Class', 
    type: DiagramType.MERMAID, 
    code: `classDiagram\n  class Animal{\n    +String name\n    +move()\n  }\n  class Dog{\n    +bark()\n  }\n  Animal <|-- Dog` 
  },
];