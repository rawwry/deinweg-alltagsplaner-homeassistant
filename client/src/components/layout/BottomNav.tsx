import React, { useEffect, useState } from 'react';
import { Calendar, ShoppingCart, BookOpen, MessageSquareText, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
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
    const interval = setInterval(loadOpenCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isStaff, activeLocationId]);

  const navItems = [
    { id: 'mealplan', label: 'Wochenplan', icon: Calendar },
    { id: 'shopping', label: 'Einkauf', icon: ShoppingCart },
    { id: 'recipes', label: 'Rezepte', icon: BookOpen },
    { id: 'notes', label: 'Notizen', icon: MessageSquareText, badge: isStaff && openTicketCount > 0 ? openTicketCount : undefined },
    { id: 'waste', label: 'Abfall', icon: Trash2 },
  ];

  return (
    <div className="md:hidden flex-shrink-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 shadow-xl shadow-black/40">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors relative ${
                  isActive ? 'bg-sky-950 text-sky-400 border border-sky-800/60 shadow-inner' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
