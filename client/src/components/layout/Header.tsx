import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { ChevronDown, Shield, Settings, Camera } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { UserProfileModal } from '../profile/UserProfileModal.js';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { user, locations, activeLocationId, setActiveLocationId, activeLocation } = useAuth();
  const isStaff = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'BETREUER';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="bg-surface-card/90 backdrop-blur-xl border-b border-surface-border sticky top-0 z-30 shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Brand Logo (prominently sized, clean without extra text) */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setCurrentTab('hub')}
                className="flex items-center focus:outline-none group py-1 cursor-pointer"
                title="Zur Übersicht"
              >
                <img
                  src={logoImg}
                  alt="Deine WG"
                  className="h-9 sm:h-11 md:h-12 w-auto max-h-12 object-contain transition-transform group-hover:scale-105 duration-200 filter drop-shadow-md"
                />
              </button>
            </div>

            {/* Center: Location Switcher (Staff) / Location Indicator (Residents - hidden on mobile) */}
            <div className="flex items-center min-w-0">
              {isStaff ? (
                <div className="relative flex items-center bg-surface-elevated/90 hover:bg-surface-elevated border border-surface-border hover:border-theme rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all shadow-inner max-w-[140px] sm:max-w-none">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-theme-primary mr-1.5 sm:mr-2.5 animate-pulse flex-shrink-0 shadow-sm" />
                  <span className="text-xs text-slate-400 mr-1.5 hidden md:inline font-medium">Standort:</span>
                  <select
                    value={activeLocationId}
                    onChange={(e) => setActiveLocationId(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer pr-4 sm:pr-5 appearance-none font-sans truncate"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-surface-card text-slate-100">
                        {loc.name} {loc.residentCount ? `(${loc.residentCount})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 sm:right-3 pointer-events-none shrink-0" />
                </div>
              ) : (
                /* Hidden for residents on mobile (< 640px) as requested */
                <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-theme-subtle border border-theme rounded-2xl text-slate-200 text-xs font-semibold shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
                  <span className="tracking-wide uppercase font-sans">WG {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
                </div>
              )}
            </div>

            {/* Right: User Profile & Administration Button (Gear) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Profile Info & Avatar (Clickable to open Profile & Settings) */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title="Mein Profil & Einstellungen"
                className="group flex items-center gap-2 sm:gap-2.5 pl-1 sm:pl-1.5 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-2xl bg-surface-elevated/60 hover:bg-surface-elevated border border-surface-border hover:border-theme transition-all cursor-pointer text-left"
              >
                <div className="relative shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || 'Profil'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-theme-border group-hover:ring-theme shadow-md"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-md ring-2 ring-surface-border group-hover:ring-theme transition-all"
                      style={{ backgroundColor: user?.avatarColor || '#e11d48' }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 group-hover:text-theme-primary opacity-80 group-hover:opacity-100 transition-all">
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </div>

                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-200 font-sans group-hover:text-white transition-colors truncate max-w-[120px]">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isStaff ? <Shield className="w-2.5 h-2.5 text-theme-primary" /> : null}
                    <span>{isStaff ? 'Betreuer' : 'Bewohner'}</span>
                  </div>
                </div>
              </button>

              {/* Admin Management Button (Zahnrad) for Staff */}
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('admin')}
                  title="Verwaltung & Einstellungen"
                  aria-label="Verwaltung"
                  className={`p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
                    currentTab === 'admin'
                      ? 'btn-theme-gradient text-white shadow-lg ring-1 ring-white/30'
                      : 'bg-surface-elevated/90 text-slate-300 hover:bg-white/10 hover:text-white border border-surface-border'
                  }`}
                >
                  <Settings className={`w-5 h-5 transition-transform duration-300 ${currentTab === 'admin' ? 'rotate-90 text-white' : 'text-slate-300 group-hover:rotate-45'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* User Profile & Settings Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};

