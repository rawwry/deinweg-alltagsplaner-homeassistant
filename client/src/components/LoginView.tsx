import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { APP_NAME, APP_VERSION } from '../../../shared/version.js';
import { LogIn, Eye, EyeOff, Lock, User } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Bitte Benutzername und Passwort eingeben.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(username.trim(), password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Animated Prominent Logo (Crisp High-Res PNG, perfectly proportioned) */}
        <div className="flex flex-col items-center justify-center mb-8 relative">
          {/* Subtle soft glowing aura behind logo */}
          <div className="absolute inset-0 max-w-[16rem] mx-auto bg-sky-500/15 blur-2xl rounded-full animate-pulse-glow pointer-events-none" />
          <div className="relative animate-float transition-transform duration-300">
            <img
              src={logoImg}
              alt={APP_NAME}
              className="h-16 sm:h-20 w-auto max-w-[280px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Modern Frosted Glass Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 shadow-2xl shadow-black/70 rounded-3xl sm:px-10 border border-slate-800/90 ring-1 ring-white/5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs sm:text-sm rounded-2xl font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="text-rose-400 font-bold text-base leading-none">!</span>
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Benutzername
              </label>
              <div className="relative rounded-2xl shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="z. B. kevin oder betreuer"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 text-sm transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Passwort
              </label>
              <div className="relative rounded-2xl shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 text-sm transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-sky-500 bg-slate-950 border-slate-700 rounded-lg focus:ring-sky-500/40 cursor-pointer"
                />
                <span className="ml-2.5 block text-xs font-medium text-slate-300">
                  Eingeloggt bleiben
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg shadow-sky-600/30 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Anmelden</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Information Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <p>
              Zugangsdaten für Bewohner und Betreuer werden durch die Einrichtungsleitung vergeben.
            </p>
          </div>
        </div>

        {/* Footer Version Tag */}
        <p className="mt-6 text-center text-xs text-slate-500 font-mono">
          Dein Weg Planner Tool · <span className="font-semibold text-slate-400">v{APP_VERSION}</span>
        </p>
      </div>
    </div>
  );
};
