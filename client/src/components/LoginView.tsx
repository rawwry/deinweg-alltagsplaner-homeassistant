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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* App Logo & Title */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <img
              src={logoImg}
              alt={APP_NAME}
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Alltags- & Essensplanung im betreuten Wohnen
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-900 py-8 px-6 shadow-2xl shadow-black/40 rounded-3xl sm:px-10 border border-slate-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm rounded-xl font-medium flex items-start gap-2">
                <span className="text-rose-400 font-bold">!</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Benutzername
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="z. B. kevin oder betreuer"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="block w-full pl-10 pr-3 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Passwort
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-sky-500 bg-slate-800 border-slate-700 focus:ring-sky-500 rounded cursor-pointer"
                />
                <span className="ml-2 block text-sm font-medium text-slate-300">
                  Eingeloggt bleiben
                </span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-600/30 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all disabled:opacity-50"
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

          {/* Helpful Information Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            <p>
              Zugangsdaten für Bewohner und Betreuer werden durch die Einrichtungsleitung vergeben.
            </p>
          </div>
        </div>

        {/* Footer Version Tag */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Dein Weg Alltagsplaner <span className="font-semibold text-slate-400">v{APP_VERSION}</span>
        </p>
      </div>
    </div>
  );
};
