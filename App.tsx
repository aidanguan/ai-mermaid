import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptInput } from './components/PromptInput';
import { MermaidEditor } from './components/MermaidEditor';
import { ExcalidrawWrapper } from './components/ExcalidrawWrapper';
import { Header } from './components/Header';
import { DiagramType, DiagramState, HistoryItem } from './types';
import { generateDiagramCode } from './services/geminiService';
import { Loader2, Code2, ChevronDown, ChevronUp, BookOpen, RefreshCw, X } from 'lucide-react';
import clsx from 'clsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DiagramType>(DiagramType.MERMAID);
  const [isLoading, setIsLoading] = useState(false);
  const [diagramState, setDiagramState] = useState<DiagramState>({
    mermaidCode: `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]`,
    excalidrawElements: [],
    title: 'Untitled Diagram'
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('diagram_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newState: DiagramState) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: activeTab,
      preview: newState.title,
      state: newState
    };
    const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem('diagram_history', JSON.stringify(updatedHistory));
  };

  const handleGenerate = async (prompt: string, model: string) => {
    setIsLoading(true);
    try {
      const response = await generateDiagramCode(prompt, activeTab, model);
      
      if (activeTab === DiagramType.MERMAID) {
        const newState = { ...diagramState, mermaidCode: response, title: prompt.slice(0, 30) };
        setDiagramState(newState);
        saveToHistory(newState);
        setShowCodeEditor(true); // Auto show code on generation
      } else {
        try {
          const elements = JSON.parse(response);
          const newState = { ...diagramState, excalidrawElements: elements, title: prompt.slice(0, 30) };
          setDiagramState(newState);
          saveToHistory(newState);
        } catch (e) {
          console.error("Failed to parse Excalidraw JSON", e);
          alert("AI generated invalid data structure. Please try again.");
        }
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate diagram. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToExcalidraw = async () => {
    setIsLoading(true);
    try {
        console.log("Starting conversion...");
        // Dynamic import to avoid loading heavy library if not used
        // @ts-ignore
        const module = await import("mermaid-to-excalidraw");
        console.log("Module loaded:", module);
        
        const parseMermaidToExcalidraw = module.parseMermaidToExcalidraw;

        if (!parseMermaidToExcalidraw) {
            throw new Error("Function parseMermaidToExcalidraw not found in imported module");
        }
        
        const excalidrawElements = await parseMermaidToExcalidraw(diagramState.mermaidCode, {
            mermaid: { theme: 'default' }
        });

        console.log("Conversion successful:", excalidrawElements);

        // Update state and switch tab
        setDiagramState(prev => ({
            ...prev,
            excalidrawElements: excalidrawElements
        }));
        setActiveTab(DiagramType.EXCALIDRAW);
        
    } catch (e) {
        console.error("Conversion failed:", e);
        // @ts-ignore
        alert(`Failed to convert diagram: ${e.message || "Unknown error"}. Check console for details.`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setActiveTab(item.type);
    setDiagramState(item.state);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* 1. Navigation Sidebar */}
      <Sidebar 
        history={history} 
        onSelectHistory={handleHistorySelect} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={diagramState.title} 
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        
        <div className="flex-1 flex overflow-hidden">
          
          {/* 2. Editor Panel (Prompt + Code) */}
          <div className="w-[400px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10 shadow-xl shrink-0 transition-colors duration-300">
            
            {/* Prompt Input Area */}
            <div className="flex-1 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[200px] flex flex-col overflow-y-auto">
               <PromptInput onGenerate={handleGenerate} disabled={isLoading} />
            </div>

            {/* Mermaid Code Editor (Collapsible) */}
            {activeTab === DiagramType.MERMAID && (
              <div className={`flex flex-col bg-slate-50 dark:bg-slate-925 transition-all duration-300 border-t border-slate-200 dark:border-slate-800 ${showCodeEditor ? 'h-[50%]' : 'h-10'}`}>
                
                {/* Editor Header - Mimicking Mermaid Live Editor */}
                <div 
                  className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 select-none h-10 shrink-0 transition-colors"
                >
                  <div className="flex items-center gap-3" onClick={() => setShowCodeEditor(!showCodeEditor)}>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                        <Code2 size={16} />
                        <span className="text-sm font-semibold">Code</span>
                    </div>
                  </div>

                  {showCodeEditor && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Auto-Sync</span>
                        </div>
                        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700"></div>
                        <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 text-xs">
                            <BookOpen size={14} />
                            <span>Docs</span>
                        </button>
                        <button 
                            onClick={() => setShowCodeEditor(false)}
                            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ml-2"
                        >
                            <X size={16} />
                        </button>
                    </div>
                  )}
                  {!showCodeEditor && (
                      <button onClick={() => setShowCodeEditor(true)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                          <ChevronUp size={16} />
                      </button>
                  )}
                </div>
                
                {/* Code Textarea */}
                {showCodeEditor && (
                  <div className="flex-1 relative group bg-white dark:bg-[#0d1117]">
                    {/* Line numbers mock (simple visual) */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-mono pt-4 text-center select-none hidden sm:block transition-colors">
                        {diagramState.mermaidCode.split('\n').map((_, i) => (
                            <div key={i} className="leading-relaxed">{i + 1}</div>
                        ))}
                    </div>

                    <textarea
                      className="absolute inset-0 w-full h-full pl-2 sm:pl-10 p-4 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-xs leading-relaxed resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 selection:bg-blue-100 dark:selection:bg-blue-900/40"
                      value={diagramState.mermaidCode}
                      onChange={(e) => setDiagramState(prev => ({ ...prev, mermaidCode: e.target.value }))}
                      spellCheck={false}
                      placeholder="Enter Mermaid syntax here..."
                    />
                  </div>
                )}
              </div>
            )}
             
            {/* Excalidraw Hint */}
            {activeTab === DiagramType.EXCALIDRAW && (
               <div className="p-8 flex flex-col items-center justify-center text-slate-500 text-center space-y-2 opacity-50 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm">Excalidraw Mode</p>
                  <p className="text-xs">Use the canvas to edit elements directly.</p>
               </div>
            )}
          </div>

          {/* 3. Canvas Area */}
          <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 overflow-hidden flex flex-col transition-colors duration-300">
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                     <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                     <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
                  </div>
                  <p className="text-lg font-medium text-slate-900 dark:text-blue-100">Architecting Diagram...</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Translating your thoughts to structure</p>
                </div>
              </div>
            )}

            <div className="flex-1 w-full h-full relative">
              {activeTab === DiagramType.MERMAID ? (
                <MermaidEditor 
                  code={diagramState.mermaidCode} 
                  onChange={(code) => setDiagramState(prev => ({ ...prev, mermaidCode: code }))} 
                  onConvertToExcalidraw={handleConvertToExcalidraw}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <ExcalidrawWrapper 
                  elements={diagramState.excalidrawElements}
                  onChange={(elements) => setDiagramState(prev => ({ ...prev, excalidrawElements: elements }))}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default App;