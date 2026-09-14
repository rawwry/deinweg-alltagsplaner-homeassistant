import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'magenta' | 'amber' | 'emerald' | 'ocean' | 'violet';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  previewColor: string;
  gradientClass: string;
  glowColor: string;
  badgeClass: string;
  textAccentClass: string;
  borderAccentClass: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  magenta: {
    id: 'magenta',
    name: 'Dein Weg Magenta (Standard)',
    shortName: 'Magenta / Pink',
    description: 'Am offiziellen Logo orientierte Pink-, Magenta- und Rosétöne',
    icon: '🌸',
    previewColor: '#e11d48',
    gradientClass: 'from-rose-500 via-pink-500 to-rose-600',
    glowColor: 'rgba(225, 29, 72, 0.25)',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    textAccentClass: 'text-rose-400',
    borderAccentClass: 'border-rose-500/30',
  },
  amber: {
    id: 'amber',
    name: 'Cozy Amber',
    shortName: 'Bernstein / Honig',
    description: 'Warme Honig-, Bernstein- und Terrakotta-Töne',
    icon: '🍯',
    previewColor: '#f59e0b',
    gradientClass: 'from-amber-500 via-orange-500 to-rose-500',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    textAccentClass: 'text-amber-400',
    borderAccentClass: 'border-amber-500/30',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    shortName: 'Smaragd / Salbei',
    description: 'Frisches Salbei-, Minz- und Smaragdgrün',
    icon: '🌿',
    previewColor: '#10b981',
    gradientClass: 'from-emerald-500 via-teal-500 to-emerald-600',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    textAccentClass: 'text-emerald-400',
    borderAccentClass: 'border-emerald-500/30',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Cyan',
    shortName: 'Ozean / Cyan',
    description: 'Klares Nordisches Cyan und Azurblau',
    icon: '🌊',
    previewColor: '#0ea5e9',
    gradientClass: 'from-sky-500 via-cyan-500 to-blue-600',
    glowColor: 'rgba(14, 165, 233, 0.25)',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    textAccentClass: 'text-sky-400',
    borderAccentClass: 'border-sky-500/30',
  },
  violet: {
    id: 'violet',
    name: 'Amethyst Violett',
    shortName: 'Amethyst / Flieder',
    description: 'Edles Flieder, Purpur und Lavendel',
    icon: '🔮',
    previewColor: '#a855f7',
    gradientClass: 'from-purple-500 via-fuchsia-500 to-indigo-600',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    textAccentClass: 'text-purple-400',
    borderAccentClass: 'border-purple-500/30',
  },
};

interface ThemeContextType {
  themeId: ThemeId;
  theme: ThemeConfig;
  setThemeId: (id: ThemeId) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('dw_theme') as ThemeId;
      if (saved && THEMES[saved]) return saved;
    } catch (e) {
      // ignore
    }
    return 'magenta';
  });

  const setThemeId = (id: ThemeId) => {
    if (!THEMES[id]) return;
    setThemeIdState(id);
    try {
      localStorage.setItem('dw_theme', id);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
  }, [themeId]);

  const value = {
    themeId,
    theme: THEMES[themeId],
    setThemeId,
    availableThemes: Object.values(THEMES),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
