import React, { useState, useRef } from 'react';
import { Camera, Trash2, X, Check, UploadCloud } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string; // Optional: if admin edits someone else's avatar
  currentAvatarUrl?: string | null;
  onAvatarUpdated?: (newUrl: string | null) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  currentAvatarUrl,
  onAvatarUpdated,
}) => {
  const { user, updateCurrentUserAvatar } = useAuth();
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || user?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isSelf = !targetUserId || targetUserId === user?.id;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine gültige Bilddatei aus (PNG, JPEG oder WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Canvas square crop & compression to 256x256
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Bildverarbeitung fehlgeschlagen.');
          return;
        }

        // Center crop math
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, size, size);

        // Try webp first, fallback to jpeg
        let dataUrl = canvas.toDataURL('image/webp', 0.85);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        setPreview(dataUrl);
      };
      img.onerror = () => {
        setError('Das Bild konnte nicht geladen werden.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSelf) {
        const res = await api.users.uploadMyAvatar(preview);
        updateCurrentUserAvatar(res.avatarUrl);
        if (onAvatarUpdated) onAvatarUpdated(res.avatarUrl);
      } else if (targetUserId) {
        await api.users.update(targetUserId, { avatarUrl: preview });
        if (onAvatarUpdated) onAvatarUpdated(preview);
      }
      onClose();
    } catch (err: any) {
      console.error('Fehler beim Speichern des Profilbilds:', err);
      setError(err?.message || 'Fehler beim Speichern des Profilbilds.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSelf) {
        await api.users.uploadMyAvatar(null);
        updateCurrentUserAvatar(null);
        if (onAvatarUpdated) onAvatarUpdated(null);
      } else if (targetUserId) {
        await api.users.update(targetUserId, { avatarUrl: null });
        if (onAvatarUpdated) onAvatarUpdated(null);
      }
      setPreview(null);
      onClose();
    } catch (err: any) {
      console.error('Fehler beim Entfernen des Profilbilds:', err);
      setError(err?.message || 'Fehler beim Entfernen des Profilbilds.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Profilbild anpassen</h3>
              <p className="text-xs text-slate-400">Eigenes Foto oder Avatar hochladen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Content & Preview */}
        <div className="my-6 flex flex-col items-center">
          <div className="relative group mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500/40 bg-slate-800 flex items-center justify-center shadow-lg shadow-pink-500/10">
              {preview ? (
                <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <UploadCloud className="w-10 h-10 mb-1" />
                  <span className="text-[11px] font-medium">Kein Foto</span>
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white font-medium text-xs gap-1.5"
            >
              <Camera className="w-4 h-4" />
              Ändern
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-pink-400" />
            Neues Foto auswählen
          </button>
          <span className="text-[11px] text-slate-500 mt-2">
            Automatische quadratische Zentrierung & Web-Optimierung
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
          {preview ? (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              type="button"
              className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bild entfernen
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-md shadow-pink-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isLoading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
