import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { APP_NAME, APP_VERSION } from '../../../shared/version.js';
import { LogIn, Eye, EyeOff, Lock, User, Info } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoHelp, setShowDemoHelp] = useState(false);

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

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* App Logo & Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-sky-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 text-white mb-4">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
              <path d="M7 2v20"/>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Alltags- & Essensplanung im betreuten Wohnen
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium flex items-start gap-2">
                <span className="text-rose-500 font-bold">!</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Benutzername
              </label>
              <div className="relative rounded-xl shadow-sm">
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
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Passwort
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
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
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded cursor-pointer"
                />
                <span className="ml-2 block text-sm font-medium text-slate-600">
                  Eingeloggt bleiben
                </span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-sky-600/20 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all disabled:opacity-50"
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

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoHelp(!showDemoHelp)}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 mx-auto"
            >
              <Info className="w-3.5 h-3.5" />
              {showDemoHelp ? 'Schnellzugänge verbergen' : 'Initial-Zugänge anzeigen (Klick zum Ausfüllen)'}
            </button>

            {showDemoHelp && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                <div className="font-semibold text-slate-700">Bewohner Emsdetten (PW: emsdetten2026!):</div>
                <div className="flex flex-wrap gap-1.5">
                  {['kevin', 'dennis', 'godfirst', 'arne', 'ertugrul', 'udo'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleFillDemo(u, 'emsdetten2026!')}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-sky-50 hover:border-sky-300 font-medium transition-colors"
                    >
                      {u}
                    </button>
                  ))}
                </div>

                <div className="font-semibold text-slate-700 pt-1">Betreuer & Admin:</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('betreuer', 'betreuer2026!')}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-sky-700 hover:bg-sky-50 hover:border-sky-300 font-medium transition-colors"
                  >
                    betreuer (PW: betreuer2026!)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin', 'admin2026!')}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-sky-50 hover:border-sky-300 font-medium transition-colors"
                  >
                    admin (PW: admin2026!)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Version Tag */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Dein Weg Alltagsplaner <span className="font-semibold text-slate-500">v{APP_VERSION}</span>
        </p>
      </div>
    </div>
  );
};
