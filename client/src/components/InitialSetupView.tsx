import React, { useState } from 'react';
import { api, setStoredToken } from '../api/client.js';
import { APP_NAME, APP_VERSION } from '../../../shared/version.js';
import { ShieldCheck, Mail, Lock, User, UserCheck, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserSummary } from '../../../shared/types.js';

interface InitialSetupViewProps {
  onComplete: (user: UserSummary, token: string) => void;
}

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanName || !cleanEmail || !password) {
      setError('Bitte fülle alle Pflichtfelder vollständig aus.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Bitte gib eine gültige Firmen-E-Mail-Adresse ein.');
      return;
    }

    if (password.length < 6) {
      setError('Das Administrator-Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.auth.setup({
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        password,
      });

      setStoredToken(res.token);
      onComplete(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Die Initialisierung ist fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-sky-600/30 text-white mb-4 ring-1 ring-white/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/90 border border-sky-800/80 text-sky-300 text-xs font-bold tracking-wide uppercase mb-2">
            Ersteinrichtung & Administrator
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Erstelle das erste Betreuer- und Administrator-Konto für Deine Einrichtung
          </p>
        </div>

        {/* Setup Card */}
        <div className="mt-6 bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl shadow-black/60 rounded-3xl sm:px-10 border border-slate-800">
          {/* Important Company Email Notice */}
          <div className="mb-6 p-4 bg-sky-950/60 border border-sky-700/60 text-sky-200 text-xs rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-sky-300 block mb-1">
                Wichtiger Hinweis zur E-Mail-Adresse:
              </span>
              Bitte verwende hier zwingend Deine offizielle <strong>Firmen-E-Mail-Adresse</strong> (z. B.{' '}
              <span className="font-mono text-sky-300">vorname.nachname@deinweg.de</span>). Dieser erste
              Account erhält volle Betreuer- und Administratorrechte. Bewohner, weitere Standorte und Betreuer
              legst Du anschließend im Backend an.
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-sm rounded-xl font-medium flex items-center gap-2">
              <span className="text-rose-400 font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Benutzername (Login) *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="z. B. admin oder marcel"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Vollständiger Name *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Marcel Mustermann"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Firmen-E-Mail-Adresse *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vorname.nachname@deinweg.de"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Wird für Administrator-Meldungen und Benachrichtigungen hinterlegt.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin-Passwort *
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Passwort bestätigen *
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Wiederholen"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-600/30 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <span>Alltagsplaner initialisieren & Administrator anlegen</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Dein Weg Alltagsplaner <span className="font-semibold text-slate-400">v{APP_VERSION}</span>
        </p>
      </div>
    </div>
  );
};
