import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
  Download, AlertCircle, ZoomIn, ZoomOut, RotateCcw, 
  Settings2, Square, Circle, Diamond, ArrowRight, 
  Type, MoveHorizontal, MoveVertical, Palette, User,
  Hand, MousePointer2, Image as ImageIcon, Maximize,
  Edit3
} from 'lucide-react';
import clsx from 'clsx';

interface MermaidEditorProps {
  code: string;
  onChange?: (code: string) => void;
  onConvertToExcalidraw?: () => void;
  isDarkMode?: boolean;
}

type MermaidTheme = 'dark' | 'default' | 'forest' | 'neutral';

export const MermaidEditor: React.FC<MermaidEditorProps> = ({ code, onChange, onConvertToExcalidraw, isDarkMode = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  
  // View State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  // Editing State
  const [editingNode, setEditingNode] = useState<{ id: string; text: string; top: number; left: number; width: number; height: number } | null>(null);

  // Config State
  const [theme, setTheme] = useState<MermaidTheme>('dark');
  const [orientation, setOrientation] = useState<'TD' | 'LR'>('TD');
  
  // UI State
  const [activeMenu, setActiveMenu] = useState<'theme' | 'export' | null>(null);

  // Sync internal theme with global dark mode if not manually overridden by user recently?
  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'default');
  }, [isDarkMode]);

  // Initialize and Render
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: theme,
      securityLevel: 'loose', 
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      flowchart: {
        curve: 'linear', 
        htmlLabels: true,
        padding: 20
      },
      suppressErrorRendering: true 
    });
    renderDiagram();
  }, [theme, code]);

  // Click outside to close menus and editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDiagram = async () => {
    if (!code.trim()) {
        setSvgContent('');
        setError(null);
        return;
    }
    
    try {
      setError(null);
      const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { svg } = await mermaid.render(id, code);
      setSvgContent(svg);
    } catch (err: any) {
      console.warn("Mermaid Render Warning:", err);
      let msg = "Syntax Error";
      if (err?.message) msg = err.message;
      if (msg.includes("suitable point") || msg.includes("read property 'x'")) {
          msg = "Layout calculation failed. Try simplifying the diagram or switching orientation.";
      }
      setError(msg);
    }
  };

  // --- Interaction Logic ---
  
  const handleNodeDoubleClick = (e: React.MouseEvent) => {
    if (panMode || !onChange) return;
    
    // Find the closest node group
    const target = e.target as HTMLElement;
    const nodeGroup = target.closest('.node');
    
    if (nodeGroup && containerRef.current) {
        // Extract ID. Mermaid usually puts ID in the id attribute or a data attribute, 
        // but it modifies it (e.g. flowchart-A-43).
        // A simple way is to check the 'id' attribute of the group.
        const fullId = nodeGroup.id;
        
        // Try to extract the user-defined ID. 
        // This is tricky as Mermaid mangles IDs. 
        // We will try to find the text content and match it in the code.
        
        const textElement = nodeGroup.querySelector('span') || nodeGroup.querySelector('text');
        if (textElement) {
            const currentText = textElement.textContent || '';
            const rect = nodeGroup.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            
            // Calculate relative position accounting for scale/pan
            // Actually, we want the input to overlay exactly on screen.
            // Using fixed positioning for the textarea is easiest relative to window, 
            // but let's try absolute relative to container.
            
            setEditingNode({
                id: fullId, // Placeholder, we rely on text matching
                text: currentText,
                top: (rect.top - containerRect.top - position.y) / scale,
                left: (rect.left - containerRect.left - position.x) / scale,
                width: rect.width / scale,
                height: rect.height / scale
            });
        }
    }
  };

  const submitNodeUpdate = (newText: string) => {
      if (!editingNode || !onChange) return;
      
      // Simple strategy: Replace the first occurrence of the old text in the code.
      // This might be risky if multiple nodes have same text, but it's a start.
      // Better strategy: Use a Regex to find [oldText], (oldText) etc.
      
      const escapedOldText = editingNode.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match content inside brackets: [], (), {}, >], (( )) etc.
      // We look for any bracket opener, then the text, then bracket closer
      const regex = new RegExp(`(\\[|\\(|\\{|>|\\/)([\\s]*${escapedOldText}[\\s]*)(\\]|\\)|\\}|\\)|\\\\)`, 'g');
      
      // We only replace the first match to avoid global destruction if possible,
      // or we assumes the user clicked a specific one. 
      // Ideally we map ID, but we don't have the map back to source code easily.
      
      const newCode = code.replace(regex, `$1${newText}$3`);
      
      onChange(newCode);
      setEditingNode(null);
  };

  // --- Toolbar Actions ---

  const injectSyntax = (syntax: string) => {
    if (!onChange) return;
    const newCode = `${code}\n${syntax}`;
    onChange(newCode);
  };

  const toggleOrientation = () => {
    const newDir = orientation === 'TD' ? 'LR' : 'TD';
    setOrientation(newDir);
    if (!onChange) return;

    let newCode = code.replace(/^(graph|flowchart)\s+(TD|LR|TB|BT|RL)/m, `$1 ${newDir}`);
    if (newCode === code && !code.match(/^(graph|flowchart)/)) {
        newCode = `graph ${newDir}\n${code}`;
    } else if (newCode === code) {
       newCode = code.replace(/(graph|flowchart)\s+[A-Z]+/, `$1 ${newDir}`);
    }
    onChange(newCode);
  };

  const handleDownload = (format: 'svg' | 'png') => {
    if (!svgContent) return;

    if (format === 'svg') {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      a.click();
      URL.revokeObjectURL(url);
    } else {
        const canvas = document.createElement('canvas');
        const svgElement = containerRef.current?.querySelector('svg');
        if (svgElement && svgElement.viewBox.baseVal) {
            const bbox = svgElement.viewBox.baseVal;
            const width = bbox.width;
            const height = bbox.height;
            const scaleFactor = 3;
            canvas.width = width * scaleFactor; 
            canvas.height = height * scaleFactor;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Use theme color for background
                ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#ffffff'; 
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const img = new Image();
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const pngUrl = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = pngUrl;
                    a.download = 'diagram.png';
                    a.click();
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }
        }
    }
    setActiveMenu(null);
  };

  // --- Mouse Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panMode || e.button === 1 || (e.target as HTMLElement).tagName === 'DIV') {
         setIsDragging(true);
         dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
         // e.preventDefault(); // Do not prevent default to allow focus on text inputs if needed
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // --- Random ID Generator for Nodes ---
  const uid = () => Math.random().toString(36).substr(2, 4).toUpperCase();

  return (
    <div className="w-full h-full relative bg-slate-100 dark:bg-[#1e293b] overflow-hidden select-none transition-colors duration-300">
       {/* Background Grid */}
       <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none"></div>
        
      {/* --- Floating Tools Pill --- */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30" ref={toolbarRef}>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-1 transition-colors">
            
            {/* Pan/Select */}
            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-full p-0.5 transition-colors">
                <button 
                  onClick={() => setPanMode(false)}
                  className={clsx("p-2 rounded-full transition-all", !panMode ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                  title="Select Mode (Edit Text)"
                >
                    <MousePointer2 size={16} />
                </button>
                <button 
                  onClick={() => setPanMode(true)}
                  className={clsx("p-2 rounded-full transition-all", panMode ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                  title="Pan Mode"
                >
                    <Hand size={16} />
                </button>
            </div>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Visual Elements */}
            <button onClick={() => injectSyntax(`${uid()}[Rectangle]`)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Add Rectangle">
                <Square size={18} />
            </button>
            <button onClick={() => injectSyntax(`${uid()}((Circle)) `)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Add Circle">
                <Circle size={18} />
            </button>
            <button onClick={() => injectSyntax(`${uid()}{Decision}`)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Add Decision">
                <Diamond size={18} />
            </button>
            <button onClick={() => injectSyntax(` --> `)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Add Connector">
                <ArrowRight size={18} />
            </button>
            <button onClick={() => injectSyntax(`${uid()}[<i class='fa fa-user'></i> User]`)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Add Icon">
                <User size={18} />
            </button>
            
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

             {/* Config */}
             <div className="relative">
                <button 
                    onClick={() => setActiveMenu(activeMenu === 'theme' ? null : 'theme')}
                    className={clsx(
                        "p-2 rounded-full transition-colors",
                        activeMenu === 'theme' ? "bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                    )} 
                    title="Theme"
                >
                    <Palette size={18} />
                </button>
                
                {activeMenu === 'theme' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 py-1 animate-in fade-in zoom-in duration-200">
                        {['dark', 'default', 'forest', 'neutral'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => {
                                    setTheme(t as MermaidTheme);
                                    setActiveMenu(null);
                                }}
                                className={clsx(
                                    "w-full text-left px-3 py-2 text-xs capitalize hover:bg-slate-100 dark:hover:bg-slate-700",
                                    theme === t ? "text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/30" : "text-slate-700 dark:text-slate-300"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={toggleOrientation} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title={`Orientation: ${orientation}`}>
                {orientation === 'TD' ? <MoveVertical size={18} /> : <MoveHorizontal size={18} />}
            </button>
             
             <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Export */}
            <div className="relative">
                <button 
                    onClick={() => setActiveMenu(activeMenu === 'export' ? null : 'export')}
                    className={clsx(
                        "p-2 rounded-full transition-colors",
                        activeMenu === 'export' ? "bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                    title="Export / Convert"
                >
                    <ImageIcon size={18} />
                </button>
                {activeMenu === 'export' && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 py-1 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => handleDownload('svg')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Download SVG</button>
                        <button onClick={() => handleDownload('png')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Download PNG</button>
                        <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-1"></div>
                        {onConvertToExcalidraw && (
                             <button onClick={() => { onConvertToExcalidraw(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-violet-600 dark:text-violet-400 font-medium flex items-center gap-2">
                                <Edit3 size={12} />
                                Edit in Excalidraw
                             </button>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- Zoom Controls (Bottom Right) --- */}
      <div className="absolute bottom-6 right-6 z-30 flex gap-2">
           <div className="flex items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden transition-colors">
             <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-r border-slate-200 dark:border-slate-700">
                <ZoomOut size={18} />
             </button>
             <button onClick={() => { setScale(1); setPosition({x:0,y:0}); }} className="p-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-xs font-mono font-medium border-r border-slate-200 dark:border-slate-700 min-w-[3rem]">
                {Math.round(scale * 100)}%
             </button>
             <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                <ZoomIn size={18} />
             </button>
           </div>
           
           <button onClick={() => { setScale(1); setPosition({x:0,y:0}); }} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Maximize size={18} />
           </button>
      </div>

      {/* --- Canvas --- */}
      <div 
        className={clsx(
            "w-full h-full flex items-center justify-center",
            panMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleNodeDoubleClick}
        onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setScale(s => Math.max(0.1, Math.min(5, s - e.deltaY * 0.001)));
            }
        }}
      >
        {/* --- Text Editor Overlay --- */}
        {editingNode && (
            <textarea
                autoFocus
                value={editingNode.text}
                onChange={(e) => setEditingNode({ ...editingNode, text: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitNodeUpdate(editingNode.text);
                    }
                    if (e.key === 'Escape') setEditingNode(null);
                }}
                onBlur={() => setEditingNode(null)}
                style={{
                    position: 'absolute',
                    top: `${editingNode.top * scale + position.y}px`,
                    left: `${editingNode.left * scale + position.x}px`,
                    width: `${Math.max(100, editingNode.width * scale)}px`,
                    height: `${Math.max(40, editingNode.height * scale)}px`,
                    transform: `translate(${containerRef.current?.getBoundingClientRect().left}px, ${containerRef.current?.getBoundingClientRect().top}px)`, // Adjust for global offset
                    zIndex: 50
                }}
                className="fixed bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center p-2 rounded shadow-xl border-2 border-blue-500 focus:outline-none resize-none overflow-hidden text-sm leading-tight"
            />
        )}

        {error ? (
          <div className="flex flex-col items-center text-red-500 dark:text-red-400 gap-3 p-8 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-red-200 dark:border-red-900/30 backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in duration-300">
              <AlertCircle size={32} />
              <div className="text-center max-w-sm">
                <p className="font-bold text-lg mb-2">Rendering Failed</p>
                <p className="text-sm opacity-80 font-mono bg-red-50 dark:bg-slate-900 p-2 rounded text-wrap break-words">{error}</p>
              </div>
          </div>
        ) : (
          <div 
              ref={containerRef} 
              style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  transformOrigin: 'center'
              }}
              // Removed pointer-events-none to allow clicking on nodes
              className="flex items-center justify-center" 
          >
             <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          </div>
        )}
      </div>
    </div>
  );
};