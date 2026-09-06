import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ShoppingCart,
  BookOpen,
  MessageSquareText,
  Trash2,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';

interface DesktopNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user, activeLocationId } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';
  const [openTicketCount, setOpenTicketCount] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('deinweg_sidebar_collapsed') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('deinweg_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

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
    { id: 'recipes', label: 'Rezepte', icon: BookOpen },
    { id: 'notes', label: 'WG-Pinnwand', icon: MessageSquareText, badge: isStaff && openTicketCount > 0 ? openTicketCount : undefined },
    { id: 'waste', label: 'Abfallkalender', icon: Trash2 },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 h-full p-3 justify-between flex-shrink-0 transition-all duration-300 ease-in-out select-none overflow-y-auto`}
    >
      <div>
        {/* Header with Collapse / Expand Toggle */}
        <div className={`flex items-center mb-3 px-2 py-1.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Menü
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-2 rounded-xl text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-all active:scale-95 shadow-xs"
            title={isCollapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'}
            aria-label={isCollapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-sky-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Hauptnavigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all group relative cursor-pointer ${
                  isCollapsed ? 'justify-center' : 'text-left'
                } ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30 shadow-md shadow-sky-950/50'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-sky-400 rounded-r-full shadow-md shadow-sky-400/60" />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 duration-200 ${
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {/* Collapsed Badge (Pulse Dot) */}
                  {isCollapsed && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
                  )}
                </div>

                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-xs font-mono">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modern Bottom Card */}
      {!isCollapsed ? (
        <div className="pt-3 border-t border-slate-800/80 px-1 text-center animate-in fade-in duration-200">
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 shadow-inner">
            <div className="text-xs font-bold text-slate-200">Dein Weg WG-Planer</div>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight font-medium">
              Taktische Skill-Issue-Prävention
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-800/80 flex justify-center text-xs text-slate-400" title="Taktische Skill-Issue-Prävention">
          <span className="font-mono text-[10px]">✨</span>
        </div>
      )}
    </aside>
  );
};
