import React from 'react';
import { Calendar, ShoppingCart, BookOpen, MessageSquareText, Trash2, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const navItems = [
    { id: 'mealplan', label: 'Wochenplan', icon: Calendar },
    { id: 'shopping', label: 'Einkauf', icon: ShoppingCart },
    { id: 'recipes', label: 'Rezepte', icon: BookOpen },
    { id: 'notes', label: 'Notizen', icon: MessageSquareText },
    { id: 'waste', label: 'Müll', icon: Trash2 },
    ...(isStaff ? [{ id: 'admin', label: 'Verwaltung', icon: LayoutGrid }] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg shadow-slate-900/5">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-sky-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-sky-100/80 text-sky-700' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
