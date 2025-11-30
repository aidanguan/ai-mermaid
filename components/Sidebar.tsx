import React from 'react';
import { History, LayoutTemplate, Clock, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DiagramType, HistoryItem, TEMPLATES } from '../types';
import clsx from 'clsx';

interface SidebarProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  activeTab: DiagramType;
  onTabChange: (tab: DiagramType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  onSelectHistory, 
  activeTab, 
  onTabChange,
  collapsed,
  onToggleCollapse
}) => {
  return (
    <div 
      className={clsx(
        "h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* App Logo/Title */}
      <div className="h-14 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 relative transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
              <LayoutTemplate className="text-white w-5 h-5" />
          </div>
          {!collapsed && <h1 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">DiagramAI</h1>}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="p-3">
        <div className={clsx("flex flex-col gap-2", collapsed && "items-center")}>
           {!collapsed && <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider ml-1">Mode</label>}
           
           <div className={clsx("bg-slate-100 dark:bg-slate-900 rounded-lg p-1 gap-1 transition-colors", collapsed ? "flex flex-col" : "grid grid-cols-2")}>
             <button
                onClick={() => onTabChange(DiagramType.MERMAID)}
                title="Mermaid Diagram"
                className={clsx(
                  "flex items-center justify-center rounded-md transition-all",
                  collapsed ? "w-10 h-10" : "px-3 py-2 text-sm font-medium",
                  activeTab === DiagramType.MERMAID 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                )}
              >
                {collapsed ? "M" : "Mermaid"}
              </button>
              <button
                onClick={() => onTabChange(DiagramType.EXCALIDRAW)}
                title="Excalidraw Whiteboard"
                className={clsx(
                  "flex items-center justify-center rounded-md transition-all",
                  collapsed ? "w-10 h-10" : "px-3 py-2 text-sm font-medium",
                  activeTab === DiagramType.EXCALIDRAW
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                )}
              >
                {collapsed ? "E" : "Excalidraw"}
              </button>
           </div>
        </div>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-none">
        
        {/* Templates Section */}
        <div className={clsx("flex flex-col", collapsed && "items-center")}>
           {!collapsed ? (
             <div className="flex items-center gap-2 mb-3 px-1 text-slate-400">
               <LayoutTemplate size={14} />
               <span className="text-xs font-semibold uppercase tracking-wider">Templates</span>
             </div>
           ) : (
             <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-2"></div>
           )}
           
           <div className="space-y-1 w-full">
             {TEMPLATES.filter(t => t.type === activeTab || activeTab === DiagramType.MERMAID).map((t, idx) => (
               <button
                 key={idx}
                 title={t.name}
                 onClick={() => alert("Template loading logic would go here.")}
                 className={clsx(
                   "w-full rounded-lg transition-colors flex items-center group",
                   collapsed 
                     ? "justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" 
                     : "text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 justify-between"
                 )}
               >
                 {collapsed ? <span className="text-xs font-bold">{t.name[0]}</span> : <span>{t.name}</span>}
                 {!collapsed && <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
               </button>
             ))}
           </div>
        </div>

        {/* History Section */}
        <div className={clsx("flex flex-col", collapsed && "items-center")}>
           {!collapsed ? (
             <div className="flex items-center gap-2 mb-3 px-1 text-slate-400">
               <History size={14} />
               <span className="text-xs font-semibold uppercase tracking-wider">Recent</span>
             </div>
           ) : (
             <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-2"></div>
           )}
           
           <div className="space-y-2 w-full">
             {history.slice(0, 5).map((item) => (
               <div 
                 key={item.id}
                 title={item.preview}
                 onClick={() => onSelectHistory(item)}
                 className={clsx(
                   "group cursor-pointer rounded-lg transition-all border border-transparent",
                   collapsed 
                    ? "w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    : "p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                 )}
               >
                 {collapsed ? (
                   <Clock size={16} />
                 ) : (
                   <>
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.preview || 'Untitled'}</p>
                     <div className="flex items-center justify-between mt-2">
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded", item.type === DiagramType.MERMAID ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300")}>
                            {item.type === DiagramType.MERMAID ? 'Mermaid' : 'Whiteboard'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric'})}</span>
                     </div>
                   </>
                 )}
               </div>
             ))}
           </div>
        </div>
      </div>
      
      {/* Footer: User & Collapse */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className={clsx("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && (
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 ring-2 ring-white dark:ring-slate-800 shrink-0"></div>
                    <div className="flex flex-col truncate">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">Demo User</span>
                        <span className="text-xs text-slate-500 truncate">Free Plan</span>
                    </div>
                </div>
            )}
            <button 
                onClick={onToggleCollapse}
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};