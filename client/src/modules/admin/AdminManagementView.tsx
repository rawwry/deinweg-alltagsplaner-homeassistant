import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
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
  Pencil,
  Palette,
  Camera,
  LogOut,
  BookOpen,
  ListTodo,
} from 'lucide-react';
import { AvatarUploadModal } from '../../components/profile/AvatarUploadModal.js';
import { formatGermanDate } from '../../utils/formatters.js';

const WEEKDAY_ITEMS = [
  { id: 1, label: 'Mo', name: 'Montag' },
  { id: 2, label: 'Di', name: 'Dienstag' },
  { id: 3, label: 'Mi', name: 'Mittwoch' },
  { id: 4, label: 'Do', name: 'Donnerstag' },
  { id: 5, label: 'Fr', name: 'Freitag' },
  { id: 6, label: 'Sa', name: 'Samstag' },
  { id: 7, label: 'So', name: 'Sonntag' },
];

export const formatCookingDays = (daysStr?: string | null): string => {
  if (!daysStr) return 'Mo - So (7 Tage)';
  const days = daysStr
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  if (days.length === 7) return 'Mo - So (7 Tage)';
  if (days.length === 5 && days.join(',') === '1,2,3,4,5') return 'Mo - Fr (5 Tage)';
  if (days.length === 4 && days.join(',') === '1,2,3,4') return 'Mo - Do (4 Tage)';
  const shortNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return `${days.map((d) => shortNames[d - 1]).join(', ')} (${days.length} Tage)`;
};

export const AdminManagementView: React.FC = () => {
  const { user, locations, refreshLocations, logout } = useAuth();
  const { themeId, setThemeId, availableThemes } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<
    'users' | 'locations' | 'chores' | 'categories' | 'prices' | 'smtp' | 'appearance' | 'system'
  >('users');
  const [avatarModalUserId, setAvatarModalUserId] = useState<string | null>(null);
  const [avatarModalCurrentUrl, setAvatarModalCurrentUrl] = useState<string | null>(null);

  // Categories State
  const [recipeCategories, setRecipeCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [catSuccessMsg, setCatSuccessMsg] = useState<string | null>(null);
  const [catErrorMsg, setCatErrorMsg] = useState<string | null>(null);

  // Chores State
  const [choreTemplates, setChoreTemplates] = useState<any[]>([]);
  const [selectedChoreLocId, setSelectedChoreLocId] = useState<string>(locations[0]?.id || '');
  const [choreResidents, setChoreResidents] = useState<any[]>([]);
  const [isLoadingChores, setIsLoadingChores] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [newChoreTitle, setNewChoreTitle] = useState('');
  const [newChoreDesc, setNewChoreDesc] = useState('');
  const [newChoreIcon, setNewChoreIcon] = useState('🧹');
  const [newChoreAssignedResidents, setNewChoreAssignedResidents] = useState<string[]>([]);
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [editChoreTitle, setEditChoreTitle] = useState('');
  const [editChoreDesc, setEditChoreDesc] = useState('');
  const [editChoreIcon, setEditChoreIcon] = useState('🧹');
  const [editChoreAssignedResidents, setEditChoreAssignedResidents] = useState<string[]>([]);
  const [choreSuccessMsg, setChoreSuccessMsg] = useState<string | null>(null);
  const [choreErrorMsg, setChoreErrorMsg] = useState<string | null>(null);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
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
  const [newLocCookingDays, setNewLocCookingDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Edit Location State
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocAddress, setEditLocAddress] = useState('');
  const [editLocServings, setEditLocServings] = useState<number>(6);
  const [editLocSupermarketId, setEditLocSupermarketId] = useState('supermarket-netto');
  const [editLocCookingDays, setEditLocCookingDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  // Resident Assignment to Location State
  const [assigningLocation, setAssigningLocation] = useState<any | null>(null);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Ingredients & Prices State
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [supermarkets, setSupermarkets] = useState<any[]>([]);
  const [selectedSupermarketId, setSelectedSupermarketId] = useState('supermarket-netto');
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState('Obst & Gemüse');
  const [ingUnit, setIngUnit] = useState('g');
  const [ingPrice, setIngPrice] = useState('');
  const [ingUnitSize, setIngUnitSize] = useState('1000');
  const [ingSupermarketId, setIngSupermarketId] = useState('supermarket-netto');
  const [priceSuccessMsg, setPriceSuccessMsg] = useState<string | null>(null);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');

  // Supermarket Management State
  const [showSupermarketModal, setShowSupermarketModal] = useState(false);
  const [editingSupermarketId, setEditingSupermarketId] = useState<string | null>(null);
  const [editingSupermarketName, setEditingSupermarketName] = useState('');
  const [newSupermarketName, setNewSupermarketName] = useState('');
  const [isSavingSupermarket, setIsSavingSupermarket] = useState(false);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Deine WG: Alltagsplaner');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Email Notification Templates
  const [residentReplyTemplateSubject, setResidentReplyTemplateSubject] = useState('Neue Antwort im Flurfunk: {noteTitle}');
  const [residentReplyTemplateBody, setResidentReplyTemplateBody] = useState('Hallo {residentName},\n\n{responderName} hat auf deinen Flurfunk-Beitrag geantwortet:\n\n"{replyText}"\n\nSchau gerne im Alltagsplaner vorbei, um mehr zu erfahren.\n\nViele Grüße,\nDein WG-Team');
  const [caregiverNotificationTemplateSubject, setCaregiverNotificationTemplateSubject] = useState('Neue Flurfunk-Nachricht an Betreuer ({locationName}): {noteTitle}');
  const [caregiverNotificationTemplateBody, setCaregiverNotificationTemplateBody] = useState('Hallo Betreuer-Team,\n\n{authorName} hat eine neue Nachricht im Flurfunk ({locationName}) hinterlassen:\n\n"{noteContent}"\n\nBitte prüfe die Nachricht im Alltagsplaner.\n\nViele Grüße,\nDein WG-System');

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
        setSmtpFromName(data.fromName || 'Deine WG: Alltagsplaner');
        if (data.residentReplyTemplateSubject) setResidentReplyTemplateSubject(data.residentReplyTemplateSubject);
        if (data.residentReplyTemplateBody) setResidentReplyTemplateBody(data.residentReplyTemplateBody);
        if (data.caregiverNotificationTemplateSubject) setCaregiverNotificationTemplateSubject(data.caregiverNotificationTemplateSubject);
        if (data.caregiverNotificationTemplateBody) setCaregiverNotificationTemplateBody(data.caregiverNotificationTemplateBody);
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

  const fetchRecipeCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const data = await api.food.categories();
      setRecipeCategories(data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Rezeptkategorien:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setCatErrorMsg(null);
      await api.food.createCategory(newCatName.trim());
      setNewCatName('');
      setCatSuccessMsg('Kategorie erfolgreich angelegt!');
      setTimeout(() => setCatSuccessMsg(null), 3000);
      fetchRecipeCategories();
    } catch (err: any) {
      setCatErrorMsg(err.message || 'Fehler beim Anlegen der Kategorie');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      setCatErrorMsg(null);
      await api.food.updateCategory(id, editCatName.trim());
      setEditingCatId(null);
      setCatSuccessMsg('Kategorie erfolgreich umbenannt!');
      setTimeout(() => setCatSuccessMsg(null), 3000);
      fetchRecipeCategories();
    } catch (err: any) {
      setCatErrorMsg(err.message || 'Fehler beim Aktualisieren der Kategorie');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Möchtest du die Kategorie "${name}" wirklich löschen? Bestehende Rezepte mit dieser Kategorie werden auf "Alltagsküche" zurückgesetzt.`
      )
    )
      return;
    try {
      setCatErrorMsg(null);
      await api.food.deleteCategory(id);
      setCatSuccessMsg('Kategorie gelöscht.');
      setTimeout(() => setCatSuccessMsg(null), 3000);
      fetchRecipeCategories();
    } catch (err: any) {
      setCatErrorMsg(err.message || 'Fehler beim Löschen der Kategorie');
    }
  };

  const fetchChoreTemplates = async (locId?: string) => {
    const targetLoc = locId || selectedChoreLocId || locations[0]?.id;
    if (!targetLoc) return;
    try {
      setIsLoadingChores(true);
      const [data, usersData] = await Promise.all([
        api.chores.templates(targetLoc),
        api.users.list(targetLoc).catch(() => []),
      ]);
      setChoreTemplates(data);
      setChoreResidents((usersData || []).filter((u: any) => u.role === 'BEWOHNER'));
    } catch (err) {
      console.error('Fehler beim Laden der Aufgaben-Vorlagen:', err);
    } finally {
      setIsLoadingChores(false);
    }
  };

  const handleCreateChoreTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreTitle.trim()) return;
    const locId = selectedChoreLocId || locations[0]?.id;
    if (!locId) return;
    try {
      setChoreErrorMsg(null);
      await api.chores.createTemplate({
        locationId: locId,
        title: newChoreTitle.trim(),
        description: newChoreDesc.trim() || undefined,
        icon: newChoreIcon.trim() || '🧹',
        assignedResidentIds:
          newChoreAssignedResidents.length > 0 ? newChoreAssignedResidents : null,
      });
      setShowAddChore(false);
      setNewChoreTitle('');
      setNewChoreDesc('');
      setNewChoreIcon('🧹');
      setNewChoreAssignedResidents([]);
      setChoreSuccessMsg('Aufgaben-Vorlage erfolgreich angelegt!');
      setTimeout(() => setChoreSuccessMsg(null), 3000);
      fetchChoreTemplates(locId);
    } catch (err: any) {
      setChoreErrorMsg(err.message || 'Fehler beim Anlegen der Vorlage');
    }
  };

  const handleUpdateChoreTemplate = async (id: string) => {
    if (!editChoreTitle.trim()) return;
    const locId = selectedChoreLocId || locations[0]?.id;
    try {
      setChoreErrorMsg(null);
      await api.chores.updateTemplate(id, {
        title: editChoreTitle.trim(),
        description: editChoreDesc.trim() || undefined,
        icon: editChoreIcon.trim() || '🧹',
        assignedResidentIds:
          editChoreAssignedResidents.length > 0 ? editChoreAssignedResidents : null,
      });
      setEditingChoreId(null);
      setEditChoreAssignedResidents([]);
      setChoreSuccessMsg('Aufgaben-Vorlage aktualisiert!');
      setTimeout(() => setChoreSuccessMsg(null), 3000);
      fetchChoreTemplates(locId);
    } catch (err: any) {
      setChoreErrorMsg(err.message || 'Fehler beim Aktualisieren der Vorlage');
    }
  };

  const handleDeleteChoreTemplate = async (id: string, title: string) => {
    if (!window.confirm(`Möchtest du die Aufgaben-Vorlage "${title}" wirklich deaktivieren?`)) return;
    const locId = selectedChoreLocId || locations[0]?.id;
    try {
      setChoreErrorMsg(null);
      await api.chores.deleteTemplate(id);
      setChoreSuccessMsg('Aufgaben-Vorlage gelöscht.');
      setTimeout(() => setChoreSuccessMsg(null), 3000);
      fetchChoreTemplates(locId);
    } catch (err: any) {
      setChoreErrorMsg(err.message || 'Fehler beim Löschen der Vorlage');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users' || activeSubTab === 'locations') fetchUsers();
    if (activeSubTab === 'locations' || activeSubTab === 'prices') fetchIngredientsAndMarkets();
    if (activeSubTab === 'categories') fetchRecipeCategories();
    if (activeSubTab === 'chores') fetchChoreTemplates(selectedChoreLocId);
    if (activeSubTab === 'smtp') fetchSmtpSettings();
    if (activeSubTab === 'system') fetchSystemInfo();
  }, [activeSubTab, selectedSupermarketId, selectedChoreLocId]);

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
        birthday: newBirthday || undefined,
        password: newPassword,
        role: newRole,
        locationId: newRole === 'BEWOHNER' ? (newLocationId || locations[0]?.id) : undefined,
      });

      setUserSuccessMsg(`Benutzer "${newName}" (${newRole === 'BETREUER' ? 'Betreuer' : 'Bewohner'}) erfolgreich angelegt!`);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setNewBirthday('');
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
        cookingDays: newLocCookingDays.sort((a, b) => a - b).join(','),
      });

      setLocationSuccessMsg(`Standort "${newLocName}" erfolgreich erstellt!`);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocCookingDays([1, 2, 3, 4, 5, 6, 7]);
      setShowAddLocation(false);
      await refreshLocations();
      setTimeout(() => setLocationSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Erstellen des Standorts: ${err.message}`);
    }
  };

  const handleEditLocation = (loc: any) => {
    setEditingLocation(loc);
    setEditLocName(loc.name);
    setEditLocAddress(loc.address || '');
    setEditLocServings(loc.defaultServings || 6);
    setEditLocSupermarketId(loc.defaultSupermarketId || 'supermarket-netto');
    const days = loc.cookingDays
      ? loc.cookingDays.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
      : [1, 2, 3, 4, 5, 6, 7];
    setEditLocCookingDays(days);
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editLocName.trim()) return;

    try {
      await api.locations.update(editingLocation.id, {
        name: editLocName.trim(),
        address: editLocAddress.trim() || undefined,
        defaultServings: Number(editLocServings) || 6,
        defaultSupermarketId: editLocSupermarketId || undefined,
        cookingDays: editLocCookingDays.sort((a, b) => a - b).join(','),
      });

      setLocationSuccessMsg(`Standort "${editLocName}" erfolgreich aktualisiert!`);
      setEditingLocation(null);
      await refreshLocations();
      setTimeout(() => setLocationSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Aktualisieren des Standorts: ${err.message}`);
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

  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngCategory('Obst & Gemüse');
    setIngUnit('g');
    setIngPrice('');
    setIngUnitSize('1000');
    setIngSupermarketId(selectedSupermarketId);
    setShowAddIngredient(true);
  };

  const handleOpenEditIngredient = (ing: any) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngCategory(ing.category || 'Sonstiges');
    setIngUnit(ing.standardUnit || 'g');
    setIngPrice(ing.pricePerUnit ? String(ing.pricePerUnit) : '');
    setIngUnitSize(ing.priceUnitSize ? String(ing.priceUnitSize) : '1');
    setIngSupermarketId(selectedSupermarketId);
    setShowAddIngredient(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) return;

    try {
      if (editingIngredient) {
        await api.food.updateIngredient(editingIngredient.id, {
          name: ingName.trim(),
          category: ingCategory,
          standardUnit: ingUnit,
          pricePerUnit: ingPrice ? parseFloat(ingPrice) : undefined,
          unitSize: ingUnitSize ? parseFloat(ingUnitSize) : 1,
          supermarketId: ingSupermarketId,
        });
        setPriceSuccessMsg(`Lebensmittel "${ingName}" erfolgreich aktualisiert!`);
      } else {
        await api.food.createIngredient({
          name: ingName.trim(),
          category: ingCategory,
          standardUnit: ingUnit,
          pricePerUnit: ingPrice ? parseFloat(ingPrice) : undefined,
          unitSize: ingUnitSize ? parseFloat(ingUnitSize) : 1,
          supermarketId: ingSupermarketId,
        });
        setPriceSuccessMsg(`Lebensmittel "${ingName}" erfolgreich angelegt!`);
      }
      setShowAddIngredient(false);
      setEditingIngredient(null);
      await fetchIngredientsAndMarkets();
      setTimeout(() => setPriceSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Speichern des Lebensmittels: ${err.message}`);
    }
  };

  const handleDeleteIngredient = async (id: string, name: string) => {
    if (!confirm(`Möchtest Du das Lebensmittel "${name}" wirklich löschen?`)) return;
    try {
      await api.food.deleteIngredient(id);
      setPriceSuccessMsg(`Lebensmittel "${name}" gelöscht.`);
      await fetchIngredientsAndMarkets();
      setTimeout(() => setPriceSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Fehler beim Löschen: ${err.message}`);
    }
  };

  const handleClearAllIngredients = async () => {
    if (!confirm('Möchtest Du wirklich ALLE hinterlegten Lebensmittel und Richtpreise löschen?')) {
      return;
    }
    try {
      await api.food.clearIngredients();
      setPriceSuccessMsg('Alle Lebensmittel und Richtpreise wurden gelöscht.');
      await fetchIngredientsAndMarkets();
      setTimeout(() => setPriceSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Leeren des Katalogs: ${err.message}`);
    }
  };

  const handleRenameSupermarket = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      setIsSavingSupermarket(true);
      const updated = await api.food.updateSupermarket(id, newName.trim());
      setSupermarkets((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditingSupermarketId(null);
      setPriceSuccessMsg(`Supermarkt erfolgreich in „${updated.name}“ umbenannt.`);
      refreshLocations();
      setTimeout(() => setPriceSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Umbenennen: ${err.message || err}`);
    } finally {
      setIsSavingSupermarket(false);
    }
  };

  const handleCreateSupermarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupermarketName.trim()) return;
    try {
      setIsSavingSupermarket(true);
      const created = await api.food.createSupermarket(newSupermarketName.trim());
      setSupermarkets((prev) => [...prev, created]);
      setSelectedSupermarketId(created.id);
      setNewSupermarketName('');
      setPriceSuccessMsg(`Supermarkt „${created.name}“ erfolgreich angelegt.`);
      refreshLocations();
      setTimeout(() => setPriceSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Anlegen des Supermarkts: ${err.message || err}`);
    } finally {
      setIsSavingSupermarket(false);
    }
  };

  const handleDeleteSupermarket = async (id: string) => {
    const market = supermarkets.find((m) => m.id === id);
    if (!confirm(`Möchtest du den Supermarkt „${market?.name || ''}“ wirklich löschen?`)) return;
    try {
      await api.food.deleteSupermarket(id);
      setSupermarkets((prev) => prev.filter((m) => m.id !== id));
      if (selectedSupermarketId === id) {
        const remaining = supermarkets.filter((m) => m.id !== id);
        if (remaining.length > 0) setSelectedSupermarketId(remaining[0].id);
      }
      setPriceSuccessMsg(`Supermarkt gelöscht.`);
      refreshLocations();
      setTimeout(() => setPriceSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Fehler beim Löschen des Supermarkts.');
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
        fromName: smtpFromName.trim() || 'Deine WG: Alltagsplaner',
        residentReplyTemplateSubject,
        residentReplyTemplateBody,
        caregiverNotificationTemplateSubject,
        caregiverNotificationTemplateBody,
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
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-500/10 border border-rose-500/25 rounded-full text-xs font-semibold text-rose-300 mb-2.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Admin-Bereich</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-surface-cream tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-rose-400" />
            <span>Verwaltung & Konfiguration</span>
          </h1>
          <p className="text-xs sm:text-sm text-surface-muted mt-1.5 font-sans">
            Zentrale Administration von Betreuern, Bewohnern, Standorten, Preisen und E-Mail / SMTP
          </p>
        </div>

        {/* Subtab navigation & Logout */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-elevated/90 border border-surface-border p-1.5 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSubTab('users')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeSubTab === 'users'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              Benutzer
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('locations')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeSubTab === 'locations'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              Standorte
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('chores')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'chores'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Aufgaben-Vorlagen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('categories')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'categories'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rezept-Kategorien</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('prices')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeSubTab === 'prices'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              Preise
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('smtp')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'smtp'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-Mail / SMTP</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('appearance')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'appearance'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Erscheinungsbild</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('system')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeSubTab === 'system'
                  ? 'btn-theme-gradient text-white font-semibold shadow-md'
                  : 'text-surface-muted hover:text-surface-cream'
              }`}
            >
              System
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Möchtest du dich abmelden?')) {
                logout();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:border-rose-500/50"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>

      {userSuccessMsg && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{userSuccessMsg}</span>
        </div>
      )}

      {locationSuccessMsg && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{locationSuccessMsg}</span>
        </div>
      )}

      {/* SUBTAB: USERS */}
      {activeSubTab === 'users' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-display font-semibold text-surface-cream">
                Registrierte Benutzer ({usersList.length})
              </h3>
              <p className="text-xs text-surface-muted mt-0.5 font-sans">
                Betreuer besitzen automatisch volle Administrator-Rechte.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Neuen Benutzer / Bewohner anlegen</span>
            </button>
          </div>

          {showAddUser && (
            <form
              onSubmit={handleCreateUser}
              className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-xl space-y-4 animate-in fade-in duration-150"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Geburtstag <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={newBirthday}
                    onChange={(e) => setNewBirthday(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
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
                    <option value="BETREUER">Betreuer</option>
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
                        <div className="relative group/avatar">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700 shadow-xs"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-xs"
                              style={{ backgroundColor: u.avatarColor || '#3b82f6' }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarModalUserId(u.id);
                              setAvatarModalCurrentUrl(u.avatarUrl || null);
                            }}
                            title="Profilbild anpassen"
                            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-white"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{u.name}</div>
                          <div className="text-slate-500 font-mono text-[10px]">
                            @{u.username}
                            {u.birthday ? ` · 🎂 ${formatGermanDate(u.birthday)}` : ''}
                          </div>
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
                        {u.role === 'ADMIN' || u.role === 'BETREUER' ? 'Betreuer' : 'Bewohner'}
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
                <div className="sm:col-span-2 md:col-span-4 pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Geplante Kochtage ({newLocCookingDays.length} Tage)
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setNewLocCookingDays([1, 2, 3, 4, 5, 6, 7])}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                      >
                        Mo - So (7)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewLocCookingDays([1, 2, 3, 4, 5])}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                      >
                        Mo - Fr (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewLocCookingDays([1, 2, 3, 4])}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                      >
                        Mo - Do (4)
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAY_ITEMS.map((d) => {
                      const isChecked = newLocCookingDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setNewLocCookingDays((prev) =>
                              prev.includes(d.id)
                                ? prev.filter((x) => x !== d.id)
                                : [...prev, d.id]
                            );
                          }}
                          className={`py-2 text-center rounded-xl text-xs font-bold border transition-colors ${
                            isChecked
                              ? 'bg-sky-600 border-sky-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    An nicht ausgewählten Tagen findet Selbstversorgung statt (kein gemeinsames Kochen).
                  </p>
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

          {/* EDIT LOCATION MODAL */}
          {editingLocation && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <form
                onSubmit={handleUpdateLocation}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-2xl bg-sky-950/80 border border-sky-800/80 text-sky-400">
                      <Pencil className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Standort bearbeiten</h3>
                      <p className="text-xs text-slate-400">{editingLocation.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingLocation(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Standort-Name *</label>
                    <input
                      type="text"
                      value={editLocName}
                      onChange={(e) => setEditLocName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Adresse (optional)</label>
                    <input
                      type="text"
                      value={editLocAddress}
                      onChange={(e) => setEditLocAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Standard-Portionen</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editLocServings}
                        onChange={(e) => setEditLocServings(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Standard-Supermarkt</label>
                      <select
                        value={editLocSupermarketId}
                        onChange={(e) => setEditLocSupermarketId(e.target.value)}
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

                  {/* Active Cooking Days */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-300">
                        Geplante Kochtage ({editLocCookingDays.length} Tage)
                      </label>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEditLocCookingDays([1, 2, 3, 4, 5, 6, 7])}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                          Mo-So (7)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLocCookingDays([1, 2, 3, 4, 5])}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                          Mo-Fr (5)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLocCookingDays([1, 2, 3, 4])}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                          Mo-Do (4)
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAY_ITEMS.map((d) => {
                        const isChecked = editLocCookingDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setEditLocCookingDays((prev) =>
                                prev.includes(d.id)
                                  ? prev.filter((x) => x !== d.id)
                                  : [...prev, d.id]
                              );
                            }}
                            className={`py-2 text-center rounded-xl text-xs font-bold border transition-colors ${
                              isChecked
                                ? 'bg-sky-600 border-sky-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tage ohne gemeinsames Kochen werden im Wochenplan als Selbstversorgung gekennzeichnet.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLocation(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    Änderungen speichern
                  </button>
                </div>
              </form>
            </div>
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
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kochtage:</span>
                        <span className="font-bold text-emerald-400">
                          {formatCookingDays(loc.cookingDays)}
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
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openAssignModal(loc)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Bewohner zuweisen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditLocation(loc)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-xl transition-colors"
                        title="Standort bearbeiten"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

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

      {/* SUBTAB: CHORES (AUFGABEN-VORLAGEN) */}
      {activeSubTab === 'chores' && (
        <div className="space-y-6">
          {/* Header & Location Selector */}
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-surface-cream">
                    Aufgaben-Vorlagen verwalten
                  </h3>
                  <p className="text-xs text-surface-muted mt-0.5 font-sans">
                    Definiere wiederkehrende Haushalts- & Alltagsaufgaben, die den Bewohnern im Aufgabenplan zugewiesen werden können.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Location Switcher for templates */}
                <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1.5 rounded-xl border border-surface-border text-xs">
                  <span className="text-slate-400 font-medium">Standort:</span>
                  <select
                    value={selectedChoreLocId}
                    onChange={(e) => {
                      setSelectedChoreLocId(e.target.value);
                      fetchChoreTemplates(e.target.value);
                    }}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-surface-card text-white">
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddChore(true)}
                  className="btn-theme-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neue Vorlage</span>
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {choreSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{choreSuccessMsg}</span>
              </div>
            )}
            {choreErrorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{choreErrorMsg}</span>
              </div>
            )}

            {/* Add Chore Template Form Modal/Card */}
            {showAddChore && (
              <form
                onSubmit={handleCreateChoreTemplate}
                className="bg-surface-elevated/60 border border-indigo-500/40 rounded-3xl p-5 space-y-4 shadow-lg animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
                    Neue Aufgaben-Vorlage anlegen
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddChore(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bezeichnung der Aufgabe *
                    </label>
                    <input
                      type="text"
                      value={newChoreTitle}
                      onChange={(e) => setNewChoreTitle(e.target.value)}
                      placeholder="z.B. Küche & Abwasch, Zimmer saugen, Müll rausbringen"
                      required
                      className="w-full px-3.5 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Icon / Emoji
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newChoreIcon}
                        onChange={(e) => setNewChoreIcon(e.target.value)}
                        maxLength={4}
                        className="w-16 px-3 py-2 text-center text-lg bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                      <div className="flex items-center gap-1 flex-wrap">
                        {['🍽️', '🧹', '🗑️', '🧼', '🧺', '✨'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewChoreIcon(emoji)}
                            className="p-1 hover:bg-white/10 rounded-lg text-sm cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Beschreibung / Richtlinien für Bewohner (optional)
                  </label>
                  <input
                    type="text"
                    value={newChoreDesc}
                    onChange={(e) => setNewChoreDesc(e.target.value)}
                    placeholder="z.B. Spülmaschine ausräumen, Herd & Spüle sauber wischen"
                    className="w-full px-3.5 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* Assigned Residents Multi-Select */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Zugeordnete Bewohner (Mehrfachauswahl möglich)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (newChoreAssignedResidents.includes('ALL')) {
                          setNewChoreAssignedResidents([]);
                        } else {
                          setNewChoreAssignedResidents(['ALL']);
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        newChoreAssignedResidents.includes('ALL')
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-surface-card border-surface-border text-slate-300 hover:bg-surface-elevated hover:text-white'
                      }`}
                    >
                      <span>👥</span>
                      <span>Allen Bewohnern zuweisen</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2 leading-snug">
                    Ideal für Aufgaben wie z.B. Zimmerreinigung, die jeder Bewohner an seinem Tag erledigen soll, oder wähle einzelne Bewohner aus.
                  </p>

                  {!newChoreAssignedResidents.includes('ALL') && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {choreResidents.map((res) => {
                        const isSelected = newChoreAssignedResidents.includes(res.id);
                        return (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setNewChoreAssignedResidents(
                                  newChoreAssignedResidents.filter((id) => id !== res.id)
                                );
                              } else {
                                setNewChoreAssignedResidents([...newChoreAssignedResidents, res.id]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                                : 'bg-surface-card border-surface-border text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: res.avatarColor || '#6366f1' }}
                            />
                            <span>{res.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                          </button>
                        );
                      })}
                      {choreResidents.length === 0 && (
                        <span className="text-xs text-slate-500 italic">
                          Keine Bewohner an diesem Standort registriert.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddChore(false);
                      setNewChoreAssignedResidents([]);
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-card border border-surface-border text-slate-300 text-xs font-semibold hover:bg-surface-elevated cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="btn-theme-gradient px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                  >
                    Vorlage speichern
                  </button>
                </div>
              </form>
            )}

            {/* Templates List */}
            {isLoadingChores ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Vorlagen werden geladen...
              </div>
            ) : choreTemplates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Noch keine Vorlagen für diesen Standort vorhanden.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {choreTemplates.map((tmpl) => {
                  const isEditing = editingChoreId === tmpl.id;

                  return (
                    <div
                      key={tmpl.id}
                      className="bg-surface-elevated/70 border border-surface-border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md hover:border-surface-border/80 transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editChoreIcon}
                              onChange={(e) => setEditChoreIcon(e.target.value)}
                              maxLength={4}
                              className="w-12 py-1 text-center bg-surface-card border border-surface-border rounded-lg text-sm text-white"
                            />
                            <input
                              type="text"
                              value={editChoreTitle}
                              onChange={(e) => setEditChoreTitle(e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-surface-card border border-surface-border rounded-lg text-xs text-white"
                            />
                          </div>
                          <input
                            type="text"
                            value={editChoreDesc}
                            onChange={(e) => setEditChoreDesc(e.target.value)}
                            placeholder="Beschreibung"
                            className="w-full px-2.5 py-1 bg-surface-card border border-surface-border rounded-lg text-xs text-white placeholder-slate-500"
                          />

                          {/* Edit Assigned Residents */}
                          <div className="pt-1 border-t border-surface-border/50">
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                              <span className="text-[11px] font-semibold text-slate-300">
                                Bewohner-Zuordnung:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editChoreAssignedResidents.includes('ALL')) {
                                    setEditChoreAssignedResidents([]);
                                  } else {
                                    setEditChoreAssignedResidents(['ALL']);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                                  editChoreAssignedResidents.includes('ALL')
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-surface-card border-surface-border text-slate-300 hover:bg-surface-elevated'
                                }`}
                              >
                                👥 Allen Bewohnern
                              </button>
                            </div>

                            {!editChoreAssignedResidents.includes('ALL') && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {choreResidents.map((res) => {
                                  const isSelected = editChoreAssignedResidents.includes(res.id);
                                  return (
                                    <button
                                      key={res.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setEditChoreAssignedResidents(
                                            editChoreAssignedResidents.filter((id) => id !== res.id)
                                          );
                                        } else {
                                          setEditChoreAssignedResidents([
                                            ...editChoreAssignedResidents,
                                            res.id,
                                          ]);
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                          : 'bg-surface-card border-surface-border text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: res.avatarColor || '#6366f1' }}
                                      />
                                      <span>{res.name}</span>
                                      {isSelected && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChoreId(null);
                                setEditChoreAssignedResidents([]);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white cursor-pointer"
                            >
                              Abbrechen
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateChoreTemplate(tmpl.id)}
                              className="btn-theme-gradient px-3 py-1 rounded-lg text-[11px] font-semibold text-white shadow-sm cursor-pointer"
                            >
                              Speichern
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className="text-2xl shrink-0 select-none">
                                  {tmpl.icon || '🧹'}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white leading-tight truncate">
                                    {tmpl.title}
                                  </h4>
                                  {tmpl.description && (
                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                      {tmpl.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingChoreId(tmpl.id);
                                    setEditChoreTitle(tmpl.title);
                                    setEditChoreDesc(tmpl.description || '');
                                    setEditChoreIcon(tmpl.icon || '🧹');
                                    setEditChoreAssignedResidents(
                                      tmpl.assignedResidentIdsList || (tmpl.isAllResidents ? ['ALL'] : [])
                                    );
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                  title="Bearbeiten"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChoreTemplate(tmpl.id, tmpl.title)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Deaktivieren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Assigned Residents Display on Card */}
                            <div className="pt-2 border-t border-surface-border/50 flex items-center justify-between gap-2">
                              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-500">Zuweisung:</span>
                                {tmpl.isAllResidents || (tmpl.assignedResidentIdsList && tmpl.assignedResidentIdsList.includes('ALL')) ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                    <span>👥</span>
                                    <span>Alle Bewohner</span>
                                  </span>
                                ) : tmpl.assignedResidents && tmpl.assignedResidents.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {tmpl.assignedResidents.map((r: any) => (
                                      <span
                                        key={r.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-slate-200 text-[10px]"
                                      >
                                        <span
                                          className="w-1.5 h-1.5 rounded-full shrink-0"
                                          style={{ backgroundColor: r.avatarColor || '#6366f1' }}
                                        />
                                        <span>{r.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-[10px]">
                                    Freie Einteilung im Wochenplan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: CATEGORIES (REZEPT-KATEGORIEN) */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-surface-cream">
                    Rezept-Kategorien pflegen
                  </h3>
                  <p className="text-xs text-surface-muted mt-0.5 font-sans">
                    Definiere Kategorien für die Rezeptdatenbank. Diese stehen beim Anlegen und Filtern von Gerichten zur Auswahl.
                  </p>
                </div>
              </div>

              {/* Add category inline form */}
              <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Neue Kategorie (z.B. Aufläufe)"
                  required
                  className="px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 w-48 sm:w-60"
                />
                <button
                  type="submit"
                  className="btn-theme-gradient px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Hinzufügen</span>
                </button>
              </form>
            </div>

            {/* Status Messages */}
            {catSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{catSuccessMsg}</span>
              </div>
            )}
            {catErrorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{catErrorMsg}</span>
              </div>
            )}

            {/* Categories Grid */}
            {isLoadingCategories ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Kategorien werden geladen...
              </div>
            ) : recipeCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Noch keine Kategorien vorhanden.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {recipeCategories.map((cat) => {
                  const isEditing = editingCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="bg-surface-elevated/70 border border-surface-border rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-sm hover:border-surface-border/80 transition-all"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            autoFocus
                            className="flex-1 px-2.5 py-1 bg-surface-card border border-surface-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCategory(cat.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-white/10"
                            title="Speichern"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
                            title="Abbrechen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-xs font-bold text-white truncate">
                              {cat.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditCatName(cat.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                              title="Umbenennen"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: PRICES */}
      {activeSubTab === 'prices' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" />
                <span>Zutaten & Richtpreise nach Supermarkt</span>
              </h3>
              <p className="text-xs text-slate-400">
                Verwalte Deine eigenen Lebensmittel und Richtpreise für automatische Budget-Berechnungen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold">Markt:</span>
                <select
                  value={selectedSupermarketId}
                  onChange={(e) => setSelectedSupermarketId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  {supermarkets.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const current = supermarkets.find((m) => m.id === selectedSupermarketId);
                    if (current) {
                      setEditingSupermarketId(current.id);
                      setEditingSupermarketName(current.name);
                    }
                    setShowSupermarketModal(true);
                  }}
                  title="Supermarkt umbenennen"
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSupermarketModal(true)}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Märkte verwalten</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddIngredient}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Neues Lebensmittel</span>
              </button>

              {ingredients.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllIngredients}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Alle hinterlegten Lebensmittel und Preise löschen"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Katalog leeren</span>
                </button>
              )}
            </div>
          </div>

          {priceSuccessMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{priceSuccessMsg}</span>
            </div>
          )}

          {/* Search bar */}
          {ingredients.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ingredientSearchQuery}
                onChange={(e) => setIngredientSearchQuery(e.target.value)}
                placeholder="Lebensmittel oder Kategorie filtern..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          )}

          {/* Ingredients Table or Empty State */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
            {ingredients.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Tag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">Noch keine Lebensmittel hinterlegt</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
                  Der Lebensmittel- und Richtpreiskatalog ist aktuell leer. Du kannst eigene Lebensmittel anlegen und Richtpreise nach Supermarkt pflegen.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddIngredient}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Jetzt erstes Lebensmittel anlegen</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold">
                    <tr>
                      <th className="px-5 py-3">Zutat</th>
                      <th className="px-5 py-3">Kategorie</th>
                      <th className="px-5 py-3">Einheit</th>
                      <th className="px-5 py-3 text-right">Richtpreis</th>
                      <th className="px-5 py-3 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {ingredients
                      .filter(
                        (ing) =>
                          !ingredientSearchQuery.trim() ||
                          ing.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) ||
                          (ing.category && ing.category.toLowerCase().includes(ingredientSearchQuery.toLowerCase()))
                      )
                      .map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-200">{ing.name}</td>
                          <td className="px-5 py-3 text-slate-400">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                              {ing.category || 'Sonstiges'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 font-mono">{ing.standardUnit}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-100">
                            {ing.pricePerUnit ? `${Number(ing.pricePerUnit).toFixed(2)} €` : (
                              <span className="text-slate-500 font-normal italic">Kein Preis</span>
                            )}
                            {ing.priceUnitSize && (
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                / {ing.priceUnitSize} {ing.standardUnit}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditIngredient(ing)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
                                title="Bearbeiten"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal: Create or Edit Ingredient */}
          {showAddIngredient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800 text-sky-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">
                        {editingIngredient ? 'Lebensmittel bearbeiten' : 'Neues Lebensmittel anlegen'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Bezeichnung, Basiseinheit und Richtpreis für Supermärkte pflegen
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddIngredient(false);
                      setEditingIngredient(null);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveIngredient} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Name des Lebensmittels *
                    </label>
                    <input
                      type="text"
                      value={ingName}
                      onChange={(e) => setIngName(e.target.value)}
                      placeholder="z. B. Kartoffeln (vorwiegend festkochend)"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Kategorie
                      </label>
                      <select
                        value={ingCategory}
                        onChange={(e) => setIngCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="Obst & Gemüse">Obst & Gemüse</option>
                        <option value="Milchprodukte & Eier">Milchprodukte & Eier</option>
                        <option value="Fleisch & Fisch">Fleisch & Fisch</option>
                        <option value="Brot & Backwaren">Brot & Backwaren</option>
                        <option value="Teigwaren & Getreide">Teigwaren & Getreide</option>
                        <option value="Hülsenfrüchte & Konserven">Hülsenfrüchte & Konserven</option>
                        <option value="Gewürze & Öle">Gewürze & Öle</option>
                        <option value="Tiefkühl">Tiefkühl</option>
                        <option value="Getränke">Getränke</option>
                        <option value="Sonstiges">Sonstiges</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Standard-Einheit
                      </label>
                      <select
                        value={ingUnit}
                        onChange={(e) => setIngUnit(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="g">Gramm (g)</option>
                        <option value="kg">Kilogramm (kg)</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="l">Liter (l)</option>
                        <option value="Stück">Stück</option>
                        <option value="Packung">Packung</option>
                        <option value="Bund">Bund</option>
                        <option value="Dose">Dose</option>
                        <option value="EL">Esslöffel (EL)</option>
                        <option value="TL">Teelöffel (TL)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-3">
                      Richtpreis & Supermarkt
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Supermarkt
                        </label>
                        <select
                          value={ingSupermarketId}
                          onChange={(e) => setIngSupermarketId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          {supermarkets.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Richtpreis (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ingPrice}
                          onChange={(e) => setIngPrice(e.target.value)}
                          placeholder="z. B. 1.99"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Menge / Gebinde ({ingUnit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={ingUnitSize}
                          onChange={(e) => setIngUnitSize(e.target.value)}
                          placeholder="1000"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Beispiel: 1.99 € für 1000 g oder 0.89 € für 1 Stück.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddIngredient(false);
                        setEditingIngredient(null);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      {editingIngredient ? 'Änderungen speichern' : 'Lebensmittel anlegen'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
                    placeholder="Deine WG: Alltagsplaner"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Email Templates Section */}
              <div className="pt-6 border-t border-slate-800 space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>✉️</span>
                    <span>Flurfunk E-Mail-Benachrichtigungsvorlagen</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Passe Betreff und Nachrichtentexte der automatischen Benachrichtigungs-Mails an. Du kannst dynamische Platzhalter wie <code className="text-rose-300 bg-slate-800 px-1 py-0.5 rounded font-mono">{"{residentName}"}</code> nutzen.
                  </p>
                </div>

                {/* Template 1: Caregiver Reply to Resident */}
                <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <span>💬</span>
                      <span>Vorlage 1: Betreuer-Antwort an Bewohner</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Platzhalter: {"{residentName}"}, {"{noteTitle}"}, {"{responderName}"}, {"{replyText}"}, {"{locationName}"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      E-Mail-Betreff
                    </label>
                    <input
                      type="text"
                      value={residentReplyTemplateSubject}
                      onChange={(e) => setResidentReplyTemplateSubject(e.target.value)}
                      placeholder="Neue Antwort im Flurfunk: {noteTitle}"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nachrichtentext
                    </label>
                    <textarea
                      rows={4}
                      value={residentReplyTemplateBody}
                      onChange={(e) => setResidentReplyTemplateBody(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Template 2: Notification to Caregiver on Note */}
                <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>Vorlage 2: Benachrichtigung an Betreuer bei Direktnachricht</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Platzhalter: {"{authorName}"}, {"{noteTitle}"}, {"{noteContent}"}, {"{locationName}"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      E-Mail-Betreff
                    </label>
                    <input
                      type="text"
                      value={caregiverNotificationTemplateSubject}
                      onChange={(e) => setCaregiverNotificationTemplateSubject(e.target.value)}
                      placeholder="Neue Flurfunk-Nachricht an Betreuer ({locationName}): {noteTitle}"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nachrichtentext
                    </label>
                    <textarea
                      rows={4}
                      value={caregiverNotificationTemplateBody}
                      onChange={(e) => setCaregiverNotificationTemplateBody(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
                    />
                  </div>
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

      {/* SUBTAB: APPEARANCE (ERSCHEINUNGSBILD) */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-500/15 border border-pink-500/30 rounded-2xl text-pink-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-surface-cream">
                    Erscheinungsbild & Farbschema
                  </h3>
                  <p className="text-xs text-surface-muted mt-0.5 font-sans">
                    Wähle dein bevorzugtes Farbkonzept für Buttons, Akzente und Highlights (gespeichert im Browser).
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 bg-surface-elevated text-surface-cream border border-surface-border rounded-full">
                Aktiv: {availableThemes.find((t) => t.id === themeId)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {availableThemes.map((config) => {
                const isActive = themeId === config.id;
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setThemeId(config.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'bg-surface-elevated border-theme-border shadow-lg shadow-theme ring-2 ring-theme-primary'
                        : 'bg-surface-elevated/50 border-surface-border hover:bg-surface-elevated hover:border-surface-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{config.icon}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                            style={{ backgroundColor: config.previewColor }}
                          />
                          <span className="text-xs font-bold text-surface-cream">
                            {config.name}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-5 h-5 rounded-full bg-theme-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-surface-muted leading-relaxed font-sans">
                      {config.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: SYSTEM */}
      {activeSubTab === 'system' && (
        <div className="space-y-6">
          {/* System Diagnostics */}
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/15 border border-sky-500/30 rounded-2xl text-sky-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-semibold text-surface-cream">{APP_NAME}</h3>
                <p className="text-xs text-surface-muted font-sans">Home Assistant Add-on Systemdiagnose</p>
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
        </div>
      )}

      {/* Avatar Upload Modal for Users */}
      <AvatarUploadModal
        isOpen={!!avatarModalUserId}
        onClose={() => setAvatarModalUserId(null)}
        targetUserId={avatarModalUserId || undefined}
        currentAvatarUrl={avatarModalCurrentUrl}
        onAvatarUpdated={() => {
          fetchUsers();
        }}
      />

      {/* Supermarket Management Modal */}
      {showSupermarketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-surface-elevated/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-white">Supermärkte bearbeiten</h3>
                  <p className="text-[11px] text-slate-400">Namen anpassen oder neue Märkte anlegen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSupermarketModal(false);
                  setEditingSupermarketId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Add New Supermarket Form */}
              <form onSubmit={handleCreateSupermarket} className="flex gap-2">
                <input
                  type="text"
                  value={newSupermarketName}
                  onChange={(e) => setNewSupermarketName(e.target.value)}
                  placeholder="Neuen Markt anlegen (z.B. REWE, Edeka, Aldi)..."
                  className="flex-1 px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-sans"
                />
                <button
                  type="submit"
                  disabled={!newSupermarketName.trim() || isSavingSupermarket}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Anlegen</span>
                </button>
              </form>

              {/* List of Supermarkets */}
              <div className="space-y-2">
                {supermarkets.map((market) => {
                  const isEditing = editingSupermarketId === market.id;
                  const isSelected = selectedSupermarketId === market.id;

                  return (
                    <div
                      key={market.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/30'
                          : 'bg-surface-elevated/60 border-surface-border'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingSupermarketName}
                            onChange={(e) => setEditingSupermarketName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameSupermarket(market.id, editingSupermarketName);
                              } else if (e.key === 'Escape') {
                                setEditingSupermarketId(null);
                              }
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1.5 bg-surface-card border border-sky-500/50 rounded-xl text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameSupermarket(market.id, editingSupermarketName)}
                            disabled={!editingSupermarketName.trim() || isSavingSupermarket}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                            title="Speichern"
                          >
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSupermarketId(null)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-card rounded-lg transition-colors cursor-pointer"
                            title="Abbrechen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-sky-400" />
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span>{market.name}</span>
                                {isSelected && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-display">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSupermarketId(market.id);
                                setEditingSupermarketName(market.name);
                              }}
                              className="px-2.5 py-1.5 text-slate-300 hover:text-sky-300 hover:bg-sky-500/15 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                              title="Supermarkt umbenennen"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Umbenennen</span>
                            </button>

                            {supermarkets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSupermarket(market.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                                title="Supermarkt löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-white/5 bg-surface-elevated/40 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSupermarketModal(false);
                  setEditingSupermarketId(null);
                }}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
