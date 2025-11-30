import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { SUPPORTED_MODELS } from '../types';

interface PromptInputProps {
  onGenerate: (prompt: string, model: string) => void;
  disabled: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, disabled }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0].id);

  const handleSubmit = () => {
    if (prompt.trim() && !disabled) {
      onGenerate(prompt, selectedModel);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 h-full">
      {/* Header / Model Selector */}
      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Assistant</span>
         </div>
         <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px] transition-colors"
            disabled={disabled}
          >
            {SUPPORTED_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name.split('(')[0].trim()}
              </option>
            ))}
          </select>
      </div>

      {/* Input Area */}
      <div className="relative group flex-1 flex flex-col min-h-[160px]">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
         <div className="relative bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden transition-colors">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your diagram in detail...&#10;Example: Create a flowchart for a user registration process including email verification and error handling."
                className="w-full flex-1 p-4 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 leading-relaxed transition-colors"
                disabled={disabled}
            />
            
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Ctrl + Enter to send</span>
                <button
                    onClick={handleSubmit}
                    disabled={disabled || !prompt.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 ml-auto"
                >
                    {disabled ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                    <>
                        <span>Generate</span>
                        <Send size={14} />
                    </>
                    )}
                </button>
            </div>
         </div>
      </div>
      
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-1 leading-normal shrink-0">
        Powered by Gemini. Describe structures and relationships clearly.
      </p>
    </div>
  );
};