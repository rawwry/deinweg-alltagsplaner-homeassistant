import React, { useEffect, useState } from 'react';
import { Calendar, ShoppingCart, BookOpen, MessageSquareText, Trash2, LayoutGrid, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { APP_VERSION } from '../../../../shared/version.js';

interface DesktopNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user, activeLocationId } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';
  const [openTicketCount, setOpenTicketCount] = useState<number>(0);

  useEffect(() => {
    if (!isStaff) return;
    let isMounted = true;
    const loadOpenCount = async () => {
      try {
        const res = await api.notes.countOpen(activeLocationId);
        if (isMounted) setOpenTicketCount(res.count);
      } catch {
        // ignore
      }
    };
    loadOpenCount();
    const interval = setInterval(loadOpenCount, 30000); // 30s polling
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isStaff, activeLocationId]);

  const navItems = [
    { id: 'hub', label: 'Übersicht', icon: Home },
    { id: 'mealplan', label: 'Wochenplan', icon: Calendar },
    { id: 'shopping', label: 'Einkaufsliste', icon: ShoppingCart },
    { id: 'recipes', label: 'Rezeptkatalog', icon: BookOpen },
    { id: 'notes', label: 'Notizen & Infos', icon: MessageSquareText, badge: isStaff && openTicketCount > 0 ? openTicketCount : undefined },
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
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                  {item.badge}
                </span>
              )}
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
        <div className="text-[11px] text-slate-400 mt-2.5 flex items-center">
          <a
            href="https://timovorwald.de"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors"
          >
            <span>© 2026 timovorwald.de</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
