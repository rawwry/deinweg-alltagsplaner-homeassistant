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
  Mail,
  Trash2,
  Send,
  AlertTriangle,
  Eye,
  EyeOff,
  Building2,
  X,
  Search,
  Check,
} from 'lucide-react';

export const AdminManagementView: React.FC = () => {
  const { user, locations, refreshLocations } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'locations' | 'prices' | 'smtp' | 'system'>('users');

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('start2026!');
  const [newRole, setNewRole] = useState<'BEWOHNER' | 'BETREUER'>('BEWOHNER');
  const [newLocationId, setNewLocationId] = useState(locations[0]?.id || '');
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);

  // Password Reset State
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Locations State
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocServings, setNewLocServings] = useState<number>(6);
  const [newLocSupermarketId, setNewLocSupermarketId] = useState('supermarket-netto');
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Resident Assignment to Location State
  const [assigningLocation, setAssigningLocation] = useState<any | null>(null);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Ingredients & Prices State
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [supermarkets, setSupermarkets] = useState<any[]>([]);
  const [selectedSupermarketId, setSelectedSupermarketId] = useState('supermarket-netto');

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Dein Weg Alltagsplaner');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState<string | null>(null);

  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // System Health State
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

  const fetchSmtpSettings = async () => {
    try {
      setIsLoadingSmtp(true);
      const data = await api.admin.getSmtp();
      if (data) {
        setSmtpHost(data.host || '');
        setSmtpPort(data.port || 587);
        setSmtpSecure(!!data.secure);
        setSmtpUser(data.user || '');
        setSmtpPassword(data.password || '');
        setSmtpFromEmail(data.fromEmail || '');
        setSmtpFromName(data.fromName || 'Dein Weg Alltagsplaner');
        setSmtpConfigured(!!data.configured);
      }
    } catch (err) {
      console.error('Fehler beim Laden der SMTP-Einstellungen:', err);
    } finally {
      setIsLoadingSmtp(false);
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
    if (activeSubTab === 'users' || activeSubTab === 'locations') fetchUsers();
    if (activeSubTab === 'locations' || activeSubTab === 'prices') fetchIngredientsAndMarkets();
    if (activeSubTab === 'smtp') fetchSmtpSettings();
    if (activeSubTab === 'system') fetchSystemInfo();
  }, [activeSubTab, selectedSupermarketId]);

  // Keep test recipient synced with user's email if available
  useEffect(() => {
    if (user?.email && !testRecipient) {
      setTestRecipient(user.email);
    }
  }, [user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) return;

    try {
      await api.users.create({
        username: newUsername.trim(),
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword,
        role: newRole,
        locationId: newRole === 'BEWOHNER' ? (newLocationId || locations[0]?.id) : undefined,
      });

      setUserSuccessMsg(`Benutzer "${newName}" (${newRole === 'BETREUER' ? 'Betreuer & Admin' : 'Bewohner'}) erfolgreich angelegt!`);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setShowAddUser(false);
      fetchUsers();
      setTimeout(() => setUserSuccessMsg(null), 5000);
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

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    try {
      await api.locations.create({
        name: newLocName.trim(),
        address: newLocAddress.trim() || undefined,
        defaultServings: Number(newLocServings) || 6,
        defaultSupermarketId: newLocSupermarketId || undefined,
      });

      setLocationSuccessMsg(`Standort "${newLocName}" erfolgreich erstellt!`);
      setNewLocName('');
      setNewLocAddress('');
      setShowAddLocation(false);
      await refreshLocations();
      setTimeout(() => setLocationSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Erstellen des Standorts: ${err.message}`);
    }
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`Möchtest Du den Standort "${name}" wirklich löschen?`)) {
      return;
    }

    try {
      await api.locations.delete(id);
      setLocationSuccessMsg(`Standort "${name}" gelöscht.`);
      await refreshLocations();
      setTimeout(() => setLocationSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Fehler beim Löschen: ${err.message}`);
    }
  };

  const openAssignModal = (loc: any) => {
    setAssigningLocation(loc);
    setResidentSearchQuery('');
    // Current residents assigned to this location
    const currentResidentIds = usersList
      .filter((u) => u.role === 'BEWOHNER' && u.locationId === loc.id)
      .map((u) => u.id);
    setSelectedResidentIds(currentResidentIds);
  };

  const toggleResidentSelection = (residentId: string) => {
    setSelectedResidentIds((prev) =>
      prev.includes(residentId) ? prev.filter((id) => id !== residentId) : [...prev, residentId]
    );
  };

  const handleSaveResidentsAssignment = async () => {
    if (!assigningLocation) return;
    try {
      setIsSavingAssignment(true);
      await api.locations.assignResidents(assigningLocation.id, selectedResidentIds);
      setLocationSuccessMsg(`Bewohner für „${assigningLocation.name}“ erfolgreich zugewiesen!`);
      await refreshLocations();
      await fetchUsers();
      setAssigningLocation(null);
      setTimeout(() => setLocationSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Zuweisen der Bewohner: ${err.message}`);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpHost.trim() || !smtpFromEmail.trim()) {
      alert('Bitte mindestens Host und Absender-E-Mail angeben.');
      return;
    }

    try {
      setIsSavingSmtp(true);
      setSmtpSaveSuccess(null);
      setSmtpTestResult(null);

      await api.admin.saveSmtp({
        host: smtpHost.trim(),
        port: Number(smtpPort) || 587,
        secure: smtpSecure,
        user: smtpUser.trim(),
        password: smtpPassword,
        fromEmail: smtpFromEmail.trim(),
        fromName: smtpFromName.trim() || 'Dein Weg Alltagsplaner',
      });

      setSmtpConfigured(true);
      setSmtpSaveSuccess('SMTP-Einstellungen erfolgreich gespeichert!');
      setTimeout(() => setSmtpSaveSuccess(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Speichern: ${err.message}`);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpHost.trim()) {
      alert('Bitte gib zuerst einen SMTP-Host ein.');
      return;
    }

    try {
      setIsTestingSmtp(true);
      setSmtpTestResult(null);

      const res = await api.admin.testSmtp({
        host: smtpHost.trim(),
        port: Number(smtpPort) || 587,
        secure: smtpSecure,
        user: smtpUser.trim() || undefined,
        password: smtpPassword || undefined,
        fromEmail: smtpFromEmail.trim() || undefined,
        fromName: smtpFromName.trim() || undefined,
        testRecipient: testRecipient.trim() || undefined,
      });

      setSmtpTestResult(res);
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Verbindung zum SMTP-Server fehlgeschlagen.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-sky-400" />
            <span>Verwaltung & Konfiguration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zentrale Administration von Betreuern, Bewohnern, Standorten, Preisen und E-Mail / SMTP
          </p>
        </div>

        {/* Subtab navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'users'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Benutzer
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
            Preise
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('smtp')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              activeSubTab === 'smtp'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-Mail / SMTP</span>
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

      {locationSuccessMsg && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{locationSuccessMsg}</span>
        </div>
      )}

      {/* SUBTAB: USERS */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Registrierte Benutzer ({usersList.length})
              </h3>
              <p className="text-xs text-slate-400">
                Betreuer besitzen automatisch volle Administrator-Rechte.
              </p>
            </div>
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
              className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-150"
            >
              <h4 className="text-sm font-bold text-slate-100">Neuen Zugang anlegen</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Benutzername (Login) *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="z.B. maria"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voller Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z.B. Maria Musterfrau"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-Mail <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={newRole === 'BEWOHNER' ? 'optional' : 'z.B. name@deinweg.de'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial-Passwort *</label>
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
                    onChange={(e) => setNewRole(e.target.value as 'BEWOHNER' | 'BETREUER')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="BEWOHNER">Bewohner</option>
                    <option value="BETREUER">Betreuer (Volle Admin-Rechte)</option>
                  </select>
                </div>
                {newRole === 'BEWOHNER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Standort zuweisen</label>
                    <select
                      value={newLocationId}
                      onChange={(e) => setNewLocationId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  <th className="px-5 py-3">E-Mail</th>
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
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {u.email || '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          u.role === 'ADMIN' || u.role === 'BETREUER'
                            ? 'bg-sky-950/70 text-sky-300 border-sky-800/40'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40'
                        }`}
                      >
                        {u.role === 'ADMIN' || u.role === 'BETREUER' ? 'Betreuer & Admin' : 'Bewohner'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {u.role === 'BEWOHNER' ? (
                        <select
                          value={u.locationId || ''}
                          onChange={async (e) => {
                            const newLocId = e.target.value || null;
                            try {
                              await api.users.update(u.id, { locationId: newLocId });
                              await fetchUsers();
                              await refreshLocations();
                            } catch (err: any) {
                              alert(`Fehler beim Ändern des Standorts: ${err.message}`);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="">-- Kein Standort --</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{u.locationName || 'Alle Standorte (Global)'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Key className="w-3 h-3 text-slate-400" />
                            <span>Passwort</span>
                          </button>
                        )}

                        {user?.id !== u.id && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Möchtest Du den Benutzer "${u.name}" (@${u.username}) wirklich löschen?`)) return;
                              try {
                                await api.users.delete(u.id);
                                setUserSuccessMsg(`Benutzer "${u.name}" gelöscht.`);
                                await fetchUsers();
                                await refreshLocations();
                                setTimeout(() => setUserSuccessMsg(null), 4000);
                              } catch (err: any) {
                                alert(`Fehler beim Löschen: ${err.message}`);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Konfigurierte Standorte ({locations.length})
              </h3>
              <p className="text-xs text-slate-400">
                Standorte / Wohngruppen mit Bewohneranzahl und Standard-Supermarkt
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Neuen Standort anlegen</span>
            </button>
          </div>

          {showAddLocation && (
            <form
              onSubmit={handleCreateLocation}
              className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-3 animate-in fade-in duration-150"
            >
              <h4 className="text-sm font-bold text-slate-100">Neuen Standort anlegen</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Standort-Name *</label>
                  <input
                    type="text"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="z.B. Haus Rheine"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse (optional)</label>
                  <input
                    type="text"
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    placeholder="z.B. Musterstraße 12, 48429 Rheine"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Standard-Portionen</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newLocServings}
                    onChange={(e) => setNewLocServings(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Standard-Supermarkt</label>
                  <select
                    value={newLocSupermarketId}
                    onChange={(e) => setNewLocSupermarketId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {supermarkets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Standort speichern
                </button>
              </div>
            </form>
          )}

          {locations.length > 0 && (
            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-semibold text-slate-200">
                  Standort auswählen & Bewohner zuweisen:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {locations.map((loc) => {
                  const count = usersList.filter((u) => u.role === 'BEWOHNER' && u.locationId === loc.id).length;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => openAssignModal(loc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600/30 hover:border-sky-500/50 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      <span>{loc.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-[10px] text-sky-300 font-bold border border-slate-700">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {locations.map((loc) => {
              const locResidents = usersList.filter((u) => u.role === 'BEWOHNER' && u.locationId === loc.id);

              return (
                <div
                  key={loc.id}
                  className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-sky-400" />
                        <h4 className="text-base font-bold text-slate-100">{loc.name}</h4>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                        {locResidents.length} Bewohner
                      </span>
                    </div>

                    {loc.address && (
                      <p className="text-xs text-slate-400 mt-2">{loc.address}</p>
                    )}

                    <div className="pt-3 mt-3 border-t border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Standard-Portionen:</span>
                        <span className="font-bold text-slate-200">{loc.defaultServings} Personen</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Standard-Supermarkt:</span>
                        <span className="font-bold text-sky-400">
                          {supermarkets.find((s) => s.id === loc.defaultSupermarketId)?.name || 'Netto Marken-Discount'}
                        </span>
                      </div>
                    </div>

                    {/* Residents Living Here */}
                    <div className="pt-3 mt-3 border-t border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-sky-400" />
                          <span>Bewohner vor Ort:</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {locResidents.length} Person(en)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                        {locResidents.length > 0 ? (
                          locResidents.map((res) => (
                            <span
                              key={res.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-200 text-[11px]"
                            >
                              <span
                                className="w-2 h-2 rounded-full inline-block shrink-0"
                                style={{ backgroundColor: res.avatarColor || '#3b82f6' }}
                              />
                              <span className="font-medium">{res.name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Noch keine Bewohner zugewiesen</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openAssignModal(loc)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Bewohner zuweisen</span>
                    </button>

                    {locResidents.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc.id, loc.name)}
                        className="px-2 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs flex items-center gap-1 transition-colors ml-auto"
                        title="Standort löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Löschen</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MODAL: ASSIGN RESIDENTS TO LOCATION */}
          {assigningLocation && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-2xl bg-sky-950/70 border border-sky-800/50 text-sky-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Bewohner zuweisen</h3>
                      <p className="text-xs text-slate-400">
                        Standort: <span className="text-sky-300 font-semibold">{assigningLocation.name}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssigningLocation(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Location Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Standort wechseln:
                  </label>
                  <select
                    value={assigningLocation.id}
                    onChange={(e) => {
                      const found = locations.find((l) => l.id === e.target.value);
                      if (found) {
                        openAssignModal(found);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.address || 'Keine Adresse'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resident Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={residentSearchQuery}
                    onChange={(e) => setResidentSearchQuery(e.target.value)}
                    placeholder="Bewohner nach Name oder @username filtern..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Residents List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[320px]">
                  {usersList.filter((u) => u.role === 'BEWOHNER').length === 0 ? (
                    <div className="p-6 text-center text-slate-400 space-y-3 bg-slate-800/30 rounded-2xl border border-slate-800">
                      <Users className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs">
                        Es sind aktuell noch keine Bewohner im System angelegt.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningLocation(null);
                          setActiveSubTab('users');
                          setShowAddUser(true);
                        }}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Jetzt Bewohner anlegen</span>
                      </button>
                    </div>
                  ) : (
                    usersList
                      .filter((u) => u.role === 'BEWOHNER')
                      .filter(
                        (r) =>
                          !residentSearchQuery.trim() ||
                          r.name.toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
                          r.username.toLowerCase().includes(residentSearchQuery.toLowerCase())
                      )
                      .map((res) => {
                        const isSelected = selectedResidentIds.includes(res.id);
                        const isCurrentLoc = res.locationId === assigningLocation.id;
                        const otherLocName =
                          !isCurrentLoc && res.locationId
                            ? locations.find((l) => l.id === res.locationId)?.name || res.locationName
                            : null;

                        return (
                          <div
                            key={res.id}
                            onClick={() => toggleResidentSelection(res.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-sky-950/40 border-sky-600/60 shadow-xs'
                                : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'border-slate-600 bg-slate-800'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                                style={{ backgroundColor: res.avatarColor || '#3b82f6' }}
                              >
                                {res.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-100">{res.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">@{res.username}</div>
                              </div>
                            </div>

                            <div>
                              {isSelected ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-700/60">
                                  Ausgewählt
                                </span>
                              ) : otherLocName ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/40">
                                  In: {otherLocName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/40">
                                  Ohne Standort
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    <strong className="text-slate-200">{selectedResidentIds.length}</strong> Bewohner für diesen Standort ausgewählt
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssigningLocation(null)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      disabled={isSavingAssignment}
                      onClick={handleSaveResidentsAssignment}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      {isSavingAssignment ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Zuweisung speichern</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* SUBTAB: SMTP / EMAIL */}
      {activeSubTab === 'smtp' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-950/80 border border-sky-800/80 text-sky-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Eigener Mailserver (SMTP)</h3>
                  <p className="text-xs text-slate-400">
                    Konfiguriere den SMTP-Ausgangsserver Deiner Einrichtung für Benachrichtigungen & Meldungen.
                  </p>
                </div>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    smtpConfigured
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  }`}
                >
                  {smtpConfigured ? 'Aktiv konfiguriert' : 'Nicht eingerichtet'}
                </span>
              </div>
            </div>

            {smtpSaveSuccess && (
              <div className="mt-4 p-3.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{smtpSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSmtp} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    SMTP Server / Host *
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="z. B. smtp.office365.com oder mail.deinweg.de"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Port *</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Authentifizierungs-Benutzer
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="benachrichtigung@deinweg.de"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Passwort</label>
                  <div className="relative">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showSmtpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="h-4 w-4 text-sky-500 bg-slate-800 border-slate-700 rounded focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">
                      Direktes SSL/TLS (Standard für Port 465)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Absender E-Mail (From) *
                  </label>
                  <input
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    placeholder="alltagsplaner@deinweg.de"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Absender Name</label>
                  <input
                    type="text"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="Dein Weg Alltagsplaner"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSavingSmtp}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingSmtp ? (
                    <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>SMTP-Einstellungen speichern</span>
                </button>
              </div>
            </form>
          </div>

          {/* Test connection & test email card */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Verbindung & Test-E-Mail prüfen</span>
            </h4>
            <p className="text-xs text-slate-400">
              Prüfe die Verbindung zum Mailserver und sende eine formatierte Test-Nachricht an Deine Adresse.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="w-full sm:w-80">
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Empfänger z. B. vorname@deinweg.de"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isTestingSmtp ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-sky-300 border-t-transparent"></span>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Verbindung testen & Test-Mail senden</span>
              </button>
            </div>

            {smtpTestResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
                  smtpTestResult.success
                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-800 text-rose-300'
                }`}
              >
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {smtpTestResult.success ? 'Erfolgreich!' : 'Test fehlgeschlagen:'}
                  </div>
                  <div className="mt-0.5">{smtpTestResult.message}</div>
                </div>
              </div>
            )}
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
