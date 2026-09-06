import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { APP_NAME, APP_VERSION } from '../../../../shared/version.js';
import { MapPin, LogOut, ChevronDown, User as UserIcon, Shield } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, locations, activeLocationId, setActiveLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('hub')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-sky-600 to-primary-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                  <path d="M7 2v20"/>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-bold text-slate-800 tracking-tight leading-none group-hover:text-sky-600 transition-colors">
                  {APP_NAME}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Ambulant Betreutes Wohnen
                </div>
              </div>
            </button>
          </div>

          {/* Center: Location Switcher / Location Indicator */}
          <div className="flex items-center">
            {isStaff ? (
              <div className="relative flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-xl px-3 py-1.5 transition-colors">
                <MapPin className="w-4 h-4 text-sky-600 mr-2 flex-shrink-0" />
                <span className="text-xs text-slate-500 mr-1 hidden md:inline">Standort:</span>
                <select
                  value={activeLocationId}
                  onChange={(e) => setActiveLocationId(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-5 appearance-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.residentCount ? `(${loc.residentCount} Bewohner)` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-900 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Standort: {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
              </div>
            )}
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 pl-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: user?.avatarColor || '#3b82f6' }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left leading-none">
                <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize mt-0.5 flex items-center gap-1">
                  {isStaff ? <Shield className="w-2.5 h-2.5 text-amber-600" /> : null}
                  {user?.role === 'BEWOHNER' ? 'Bewohner' : user?.role === 'BETREUER' ? 'Betreuer' : 'Admin'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Abmelden"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
