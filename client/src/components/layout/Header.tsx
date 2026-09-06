import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { APP_NAME, APP_VERSION } from '../../../../shared/version.js';
import { MapPin, LogOut, ChevronDown, User as UserIcon, Shield, LayoutGrid } from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, locations, activeLocationId, setActiveLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-md shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('hub')}
              className="flex items-center gap-3 text-left focus:outline-none group"
              title="Zur Übersicht"
            >
              <img
                src={logoImg}
                alt={APP_NAME}
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
              />
              <div className="hidden lg:block border-l border-slate-800 pl-3">
                <div className="text-xs font-bold text-slate-100 tracking-tight leading-none group-hover:text-sky-400 transition-colors">
                  {APP_NAME}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ambulant Betreutes Wohnen
                </div>
              </div>
            </button>
          </div>

          {/* Center: Location Switcher / Location Indicator */}
          <div className="flex items-center">
            {isStaff ? (
              <div className="relative flex items-center bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-xl px-3 py-1.5 transition-colors shadow-inner">
                <MapPin className="w-4 h-4 text-sky-400 mr-2 flex-shrink-0" />
                <span className="text-xs text-slate-400 mr-1 hidden md:inline">Standort:</span>
                <select
                  value={activeLocationId}
                  onChange={(e) => setActiveLocationId(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer pr-5 appearance-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-slate-800 text-slate-100">
                      {loc.name} {loc.residentCount ? `(${loc.residentCount} Bewohner)` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/60 border border-sky-800/80 rounded-xl text-sky-300 text-xs font-semibold shadow-inner">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Standort: {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
              </div>
            )}
          </div>

          {/* Right: User Profile, Administration Button & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 pl-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-slate-800"
                style={{ backgroundColor: user?.avatarColor || '#3b82f6' }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left leading-none">
                <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize mt-0.5 flex items-center gap-1">
                  {isStaff ? <Shield className="w-2.5 h-2.5 text-amber-400" /> : null}
                  {user?.role === 'BEWOHNER' ? 'Bewohner' : user?.role === 'BETREUER' ? 'Betreuer' : 'Admin'}
                </div>
              </div>
            </div>

            {/* Admin Management Button directly next to Logout */}
            {isStaff && (
              <button
                type="button"
                onClick={() => setCurrentTab('admin')}
                title="Verwaltung"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  currentTab === 'admin'
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/40 ring-1 ring-sky-400/50'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/90 hover:text-white border border-slate-700/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Verwaltung</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              title="Abmelden"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
