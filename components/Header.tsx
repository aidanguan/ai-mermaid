import React from 'react';
import { Share2, Users, Menu, Sun, Moon } from 'lucide-react';

interface HeaderProps {
    title: string;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, isDarkMode, toggleTheme }) => {
  return (
    <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Menu size={20} />
        </button>
        <h2 className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-md">
            {title}
        </h2>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Auto-saved
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Users size={16} />
            <span className="hidden sm:inline">Collaborate</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all">
            <Share2 size={16} />
            <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
};