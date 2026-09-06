import React from 'react';
import { Calendar, ShoppingCart, BookOpen, MessageSquareText, Trash2, LayoutGrid, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { APP_VERSION } from '../../../../shared/version.js';

interface DesktopNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const navItems = [
    { id: 'hub', label: 'Übersicht', icon: Home },
    { id: 'mealplan', label: 'Wochenplan', icon: Calendar },
    { id: 'shopping', label: 'Einkaufsliste', icon: ShoppingCart },
    { id: 'recipes', label: 'Rezeptkatalog', icon: BookOpen },
    { id: 'notes', label: 'Notizen & Infos', icon: MessageSquareText },
    { id: 'waste', label: 'Abfallkalender', icon: Trash2 },
    ...(isStaff ? [{ id: 'admin', label: 'Verwaltung', icon: LayoutGrid }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 justify-between flex-shrink-0">
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
          Hauptmenü
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-sky-950/80 text-sky-400 font-semibold border border-sky-800/60 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 px-3 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Version</span>
          <span className="font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md text-[11px]">
            v{APP_VERSION}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-2">
          Dein Weg • Ambulant Betreut
        </div>
      </div>
    </aside>
  );
};
