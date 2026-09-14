import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { APP_NAME, APP_VERSION } from '../../../../shared/version.js';
import { MapPin, LogOut, ChevronDown, User as UserIcon, Shield, Settings } from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, locations, activeLocationId, setActiveLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  return (
    <header className="bg-surface-card/90 backdrop-blur-xl border-b border-surface-border sticky top-0 z-30 shadow-xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo (prominently sized, clean without extra text) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentTab('hub')}
              className="flex items-center focus:outline-none group py-1 cursor-pointer"
              title="Zur Übersicht"
            >
              <img
                src={logoImg}
                alt="Dein Weg"
                className="h-10 sm:h-11 md:h-12 w-auto max-h-12 object-contain transition-transform group-hover:scale-105 duration-200 filter drop-shadow-md"
              />
            </button>
          </div>

          {/* Center: Location Switcher / Location Indicator */}
          <div className="flex items-center">
            {isStaff ? (
              <div className="relative flex items-center bg-surface-elevated/90 hover:bg-surface-elevated border border-surface-border hover:border-amber-500/40 rounded-2xl px-4 py-2 transition-all shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 animate-pulse flex-shrink-0" />
                <span className="text-xs text-slate-400 mr-1.5 hidden md:inline font-medium">Standort:</span>
                <select
                  value={activeLocationId}
                  onChange={(e) => setActiveLocationId(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-100 focus:outline-none cursor-pointer pr-5 appearance-none font-sans"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-surface-card text-slate-100">
                      {loc.name} {loc.residentCount ? `(${loc.residentCount} Bewohner)` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/15 to-amber-500/15 border border-rose-500/30 rounded-2xl text-slate-200 text-xs font-bold shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wide uppercase font-sans">WG {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
              </div>
            )}
          </div>

          {/* Right: User Profile, Administration Button (Gear) & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 pl-2 py-1 px-2.5 rounded-2xl bg-surface-elevated/60 border border-surface-border">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-md ring-2 ring-surface-border"
                style={{ backgroundColor: user?.avatarColor || '#e11d48' }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-200 font-sans">{user?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                  {isStaff ? <Shield className="w-2.5 h-2.5 text-amber-400" /> : null}
                  {user?.role === 'BEWOHNER' ? 'Bewohner' : user?.role === 'BETREUER' ? 'Betreuer' : 'Admin'}
                </div>
              </div>
            </div>

            {/* Admin Management Button (Zahnrad) directly next to Logout */}
            {isStaff && (
              <button
                type="button"
                onClick={() => setCurrentTab('admin')}
                title="Verwaltung & Einstellungen"
                aria-label="Verwaltung"
                className={`p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/50'
                    : 'bg-surface-elevated/90 text-slate-300 hover:bg-white/10 hover:text-white border border-surface-border'
                }`}
              >
                <Settings className={`w-5 h-5 transition-transform duration-300 ${currentTab === 'admin' ? 'rotate-90 text-white' : 'text-slate-300 group-hover:rotate-45'}`} />
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              title="Abmelden"
              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-2xl transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
