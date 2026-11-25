import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = '' }) => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const label =
    theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light';

  const Icon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm px-2.5 py-2 transition-all cursor-pointer shadow-2xs ${className}`}
      title={`Theme: ${label} (click to switch Light / Dark / Auto)`}
      aria-label={`Switch theme (current: ${label})`}
    >
      <Icon className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-amber-400' : 'text-indigo-600'}`} />
      {!compact && <span className="hidden md:inline text-xs">{label}</span>}
    </button>
  );
};
