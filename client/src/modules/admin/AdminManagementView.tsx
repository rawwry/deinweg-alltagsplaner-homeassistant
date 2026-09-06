import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { APP_VERSION, APP_NAME } from '../../../../shared/version.js';
import {
  LayoutGrid,
  Users,
  MapPin,
  Tag,
  Key,
  Plus,
  CheckCircle2,
  Shield,
  Server,
  RefreshCw,
} from 'lucide-react';

export const AdminManagementView: React.FC = () => {
  const { user, locations, refreshLocations } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'locations' | 'prices' | 'system'>('users');

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('emsdetten2026!');
  const [newRole, setNewRole] = useState('BEWOHNER');
  const [newLocationId, setNewLocationId] = useState(locations[0]?.id || '');
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);

  // Password Reset State
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Ingredients & Prices
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [supermarkets, setSupermarkets] = useState<any[]>([]);
  const [selectedSupermarketId, setSelectedSupermarketId] = useState('supermarket-netto');

  // System Health
  const [healthInfo, setHealthInfo] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await api.users.list();
      setUsersList(data);
    } catch (err) {
      console.error('Fehler beim Laden der Benutzer:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchIngredientsAndMarkets = async () => {
    try {
      const [ingData, marketData] = await Promise.all([
        api.food.ingredients(selectedSupermarketId),
        api.food.supermarkets(),
      ]);
      setIngredients(ingData);
      setSupermarkets(marketData);
    } catch (err) {
      console.error('Fehler beim Laden der Zutaten & Märkte:', err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('./api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthInfo(data);
      }
    } catch (err) {
      console.error('Fehler beim Abrufen des Systemstatus:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') fetchUsers();
    if (activeSubTab === 'prices') fetchIngredientsAndMarkets();
    if (activeSubTab === 'system') fetchSystemInfo();
  }, [activeSubTab, selectedSupermarketId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) return;

    try {
      await api.users.create({
        username: newUsername.trim(),
        name: newName.trim(),
        password: newPassword,
        role: newRole,
        locationId: newRole === 'BEWOHNER' ? newLocationId : undefined,
      });

      setUserSuccessMsg(`Benutzer "${newName}" erfolgreich angelegt!`);
      setNewUsername('');
      setNewName('');
      setShowAddUser(false);
      fetchUsers();
      setTimeout(() => setUserSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Fehler: ${err.message || 'Benutzer konnte nicht angelegt werden.'}`);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPasswordVal.trim() || resetPasswordVal.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    try {
      await api.users.resetPassword(userId, resetPasswordVal);
      alert('Passwort erfolgreich geändert!');
      setResettingUserId(null);
      setResetPasswordVal('');
    } catch (err: any) {
      alert(`Fehler: ${err.message || 'Passwort konnte nicht zurückgesetzt werden.'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-sky-400" />
            <span>Verwaltung & Stammdaten</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zentrale Administration von Bewohnern, Passwörtern, Standorten und Preisen
          </p>
        </div>

        {/* Subtab navigation */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'users'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Benutzer & Bewohner
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('locations')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'locations'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standorte
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('prices')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'prices'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Supermärkte & Preise
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('system')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'system'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System
          </button>
        </div>
      </div>

      {userSuccessMsg && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{userSuccessMsg}</span>
        </div>
      )}

      {/* SUBTAB: USERS */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-100">
              Registrierte Benutzer ({usersList.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Neuen Benutzer / Bewohner anlegen</span>
            </button>
          </div>

          {showAddUser && (
            <form
              onSubmit={handleCreateUser}
              className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-3 animate-in fade-in duration-150"
            >
              <h4 className="text-sm font-bold text-slate-100">Neuen Zugang anlegen</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Benutzername</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="z.B. max"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voller Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial-Passwort</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rolle</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="BEWOHNER">Bewohner</option>
                    <option value="BETREUER">Betreuer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              {newRole === 'BEWOHNER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Standort zuweisen</label>
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Benutzer anlegen
                </button>
              </div>
            </form>
          )}

          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3">Benutzer</th>
                  <th className="px-5 py-3">Rolle</th>
                  <th className="px-5 py-3">Standort</th>
                  <th className="px-5 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px]"
                          style={{ backgroundColor: u.avatarColor || '#3b82f6' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{u.name}</div>
                          <div className="text-slate-500 font-mono text-[10px]">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950/70 text-purple-300 border-purple-800/40'
                            : u.role === 'BETREUER'
                            ? 'bg-sky-950/70 text-sky-300 border-sky-800/40'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {u.locationName || 'Alle Standorte (Global)'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {resettingUserId === u.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="text"
                            value={resetPasswordVal}
                            onChange={(e) => setResetPasswordVal(e.target.value)}
                            placeholder="Neues PW..."
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 w-28 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => setResettingUserId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setResettingUserId(u.id);
                            setResetPasswordVal('start1234!');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                        >
                          <Key className="w-3 h-3 text-slate-400" />
                          <span>Passwort zurücksetzen</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: LOCATIONS */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100">
            Konfigurierte Standorte ({locations.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-400" />
                    <h4 className="text-base font-bold text-slate-100">{loc.name}</h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                    {loc.residentCount || 0} Bewohner
                  </span>
                </div>

                {loc.address && (
                  <p className="text-xs text-slate-400">{loc.address}</p>
                )}

                <div className="pt-3 border-t border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Standard-Portionen:</span>
                    <span className="font-bold text-slate-200">{loc.defaultServings} Personen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Standard-Supermarkt:</span>
                    <span className="font-bold text-sky-400">
                      {loc.defaultSupermarketId ? 'Netto Marken-Discount' : 'Nicht festgelegt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB: PRICES */}
      {activeSubTab === 'prices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Zutaten & Richtpreise nach Supermarkt
              </h3>
              <p className="text-xs text-slate-400">
                Preise für automatische Wochenbudget-Schätzungen
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Supermarkt:</span>
              <select
                value={selectedSupermarketId}
                onChange={(e) => setSelectedSupermarketId(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
              >
                {supermarkets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3">Zutat</th>
                  <th className="px-5 py-3">Kategorie</th>
                  <th className="px-5 py-3">Einheit</th>
                  <th className="px-5 py-3 text-right">Richtpreis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-200">{ing.name}</td>
                    <td className="px-5 py-3 text-slate-400">{ing.category}</td>
                    <td className="px-5 py-3 text-slate-400">{ing.standardUnit}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-100">
                      {ing.pricePerUnit ? `${ing.pricePerUnit.toFixed(2)} €` : '-'}
                      {ing.priceUnitSize && (
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          / {ing.priceUnitSize} {ing.standardUnit}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: SYSTEM */}
      {activeSubTab === 'system' && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{APP_NAME}</h3>
              <p className="text-xs text-slate-400">Home Assistant Add-on Systemdiagnose</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Anwendungsversion
              </div>
              <div className="text-base font-extrabold text-slate-100 mt-1">
                v{APP_VERSION}
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Web-Port (HTTP)
              </div>
              <div className="text-base font-extrabold text-slate-100 mt-1">
                4731 (Kein Ingress / Cloudflare Tunnel)
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 sm:col-span-2">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                SQLite Speicherort
              </div>
              <div className="font-mono text-xs text-slate-200 mt-1 break-all font-semibold">
                {healthInfo?.database || '/share/deinweg-alltagsplaner/db/alltagsplaner.db'}
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 sm:col-span-2">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                PDF Export Verzeichnis
              </div>
              <div className="font-mono text-xs text-slate-200 mt-1 break-all font-semibold">
                {healthInfo?.exportDir || '/share/deinweg-alltagsplaner/export'}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Status: Online & Betriebsbereit</span>
            <button
              type="button"
              onClick={fetchSystemInfo}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
