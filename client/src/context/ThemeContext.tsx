import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId =
  | 'magenta'
  | 'slate'
  | 'sage'
  | 'sand'
  | 'midnight'
  | 'ocean'
  | 'amber'
  | 'emerald'
  | 'violet';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  shortName: string;
  description: string;
  icon?: string;
  previewColor: string;
  fromColor: string;
  toColor: string;
  subtleColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  gradientClass: string;
  badgeClass: string;
  textAccentClass: string;
  borderAccentClass: string;
  category: 'brand' | 'subtle' | 'vibrant';
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  magenta: {
    id: 'magenta',
    name: 'Dein Weg Magenta (Standard)',
    shortName: 'Magenta / Pink',
    description: 'Offizielles Design mit lebendigen Pink-, Magenta- und Rosétönen',
    previewColor: '#e11d48',
    fromColor: '#e11d48',
    toColor: '#ec4899',
    subtleColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.28)',
    textColor: '#fda4af',
    glowColor: 'rgba(225, 29, 72, 0.25)',
    gradientClass: 'from-rose-500 via-pink-500 to-rose-600',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    textAccentClass: 'text-rose-400',
    borderAccentClass: 'border-rose-500/30',
    category: 'brand',
  },
  slate: {
    id: 'slate',
    name: 'Nordic Slate',
    shortName: 'Schiefer / Graphit',
    description: 'Dezent, zeitlos und minimalistisch – kühles Schiefergrau & Graphit',
    previewColor: '#64748b',
    fromColor: '#64748b',
    toColor: '#475569',
    subtleColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    textColor: '#cbd5e1',
    glowColor: 'rgba(148, 163, 184, 0.20)',
    gradientClass: 'from-slate-500 to-slate-700',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    textAccentClass: 'text-slate-300',
    borderAccentClass: 'border-slate-500/30',
    category: 'subtle',
  },
  sage: {
    id: 'sage',
    name: 'Sanftes Salbei',
    shortName: 'Salbei / Eukalyptus',
    description: 'Dezent, beruhigend und natürlich – gedämpftes Salbei- und Waldgrün',
    previewColor: '#52796f',
    fromColor: '#52796f',
    toColor: '#354f52',
    subtleColor: 'rgba(82, 121, 111, 0.14)',
    borderColor: 'rgba(107, 144, 128, 0.28)',
    textColor: '#a3b18a',
    glowColor: 'rgba(107, 144, 128, 0.22)',
    gradientClass: 'from-[#52796f] to-[#354f52]',
    badgeClass: 'bg-[#52796f]/15 text-[#a3b18a] border-[#52796f]/30',
    textAccentClass: 'text-[#a3b18a]',
    borderAccentClass: 'border-[#52796f]/30',
    category: 'subtle',
  },
  sand: {
    id: 'sand',
    name: 'Warmes Kaschmir',
    shortName: 'Sand / Kaschmir',
    description: 'Dezent, warm und wohnlich – sanfter Sandstein & Terrakotta',
    previewColor: '#b5835a',
    fromColor: '#b5835a',
    toColor: '#8b5a3e',
    subtleColor: 'rgba(181, 131, 90, 0.14)',
    borderColor: 'rgba(181, 131, 90, 0.28)',
    textColor: '#ddb892',
    glowColor: 'rgba(181, 131, 90, 0.22)',
    gradientClass: 'from-[#b5835a] to-[#8b5a3e]',
    badgeClass: 'bg-[#b5835a]/15 text-[#ddb892] border-[#b5835a]/30',
    textAccentClass: 'text-[#ddb892]',
    borderAccentClass: 'border-[#b5835a]/30',
    category: 'subtle',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Indigo',
    shortName: 'Nachtblau / Indigo',
    description: 'Dezent, tiefgründig und edel – dezentes Nacht- und Tiefseeblau',
    previewColor: '#6366f1',
    fromColor: '#6366f1',
    toColor: '#4338ca',
    subtleColor: 'rgba(99, 102, 241, 0.14)',
    borderColor: 'rgba(99, 102, 241, 0.28)',
    textColor: '#c7d2fe',
    glowColor: 'rgba(99, 102, 241, 0.22)',
    gradientClass: 'from-indigo-500 to-indigo-700',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    textAccentClass: 'text-indigo-400',
    borderAccentClass: 'border-indigo-500/30',
    category: 'subtle',
  },
  ocean: {
    id: 'ocean',
    name: 'Nordic Ocean',
    shortName: 'Ozean / Cyan',
    description: 'Klares Nordisches Cyan und frisches Azurblau',
    previewColor: '#0ea5e9',
    fromColor: '#0ea5e9',
    toColor: '#2563eb',
    subtleColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(14, 165, 233, 0.28)',
    textColor: '#7dd3fc',
    glowColor: 'rgba(14, 165, 233, 0.25)',
    gradientClass: 'from-sky-500 via-cyan-500 to-blue-600',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    textAccentClass: 'text-sky-400',
    borderAccentClass: 'border-sky-500/30',
    category: 'vibrant',
  },
  amber: {
    id: 'amber',
    name: 'Cozy Amber',
    shortName: 'Bernstein / Honig',
    description: 'Warme Honig-, Bernstein- und Terrakotta-Töne',
    previewColor: '#f59e0b',
    fromColor: '#f59e0b',
    toColor: '#f97316',
    subtleColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
    textColor: '#fcd34d',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    gradientClass: 'from-amber-500 via-orange-500 to-rose-500',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    textAccentClass: 'text-amber-400',
    borderAccentClass: 'border-amber-500/30',
    category: 'vibrant',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    shortName: 'Smaragd / Salbei',
    description: 'Frisches Salbei-, Minz- und Smaragdgrün',
    previewColor: '#10b981',
    fromColor: '#10b981',
    toColor: '#059669',
    subtleColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    textColor: '#6ee7b7',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    gradientClass: 'from-emerald-500 via-teal-500 to-emerald-600',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    textAccentClass: 'text-emerald-400',
    borderAccentClass: 'border-emerald-500/30',
    category: 'vibrant',
  },
  violet: {
    id: 'violet',
    name: 'Amethyst Violett',
    shortName: 'Amethyst / Flieder',
    description: 'Edles Flieder, Purpur und Lavendel',
    previewColor: '#a855f7',
    fromColor: '#a855f7',
    toColor: '#ec4899',
    subtleColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.28)',
    textColor: '#d8b4fe',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    gradientClass: 'from-purple-500 via-fuchsia-500 to-indigo-600',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    textAccentClass: 'text-purple-400',
    borderAccentClass: 'border-purple-500/30',
    category: 'vibrant',
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
