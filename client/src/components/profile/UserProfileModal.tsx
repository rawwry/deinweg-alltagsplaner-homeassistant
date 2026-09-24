import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Trash2,
  X,
  Check,
  User,
  LogOut,
  Palette,
  Shield,
  Home,
  Save,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme, ThemeId } from '../../context/ThemeContext.js';
import { formatGermanDate } from '../../utils/formatters.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateCurrentUser, logout, activeLocation } = useAuth();
  const { themeId, setThemeId, availableThemes } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [activeTheme, setActiveTheme] = useState<ThemeId>(themeId);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setBirthday(user.birthday || '');
      setAvatarPreview(user.avatarUrl || null);
      setActiveTheme(themeId);
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, user, themeId]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const isStaff = user.role === 'ADMIN' || user.role === 'BETREUER';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine Bilddatei aus (PNG, JPEG oder WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Fehler bei der Bildverarbeitung.');
          return;
        }

        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, size, size);

        let dataUrl = canvas.toDataURL('image/webp', 0.85);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        setAvatarPreview(dataUrl);
      };
      img.onerror = () => {
        setError('Das Bild konnte nicht geladen werden.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleThemeChange = (id: ThemeId) => {
    setActiveTheme(id);
    setThemeId(id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Bitte gib deinen Namen an.');
      return;
    }

    if (password && password.length < 4) {
      setError('Das neue Passwort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.users.updateMe({
        name: name.trim(),
        email: email.trim() || undefined,
        birthday: birthday || undefined,
        password: password.trim() || undefined,
        avatarUrl: avatarPreview,
      });

      updateCurrentUser(res.user);
      setSuccess('Profil erfolgreich gespeichert!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern des Profils.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Möchtest du dich wirklich abmelden?')) {
      onClose();
      logout();
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] min-h-screen min-h-[100dvh] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-surface-card rounded-[2.5rem] max-w-xl w-full border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-theme-subtle text-theme-primary border border-theme">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-white">
                Mein Profil & Einstellungen
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Verwalte deine persönlichen Daten, dein Profilbild und dein Farbschema.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-2xl hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Status Messages */}
          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
              <span className="font-bold">Hinweis:</span> {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. Profilbild & Stammdaten Quick-Badge */}
          <div className="bg-surface-elevated/70 border border-surface-border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-inner">
            <div className="relative group shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover ring-3 ring-theme-border shadow-xl"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow-xl ring-3 ring-surface-border"
                  style={{ backgroundColor: user.avatarColor || '#e11d48' }}
                >
                  {name.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-surface-card text-slate-300 border border-surface-border">
                  @{user.username}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full badge-theme flex items-center gap-1">
                  {isStaff ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  <span>{isStaff ? 'Betreuer' : 'Bewohner'}</span>
                </span>
                {(user.locationName || activeLocation?.name) && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Home className="w-3 h-3 text-slate-500" />
                    <span>WG {user.locationName || activeLocation?.name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-theme-subtle hover:bg-theme-subtle/80 text-theme-text border border-theme text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Foto auswählen</span>
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => setAvatarPreview(null)}
                    className="p-1.5 rounded-xl bg-surface-card hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-surface-border transition-colors cursor-pointer"
                    title="Foto entfernen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 2. Persönliche Daten */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-theme-primary" />
                <span>Persönliche Angaben</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Angezeigter Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vor- und Nachname"
                    required
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.de"
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Geburtstag</span>
                    {birthday && (
                      <span className="text-[11px] text-theme font-mono font-medium">
                        ({formatGermanDate(birthday)})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-theme-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Neues Passwort (optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nur ausfüllen bei Änderung"
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>
              </div>

              {password && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Neues Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    required={!!password}
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>
              )}
            </div>

            {/* 3. Farbschema / Themes */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Persönliches Farbschema</span>
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full badge-theme">
                  {availableThemes.find((t) => t.id === activeTheme)?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableThemes.map((config) => {
                  const isSelected = activeTheme === config.id;
                  return (
                    <button
                      key={config.id}
                      type="button"
                      onClick={() => handleThemeChange(config.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-surface-elevated ring-2'
                          : 'bg-surface-elevated/40 border-surface-border hover:bg-surface-elevated hover:border-surface-border/80'
                      }`}
                      style={{
                        borderColor: isSelected ? config.previewColor : undefined,
                        boxShadow: isSelected ? `0 6px 20px -4px ${config.glowColor}` : undefined,
                      }}
                    >
                      {/* Mini colored preview button */}
                      <div
                        className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-white text-center shadow-xs flex items-center justify-center gap-1.5"
                        style={{
                          background: `linear-gradient(135deg, ${config.fromColor} 0%, ${config.toColor} 100%)`,
                          boxShadow: `0 2px 8px ${config.glowColor}`,
                        }}
                      >
                        <span>{config.shortName}</span>
                      </div>
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-medium text-slate-400">
                          {config.category === 'subtle' ? 'Dezent' : 'Klassisch'}
                        </span>
                        {isSelected && (
                          <span
                            className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0"
                            style={{ backgroundColor: config.previewColor }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Speichern & Abbrechen Buttons */}
            <div className="pt-4 border-t border-surface-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer hover:border-rose-500/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-surface-elevated hover:bg-surface-card text-slate-300 text-xs font-semibold border border-surface-border transition-colors cursor-pointer"
                >
                  Schließen
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-theme-gradient px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Wird gespeichert...' : 'Speichern'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
