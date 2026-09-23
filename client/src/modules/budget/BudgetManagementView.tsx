import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { LocationBudgetSummary } from '../../../../shared/types.js';
import {
  PiggyBank,
  Receipt,
  Euro,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  ChefHat,
  AlertCircle,
  Building2,
  ShieldCheck,
  Search,
  Landmark,
  Coins,
} from 'lucide-react';

interface BudgetManagementViewProps {
  setCurrentTab: (tab: string) => void;
}

export const BudgetManagementView: React.FC<BudgetManagementViewProps> = ({ setCurrentTab }) => {
  const { user, activeLocationId, activeLocation, locations, setActiveLocationId } = useAuth();
  const isStaff = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'BETREUER';

  // Current ISO week calculation
  const getInitialWeek = () => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  const currentCalendarWeek = getInitialWeek();
  const [year, setYear] = useState(currentCalendarWeek.year);
  const [weekNumber, setWeekNumber] = useState(currentCalendarWeek.week);

  // Budget data state
  const [budgetData, setBudgetData] = useState<LocationBudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for Wocheneinkauf & Receipt
  const [weeklyBudgetInput, setWeeklyBudgetInput] = useState('');
  const [saveAsLocationDefault, setSaveAsLocationDefault] = useState(false);
  const [actualSpentInput, setActualSpentInput] = useState('');
  const [receiptNoteInput, setReceiptNoteInput] = useState('');
  const [isConfirmedInput, setIsConfirmedInput] = useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);

  // Transaction form state for Sonderkasse
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transPurpose, setTransPurpose] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState<'EXPENSE' | 'DEPOSIT'>('EXPENSE');
  const [transCategory, setTransCategory] = useState('AKTIVITAET');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

  // Startguthaben state (historische Rücklagen vor App-Einführung)
  const [showStartguthabenModal, setShowStartguthabenModal] = useState(false);
  const [startguthabenAmountInput, setStartguthabenAmountInput] = useState('');
  const [startguthabenDateInput, setStartguthabenDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [startguthabenNoteInput, setStartguthabenNoteInput] = useState('Bestehende Rücklagen aus Zeit vor der App');
  const [isSavingStartguthaben, setIsSavingStartguthaben] = useState(false);

  // Active section tab for mobile/desktop toggling
  const [activeSection, setActiveSection] = useState<'WEEK' | 'SAVINGS'>('WEEK');

  const fetchBudget = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await api.food.budget(activeLocationId, year, weekNumber);
      setBudgetData(data);
      setWeeklyBudgetInput(
        data.weeklyBudget !== null && data.weeklyBudget !== undefined ? String(data.weeklyBudget) : '350'
      );
      setActualSpentInput(
        data.actualSpent !== null && data.actualSpent !== undefined ? String(data.actualSpent) : ''
      );
      setReceiptNoteInput(data.receiptNote || '');
      setIsConfirmedInput(data.isConfirmed || false);
    } catch (err: any) {
      console.error('Fehler beim Laden der Budgetdaten:', err);
      setLoadError(err.message || 'Budgetdaten konnten nicht vom Server geladen werden.');
      const fallbackData: LocationBudgetSummary = {
        locationId: activeLocationId,
        year,
        weekNumber,
        weeklyBudget: activeLocation?.weeklyBudget ?? 350,
        estimatedShoppingCost: 0,
        actualSpent: null,
        receiptNote: null,
        isConfirmed: false,
        effectiveSpent: 0,
        remainingBudget: activeLocation?.weeklyBudget ?? 350,
        totalSavingsBalance: 0,
        confirmedSurplusTotal: 0,
        extraTransactionsTotal: 0,
        recentTransactions: [],
      };
      setBudgetData(fallbackData);
      setWeeklyBudgetInput(String(fallbackData.weeklyBudget));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [activeLocationId, year, weekNumber]);

  const handlePrevWeek = () => {
    if (weekNumber === 1) {
      setYear((y) => y - 1);
      setWeekNumber(52);
    } else {
      setWeekNumber((w) => w - 1);
    }
  };

  const handleNextWeek = () => {
    if (weekNumber >= 52) {
      setYear((y) => y + 1);
      setWeekNumber(1);
    } else {
      setWeekNumber((w) => w + 1);
    }
  };

  const handleResetToCurrentWeek = () => {
    setYear(currentCalendarWeek.year);
    setWeekNumber(currentCalendarWeek.week);
  };

  const isCurrentWeek = year === currentCalendarWeek.year && weekNumber === currentCalendarWeek.week;

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingReceipt(true);
      const parsedBudget = weeklyBudgetInput !== '' ? parseFloat(weeklyBudgetInput.replace(',', '.')) : undefined;
      const parsedSpent = actualSpentInput !== '' ? parseFloat(actualSpentInput.replace(',', '.')) : null;

      if (parsedBudget !== undefined && (isNaN(parsedBudget) || parsedBudget < 0)) {
        alert('Bitte gib einen gültigen positiven Betrag für das Wochenbudget ein.');
        return;
      }
      if (parsedSpent !== null && (isNaN(parsedSpent) || parsedSpent < 0)) {
        alert('Bitte gib einen gültigen positiven Betrag für den Kassenbon ein.');
        return;
      }

      await api.food.saveReceipt({
        locationId: activeLocationId,
        year,
        weekNumber,
        budgetAmount: parsedBudget,
        actualSpent: parsedSpent,
        receiptNote: receiptNoteInput.trim(),
        isConfirmed: isConfirmedInput,
      });

      // If user also wants to set this as default for the location
      if (saveAsLocationDefault && parsedBudget !== undefined && parsedBudget > 0) {
        try {
          await api.locations.update(activeLocationId, { weeklyBudget: parsedBudget });
        } catch (locErr) {
          console.warn('Standard-Budget am Standort konnte nicht aktualisiert werden:', locErr);
        }
      }

      await fetchBudget();
      setSuccessMessage(`Budget & Kassenbon für KW ${weekNumber} erfolgreich gespeichert!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Fehler beim Speichern: ${err.message || err}`);
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transPurpose.trim() || !transAmount) return;

    try {
      setIsSubmittingTrans(true);
      const parsedAmount = Math.abs(parseFloat(transAmount.replace(',', '.')));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Bitte gib einen Betrag größer als 0 € ein.');
        return;
      }

      await api.food.createSavingsTransaction({
        locationId: activeLocationId,
        date: transDate,
        amount: parsedAmount,
        type: transType,
        category: transCategory,
        purpose: transPurpose.trim(),
      });

      setTransPurpose('');
      setTransAmount('');
      setShowAddTransaction(false);
      await fetchBudget();
      setSuccessMessage('Sonderkassen-Buchung erfolgreich eingetragen!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Fehler beim Erfassen der Buchung: ${err.message || err}`);
    } finally {
      setIsSubmittingTrans(false);
    }
  };

  const handleDeleteTransaction = async (id: string, purpose: string) => {
    if (!window.confirm(`Möchtest du die Buchung "${purpose}" wirklich löschen?`)) return;
    try {
      await api.food.deleteSavingsTransaction(id);
      await fetchBudget();
      setSuccessMessage('Buchung erfolgreich gelöscht.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Fehler beim Löschen: ${err.message || err}`);
    }
  };

  const handleSaveStartguthaben = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startguthabenAmountInput) return;

    try {
      setIsSavingStartguthaben(true);
      const parsedAmount = Math.abs(parseFloat(startguthabenAmountInput.replace(',', '.')));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Bitte gib einen gültigen Betrag größer als 0 € ein.');
        return;
      }

      await api.food.createSavingsTransaction({
        locationId: activeLocationId,
        date: startguthabenDateInput,
        amount: parsedAmount,
        type: 'DEPOSIT',
        category: 'STARTGUTHABEN',
        purpose: startguthabenNoteInput.trim() || 'Bestehende Rücklagen aus Zeit vor der App',
      });

      setStartguthabenAmountInput('');
      setShowStartguthabenModal(false);
      await fetchBudget();
      setSuccessMessage(`Bestehende Rücklagen (${parsedAmount.toFixed(2)} €) erfolgreich als Startguthaben verbucht!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Erfassen des Startguthabens: ${err.message || err}`);
    } finally {
      setIsSavingStartguthaben(false);
    }
  };

  // Visual metrics calculation
  const spentAmount = budgetData
    ? budgetData.actualSpent !== null && budgetData.actualSpent !== undefined
      ? budgetData.actualSpent
      : budgetData.estimatedShoppingCost
    : 0;

  const totalBudget = budgetData?.weeklyBudget || 350;
  const spentPercent = Math.min(100, Math.round((spentAmount / totalBudget) * 100));
  const isOverBudget = spentAmount > totalBudget;

  // Startguthaben / Alt-Rücklagen analysis
  const startguthabenTransactions = (budgetData?.recentTransactions || []).filter(
    (tx) =>
      tx.category === 'STARTGUTHABEN' ||
      tx.purpose.toLowerCase().includes('startguthaben') ||
      tx.purpose.toLowerCase().includes('alt-rücklage')
  );
  const totalStartguthaben = startguthabenTransactions.reduce(
    (sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0),
    0
  );
  const otherTransactionsTotal = (budgetData?.extraTransactionsTotal || 0) - totalStartguthaben;

  const filteredTransactions = (budgetData?.recentTransactions || []).filter((tx) => {
    if (!transactionSearchQuery.trim()) return true;
    const q = transactionSearchQuery.toLowerCase();
    return (
      tx.purpose.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      tx.date.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER SECTION: Title, Location & Week Switcher */}
      <div className="bento-card border border-surface-border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-xs">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                Kasse & Budget
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Wöchentliche Lebensmittelbudgets, Kassenbon-Abrechnung & Sonderkasse
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Location & Week Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Location selector if caregiver has multiple locations */}
          {locations.length > 1 ? (
            <div className="flex items-center gap-1.5 bg-surface-elevated border border-surface-border rounded-2xl px-3 py-1.5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={activeLocationId}
                onChange={(e) => setActiveLocationId(e.target.value)}
                className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-surface-card text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-surface-elevated/70 border border-surface-border rounded-2xl px-3 py-1.5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">{activeLocation?.name || 'Hauptstandort'}</span>
            </div>
          )}

          {/* Week Navigator */}
          <div className="flex items-center gap-1 bg-surface-elevated border border-surface-border rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-xl hover:bg-surface-card text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Vorherige Woche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <span>KW {weekNumber}</span>
              <span className="text-slate-500 font-normal">· {year}</span>
            </span>

            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 rounded-xl hover:bg-surface-card text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Nächste Woche"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Zur aktuellen Kalenderwoche springen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aktuelle Woche</span>
            </button>
          )}
        </div>
      </div>

      {/* Success / Error Feedback Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer"
          >
            Ausblenden
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hinweis: {loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchBudget}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Neu laden
          </button>
        </div>
      )}

      {/* TOP KPI CARDS (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: Remaining Weekly Budget */}
        <div className="bento-card border border-surface-border rounded-3xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-surface-card via-surface-elevated/80 to-surface-card">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-slate-300 font-display flex items-center gap-1.5">
              <Euro className="w-4 h-4 text-emerald-400" />
              <span>Restbudget (KW {weekNumber})</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                budgetData?.isConfirmed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {budgetData?.isConfirmed ? 'Abgerechnet' : 'In Planung'}
            </span>
          </div>

          <div
            className={`text-3xl sm:text-4xl font-display font-extrabold font-mono tracking-tight ${
              isOverBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {budgetData ? `${budgetData.remainingBudget.toFixed(2)} €` : '...'}
          </div>

          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Soll-Budget: {totalBudget.toFixed(2)} €</span>
            <span className="font-mono">{spentPercent}% verbraucht</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-surface-card rounded-full overflow-hidden border border-surface-border mt-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Effective Spent for the week */}
        <div className="bento-card border border-surface-border rounded-3xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-surface-card via-surface-elevated/80 to-surface-card">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-slate-300 font-display flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-teal-400" />
              <span>Ausgaben (KW {weekNumber})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {budgetData?.actualSpent !== null ? 'Kassenbon' : 'Kalkulation'}
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-display font-extrabold font-mono text-white tracking-tight">
            {spentAmount.toFixed(2)} €
          </div>

          <div className="text-xs text-slate-400 mt-2">
            {budgetData?.actualSpent !== null ? (
              <span className="text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Vom Betreuer anhand des Kassenbons erfasst
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Geschätzt aus Zutaten ({budgetData?.estimatedShoppingCost.toFixed(2) ?? '0.00'} €)
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentTab('shopping')}
              className="text-[11px] text-theme-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>Zur Einkaufsliste</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="text-[11px] text-theme-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <ChefHat className="w-3 h-3" />
              <span>Zum Kochplan</span>
            </button>
          </div>
        </div>

        {/* KPI 3: Sonderkasse Total Balance */}
        <div className="bento-card border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-surface-elevated/90 to-surface-card sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-emerald-300 font-display flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <span>Sonderkasse (Spartopf)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-mono">
              Gemeinschaftskasse
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-display font-extrabold font-mono text-emerald-400 tracking-tight">
            {budgetData ? `${budgetData.totalSavingsBalance.toFixed(2)} €` : '...'}
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Überschüsse aus abgeschlossenen Einkäufen sowie Sonderbuchungen für Ausflüge, Kino und WG-Anschaffungen.
          </p>

          <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono">
            {totalStartguthaben > 0 && (
              <>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  <span>Start: {totalStartguthaben.toFixed(2)} €</span>
                </span>
                <span>•</span>
              </>
            )}
            <span>Überschuss: {budgetData?.confirmedSurplusTotal.toFixed(2) ?? '0.00'} €</span>
            <span>•</span>
            <span>Weitere Buchungen: {otherTransactionsTotal.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* SECTION TABS FOR RESPONSIVE NAVIGATION */}
      <div className="flex border-b border-surface-border">
        <button
          type="button"
          onClick={() => setActiveSection('WEEK')}
          className={`py-3 px-5 text-sm font-display font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSection === 'WEEK'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Wocheneinkauf & Abrechnung (KW {weekNumber})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('SAVINGS')}
          className={`py-3 px-5 text-sm font-display font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSection === 'SAVINGS'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Sonderkasse & Kassenbuch</span>
          {budgetData && budgetData.recentTransactions.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-mono bg-surface-elevated rounded-full border border-surface-border text-slate-300">
              {budgetData.recentTransactions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: WOCHENEINKAUF & ABRECHNUNG */}
      {activeSection === 'WEEK' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Left Column: Form to enter Weekly Budget, Receipt & Confirmation */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bento-card border border-surface-border rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-white">
                      Wochenbudget & Kassenbon erfassen
                    </h2>
                    <p className="text-xs text-slate-400">
                      Standort {activeLocation?.name} · Kalenderwoche {weekNumber} / {year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                      budgetData?.isConfirmed
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {budgetData?.isConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Abgerechnet</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>In Planung</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveReceipt} className="space-y-4">
                {/* Row 1: Budget inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                      Wochenbudget für KW {weekNumber} (€) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={weeklyBudgetInput}
                        onChange={(e) => setWeeklyBudgetInput(e.target.value)}
                        placeholder="350.00"
                        className="w-full px-3.5 py-2.5 bg-surface-elevated border border-emerald-500/40 rounded-xl text-sm font-bold text-emerald-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">€</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Festgelegter Betrag für die Verpflegung dieser Woche.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Tatsächlicher Kassenbon-Betrag (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={actualSpentInput}
                        onChange={(e) => setActualSpentInput(e.target.value)}
                        placeholder={budgetData?.estimatedShoppingCost ? budgetData.estimatedShoppingCost.toFixed(2) : 'z.B. 312.45'}
                        className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">€</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Betrag laut Einkaufszettel (nach Rabatt/Pfand).
                    </p>
                  </div>
                </div>

                {/* Option to persist as location default */}
                <div className="p-3 bg-surface-elevated/60 border border-surface-border rounded-2xl">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveAsLocationDefault}
                      onChange={(e) => setSaveAsLocationDefault(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-border text-emerald-500 focus:ring-emerald-500/40 bg-surface-card"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200">
                        Als Standard-Wochenbudget für Standort "{activeLocation?.name}" übernehmen
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Zukünftige Wochen erhalten dann automatisch diesen Grundwert ({weeklyBudgetInput || '350'} €).
                      </p>
                    </div>
                  </label>
                </div>

                {/* Row 2: Receipt Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Notiz zum Kassenbon (Supermarkt, Pfand, Besonderheiten)
                  </label>
                  <input
                    type="text"
                    value={receiptNoteInput}
                    onChange={(e) => setReceiptNoteInput(e.target.value)}
                    placeholder="z.B. Netto Marken-Discount, Pfandgutschein 4.25 € verrechnet"
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Row 3: Final confirmation checkbox */}
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isConfirmedInput}
                      onChange={(e) => setIsConfirmedInput(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-emerald-500/40 text-emerald-500 focus:ring-emerald-500/40 bg-surface-card"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Woche endgültig abschließen & als abgerechnet markieren
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        Wenn aktiviert, wird der verbleibende Restbetrag ({budgetData ? Math.max(0, budgetData.weeklyBudget - (parseFloat(actualSpentInput || '0') || 0)).toFixed(2) : '0.00'} €) fest als Sparbetrag verbucht und fließt in die Sonderkasse.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    * Änderungen sind jederzeit durch Betreuer anpassbar
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingReceipt}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingReceipt ? 'Speichere...' : 'Wochenbudget & Bon speichern'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Weekly Breakdown & Explanations */}
          <div className="lg:col-span-5 space-y-4">
            {/* Calculation Card */}
            <div className="bento-card border border-surface-border rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                <Euro className="w-4 h-4 text-emerald-400" />
                <span>Budget-Abrechnung für KW {weekNumber}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-surface-border/60">
                  <span className="text-slate-400">Festgelegtes Budget:</span>
                  <span className="font-mono font-bold text-white">
                    {totalBudget.toFixed(2)} €
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-surface-border/60">
                  <span className="text-slate-400">Rezept-Kalkulation (Zutaten):</span>
                  <span className="font-mono text-slate-300">
                    {budgetData?.estimatedShoppingCost.toFixed(2) ?? '0.00'} €
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-surface-border/60">
                  <span className="text-slate-400">Tatsächlich laut Bon erfasst:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {budgetData?.actualSpent !== null && budgetData?.actualSpent !== undefined
                      ? `${budgetData.actualSpent.toFixed(2)} €`
                      : 'Noch nicht erfasst'}
                  </span>
                </div>

                <div className="flex justify-between py-2.5 text-sm font-bold pt-3">
                  <span className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'}>
                    {isOverBudget ? 'Budget-Überschreitung:' : 'Verbleibender Überschuss:'}
                  </span>
                  <span
                    className={`font-mono ${
                      isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {budgetData ? `${budgetData.remainingBudget.toFixed(2)} €` : '0.00 €'}
                  </span>
                </div>
              </div>

              {budgetData?.receiptNote && (
                <div className="p-3 bg-surface-elevated rounded-xl border border-surface-border text-xs">
                  <div className="font-semibold text-slate-300 mb-0.5">Hinterlegte Bon-Notiz:</div>
                  <div className="text-slate-400 italic font-mono text-[11px]">
                    "{budgetData.receiptNote}"
                  </div>
                </div>
              )}

              <div className="p-4 bg-surface-elevated/70 border border-surface-border rounded-2xl text-xs space-y-2 text-slate-300 leading-relaxed">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Wie funktioniert das Budget-System?</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  1. Zu Beginn der Woche schätzen die Bewohner ihre Einkäufe über den gemeinsamen Kochplan.
                </p>
                <p className="text-[11px] text-slate-400">
                  2. Nach dem Einkauf trägt der Betreuer den Kassenbon ein.
                </p>
                <p className="text-[11px] text-slate-400">
                  3. Wird die Woche abgeschlossen, fließt jeder gesparte Euro direkt in die Sonderkasse für gemeinsame WG-Freizeitaktivitäten!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SONDERKASSE & KASSENBUCH */}
      {activeSection === 'SAVINGS' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Sonderkasse Highlight Card */}
          <div className="bento-card border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl bg-gradient-to-br from-emerald-500/15 via-surface-card to-surface-elevated flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                  <PiggyBank className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                  Sonderkasse · Standort {activeLocation?.name}
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold font-display font-mono text-white tracking-tight">
                {budgetData ? `${budgetData.totalSavingsBalance.toFixed(2)} €` : '...'}
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Dieser Spartopf wächst automatisch mit jedem Wocheneinkauf, bei dem weniger als das Budget ausgegeben wurde. Betreuer können hier Sonderausgaben für gemeinsame Erlebnisse eintragen.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowStartguthabenModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Coins className="w-4 h-4" />
                <span>Startguthaben / Alt-Rücklagen</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddTransaction(!showAddTransaction)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddTransaction ? 'Formular schließen' : 'Neue Buchung eintragen'}</span>
              </button>
            </div>
          </div>

          {/* Helper Card for recording historical reserves if none exist yet */}
          {totalStartguthaben === 0 ? (
            <div className="bento-card border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface-card to-surface-elevated rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 shadow-sm">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display text-amber-200 flex items-center gap-2">
                    <span>Vorhandene Alt-Rücklagen vor App-Einführung erfassen</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">Für Betreuer</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                    Du startest hier nicht bei 0 €: Wenn deine Wohngruppe vor der Nutzung dieser App bereits Kassenbestände oder Ersparnisse hatte, trage diese hier als Startguthaben ein, damit sie im Gesamtsaldo der Sonderkasse berücksichtigt werden.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStartguthabenModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Coins className="w-4 h-4" />
                <span>Startguthaben eintragen</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-amber-200 text-sm flex items-center gap-2">
                    <span>Startguthaben vor App-Einführung:</span>
                    <span className="font-mono font-bold text-white text-base">{totalStartguthaben.toFixed(2)} €</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Bestehende Rücklagen wurden erfasst und sind fest im aktuellen Gesamtsaldo ({budgetData ? `${budgetData.totalSavingsBalance.toFixed(2)} €` : '...'}) enthalten.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStartguthabenModal(true)}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Weiteren Alt-Bestand erfassen</span>
              </button>
            </div>
          )}

          {/* MODAL / OVERLAY: RECORD HISTORICAL RESERVES (STARTGUTHABEN) */}
          {showStartguthabenModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-surface-card border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-surface-border bg-surface-elevated/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl shadow-xs">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-white">
                        Vorhandene Rücklagen erfassen
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Startguthaben aus der Zeit vor dieser App · {activeLocation?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStartguthabenModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveStartguthaben} className="p-6 space-y-4">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-slate-300 space-y-1 leading-relaxed">
                    <div className="font-bold text-amber-200 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Wie funktioniert das Startguthaben?</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Hier kannst du den Geldbetrag eintragen, den die Wohngruppe bereits vor der Einführung dieser App angespart oder in der Barkasse hatte. Der Betrag wird als Anfangsbestand im Kassenbuch hinterlegt und dem Guthaben der Sonderkasse gutgeschrieben.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                        Vorhandene Rücklagen (€) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={startguthabenAmountInput}
                          onChange={(e) => setStartguthabenAmountInput(e.target.value)}
                          placeholder="z.B. 450.00"
                          className="w-full px-3.5 py-2.5 bg-surface-elevated border border-amber-500/40 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Stichtag / Datum
                      </label>
                      <input
                        type="date"
                        required
                        value={startguthabenDateInput}
                        onChange={(e) => setStartguthabenDateInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Bezeichnung / Herkunft
                    </label>
                    <input
                      type="text"
                      required
                      value={startguthabenNoteInput}
                      onChange={(e) => setStartguthabenNoteInput(e.target.value)}
                      placeholder="z.B. Bisherige Barkasse Tresor, Ersparnisse vor digitalem Alltagsplaner"
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
                    <button
                      type="button"
                      onClick={() => setShowStartguthabenModal(false)}
                      className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingStartguthaben}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{isSavingStartguthaben ? 'Speichere...' : 'Als Startguthaben übernehmen'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Form to add a new transaction */}
          {showAddTransaction && (
            <div className="bento-card border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Neue Sonderkassen-Buchung erfassen</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Art der Buchung</label>
                    <select
                      value={transType}
                      onChange={(e) => setTransType(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      <option value="EXPENSE">Ausgabe (-) z.B. Kinobesuch</option>
                      <option value="DEPOSIT">Einzahlung (+) z.B. Spende / Pfandtopf</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategorie</label>
                    <select
                      value={transCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTransCategory(val);
                        if (val === 'STARTGUTHABEN' || val === 'EINZAHLUNG') {
                          setTransType('DEPOSIT');
                        }
                      }}
                      className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      <option value="AKTIVITAET">Aktivität (Kino, Bowling, Eis essen)</option>
                      <option value="SONDERANSCHAFFUNG">Sonderanschaffung (Spiele, Küchengerät)</option>
                      <option value="REPARATUR">Reparatur & Instandhaltung</option>
                      <option value="STARTGUTHABEN">🪙 Startguthaben / Alt-Rücklage (vor App-Start)</option>
                      <option value="EINZAHLUNG">Einzahlung / Spende / Pfandkasse</option>
                      <option value="SONSTIGES">Sonstiges</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Betrag (€) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={transAmount}
                        onChange={(e) => setTransAmount(e.target.value)}
                        placeholder="25.00"
                        className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">€</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Verwendungszweck *</label>
                    <input
                      type="text"
                      required
                      value={transPurpose}
                      onChange={(e) => setTransPurpose(e.target.value)}
                      placeholder="z.B. Popcorn & Nachos beim Kinoausflug, Neuer Waffeleisen für WG"
                      className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Datum</label>
                    <input
                      type="date"
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border/60">
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(false)}
                    className="px-4 py-2 bg-surface-elevated text-slate-300 rounded-xl text-xs hover:text-white cursor-pointer"
                  >
                    Abbrechen
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingTrans}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmittingTrans ? 'Speichere...' : 'Buchung speichern'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transactions List & Search */}
          <div className="bento-card border border-surface-border rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border/60 pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  Kassenbuch & Buchungsverlauf
                </h3>
                <p className="text-xs text-slate-400">
                  Chronologische Übersicht aller getätigten Ausgaben und Einzahlungen
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={transactionSearchQuery}
                  onChange={(e) => setTransactionSearchQuery(e.target.value)}
                  placeholder="Buchung suchen..."
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-8 bg-surface-elevated/40 border border-dashed border-surface-border rounded-2xl text-center text-xs text-slate-400 space-y-2">
                <PiggyBank className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                <p className="font-semibold text-slate-300">Noch keine Buchungen vorhanden</p>
                <p className="max-w-md mx-auto text-[11px] text-slate-400">
                  Sobald Wocheneinkäufe mit Restbudget abgerechnet oder manuelle Ausgaben für gemeinsame Aktivitäten erfasst werden, erscheinen sie hier im Kassenbuch.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTransactions.map((tx) => {
                  const isNegative = tx.amount < 0;
                  const isStartguthaben =
                    tx.category === 'STARTGUTHABEN' ||
                    tx.purpose.toLowerCase().includes('startguthaben') ||
                    tx.purpose.toLowerCase().includes('alt-rücklage');

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border rounded-2xl flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isStartguthaben
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                              : isNegative
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isStartguthaben ? (
                            <Landmark className="w-4 h-4" />
                          ) : isNegative ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate text-sm">
                            {tx.purpose}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-md border ${
                                isStartguthaben
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold'
                                  : 'bg-surface-card border-surface-border text-slate-300'
                              }`}
                            >
                              {isStartguthaben ? '🪙 Startguthaben' : tx.category}
                            </span>
                            <span>•</span>
                            <span>{tx.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono font-bold text-base ${
                            isStartguthaben
                              ? 'text-amber-300'
                              : isNegative
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isNegative ? '' : '+'}
                          {tx.amount.toFixed(2)} €
                        </span>

                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id, tx.purpose)}
                            title="Buchung löschen"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
