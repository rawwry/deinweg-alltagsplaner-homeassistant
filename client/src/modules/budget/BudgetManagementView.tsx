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
  Edit2,
  Wallet,
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
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  const currentCalendarWeek = getInitialWeek();
  const [year, setYear] = useState(currentCalendarWeek.year);
  const [weekNumber, setWeekNumber] = useState(currentCalendarWeek.week);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'WEEK' | 'SAVINGS'>('WEEK');

  // Budget data state
  const [budgetData, setBudgetData] = useState<LocationBudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for Wocheneinkauf & Receipt
  const [actualSpentInput, setActualSpentInput] = useState('');
  const [receiptNoteInput, setReceiptNoteInput] = useState('');
  const [isConfirmedInput, setIsConfirmedInput] = useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);

  // Budget adjustment modal / collapsible
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [weeklyBudgetInput, setWeeklyBudgetInput] = useState('');
  const [saveAsLocationDefault, setSaveAsLocationDefault] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Transaction form state for Sonderkasse
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transPurpose, setTransPurpose] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState<'EXPENSE' | 'DEPOSIT' | 'STARTGUTHABEN'>('EXPENSE');
  const [transDate, setTransDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

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

  // Save receipt & close week
  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingReceipt(true);
      const parsedSpent = actualSpentInput !== '' ? parseFloat(actualSpentInput.replace(',', '.')) : null;

      if (parsedSpent !== null && (isNaN(parsedSpent) || parsedSpent < 0)) {
        alert('Bitte gib einen gültigen positiven Betrag für den Kassenbon ein.');
        return;
      }

      await api.food.saveReceipt({
        locationId: activeLocationId,
        year,
        weekNumber,
        actualSpent: parsedSpent,
        receiptNote: receiptNoteInput.trim(),
        isConfirmed: isConfirmedInput,
      });

      await fetchBudget();
      setSuccessMessage(
        isConfirmedInput
          ? `KW ${weekNumber} erfolgreich abgerechnet & abgeschlossen!`
          : `Kassenbon für KW ${weekNumber} gespeichert.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Fehler beim Speichern: ${err.message || err}`);
    } finally {
      setIsSavingReceipt(false);
    }
  };

  // Update weekly budget amount
  const handleUpdateWeeklyBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingBudget(true);
      const parsedBudget = parseFloat(weeklyBudgetInput.replace(',', '.'));
      if (isNaN(parsedBudget) || parsedBudget <= 0) {
        alert('Bitte gib ein gültiges Budget größer als 0 € ein.');
        return;
      }

      await api.food.saveReceipt({
        locationId: activeLocationId,
        year,
        weekNumber,
        budgetAmount: parsedBudget,
      });

      if (saveAsLocationDefault) {
        try {
          await api.locations.update(activeLocationId, { weeklyBudget: parsedBudget });
        } catch (locErr) {
          console.warn('Standard-Budget am Standort konnte nicht aktualisiert werden:', locErr);
        }
      }

      setShowEditBudget(false);
      await fetchBudget();
      setSuccessMessage(`Wochenbudget auf ${parsedBudget.toFixed(2)} € aktualisiert.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(`Fehler beim Aktualisieren: ${err.message || err}`);
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Create a transaction in Sonderkasse
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

      const isStartguthaben = transType === 'STARTGUTHABEN';
      const actualType = isStartguthaben ? 'DEPOSIT' : transType;
      const actualCategory = isStartguthaben
        ? 'STARTGUTHABEN'
        : transType === 'EXPENSE'
        ? 'AKTIVITAET'
        : 'EINZAHLUNG';

      await api.food.createSavingsTransaction({
        locationId: activeLocationId,
        date: transDate,
        amount: parsedAmount,
        type: actualType,
        category: actualCategory,
        purpose: transPurpose.trim(),
      });

      setTransPurpose('');
      setTransAmount('');
      setShowAddTransaction(false);
      await fetchBudget();
      setSuccessMessage('Buchung erfolgreich im Kassenbuch eingetragen!');
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

  // Metrics
  const spentAmount = budgetData
    ? budgetData.actualSpent !== null && budgetData.actualSpent !== undefined
      ? budgetData.actualSpent
      : budgetData.estimatedShoppingCost
    : 0;

  const totalBudget = budgetData?.weeklyBudget || 350;
  const spentPercent = totalBudget > 0 ? Math.min(100, Math.round((spentAmount / totalBudget) * 100)) : 0;
  const isOverBudget = spentAmount > totalBudget;
  const hasReceipt = budgetData?.actualSpent !== null && budgetData?.actualSpent !== undefined;

  // Filter transactions
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
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-150">
      {/* 1. Header Row: Title, Location & Week Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-300 mb-2 font-display">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Kasse & Finanzen</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Kasse & Budget
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Wocheneinkauf & Sonderkasse für{' '}
            <span className="text-slate-200 font-medium">
              {activeLocation?.name || 'unsere WG'}
            </span>
          </p>
        </div>

        {/* Location & Week Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {locations.length > 1 && (
            <div className="flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-2xl px-3 py-1.5 text-xs text-slate-300">
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
          )}

          {/* Week Switcher */}
          <div className="inline-flex items-center bg-surface-card border border-surface-border rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2 hover:bg-surface-elevated rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Vorherige Woche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white font-mono tracking-wide">
              KW {weekNumber} <span className="text-slate-500 font-normal">({year})</span>
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 hover:bg-surface-elevated rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Nächste Woche"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="px-3 py-2 rounded-2xl bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Zur aktuellen Woche"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Heute</span>
            </button>
          )}
        </div>
      </div>

      {/* Success / Error Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchBudget}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* 2. Main Navigation Tabs: Wocheneinkauf vs. Sonderkasse */}
      <div className="flex bg-surface-card/60 p-1 rounded-2xl border border-surface-border gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('WEEK')}
          className={`flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'WEEK'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Wocheneinkauf (KW {weekNumber})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SAVINGS')}
          className={`flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'SAVINGS'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/50'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Sonderkasse & Kassenbuch</span>
          {budgetData && budgetData.recentTransactions?.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-mono bg-white/20 text-white rounded-full">
              {budgetData.recentTransactions.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB 1: WOCHENEINKAUF & KASSENBON */}
      {activeTab === 'WEEK' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Card A: Weekly Budget Hero Card (3 Core Numbers) */}
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title & Status Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 font-display">
                <Euro className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Status KW {weekNumber}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  budgetData?.isConfirmed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {budgetData?.isConfirmed ? '✓ Abgerechnet' : 'In Planung'}
              </span>
            </div>

            {/* 3 Numbers Grid: Gesamtbudget, Verwendet, Verbleibend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
              {/* 1. Gesamtbudget */}
              <div className="p-4 rounded-2xl bg-surface-elevated/50 border border-surface-border/60 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
                    Wochenbudget
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEditBudget(!showEditBudget)}
                    className="text-slate-400 hover:text-emerald-300 p-1 transition-colors cursor-pointer"
                    title="Budget anpassen"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-white font-mono">
                  {totalBudget.toFixed(2)} €
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-sans">
                  Grundbudget für Lebensmittel
                </div>
              </div>

              {/* 2. Ausgegeben */}
              <div className="p-4 rounded-2xl bg-surface-elevated/50 border border-surface-border/60">
                <div className="text-[11px] text-slate-400 font-sans uppercase tracking-wider font-semibold mb-1">
                  {hasReceipt ? 'Kassenbon erfasst' : 'Zutaten-Kalkulation'}
                </div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-slate-200 font-mono">
                  {spentAmount.toFixed(2)} €
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-sans">
                  {hasReceipt ? 'Tatsächlich ausgegeben' : 'Geschätzt aus Kochplan'}
                </div>
              </div>

              {/* 3. Verbleibend */}
              <div
                className={`p-4 rounded-2xl border ${
                  isOverBudget
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/25'
                }`}
              >
                <div
                  className={`text-[11px] font-sans uppercase tracking-wider font-semibold mb-1 ${
                    isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isOverBudget ? 'Überschreitung' : 'Verbleibend / Ersparnis'}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-display font-bold font-mono ${
                    isOverBudget ? 'text-rose-400' : 'text-emerald-300'
                  }`}
                >
                  {budgetData ? `${budgetData.remainingBudget.toFixed(2)} €` : '...'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-sans">
                  {isOverBudget
                    ? 'Budget überschritten'
                    : budgetData?.isConfirmed
                    ? 'In Sonderkasse verbucht'
                    : 'Möglicher Sparbetrag'}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 space-y-1.5">
              <div className="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{spentPercent}% verbraucht</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('shopping')}
                    className="hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Einkaufsliste</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Edit Budget Form */}
            {showEditBudget && (
              <form
                onSubmit={handleUpdateWeeklyBudget}
                className="mt-5 pt-4 border-t border-white/5 space-y-3 bg-surface-elevated/40 p-4 rounded-2xl border border-surface-border animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-display">
                    Wochenbudget für KW {weekNumber} anpassen
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEditBudget(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Schließen
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Neuer Betrag (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={weeklyBudgetInput}
                      onChange={(e) => setWeeklyBudgetInput(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={saveAsLocationDefault}
                        onChange={(e) => setSaveAsLocationDefault(e.target.checked)}
                        className="w-4 h-4 rounded border-surface-border text-emerald-500 focus:ring-emerald-500/40 bg-surface-card"
                      />
                      <span>Dauerhaft als Standard für {activeLocation?.name} speichern</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditBudget(false)}
                    className="px-3.5 py-1.5 bg-surface-elevated hover:bg-surface-card text-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBudget}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingBudget ? 'Speichere...' : 'Budget aktualisieren'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card B: Receipt Entry & Week Closing Form */}
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-sm shadow-xs shrink-0">
                🧾
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  Kassenbon erfassen & abrechnen
                </h3>
                <p className="text-xs text-slate-400">
                  Trage den tatsächlichen Einkaufsbetrag ein und schließe die Woche bei Bedarf ab.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveReceipt} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Actual Spent Input */}
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
                      placeholder={
                        budgetData?.estimatedShoppingCost
                          ? budgetData.estimatedShoppingCost.toFixed(2)
                          : 'z.B. 312.45'
                      }
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">€</span>
                  </div>
                </div>

                {/* 2. Receipt Note Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Notiz / Supermarkt (optional)
                  </label>
                  <input
                    type="text"
                    value={receiptNoteInput}
                    onChange={(e) => setReceiptNoteInput(e.target.value)}
                    placeholder="z.B. Netto, Pfandgutschein verrechnet"
                    className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* 3. Closing Checkbox */}
              <div className="p-3.5 bg-surface-elevated/40 border border-surface-border rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isConfirmedInput}
                    onChange={(e) => setIsConfirmedInput(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-emerald-500/40 text-emerald-500 focus:ring-emerald-500/40 bg-surface-card"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Woche abschließen & verbleibenden Betrag der Sonderkasse gutschreiben
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Der nicht verbrauchte Betrag fließt fest in den Gemeinschafts-Spartopf.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSavingReceipt}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingReceipt ? 'Speichere...' : 'Kassenbon speichern'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TAB 2: SONDERKASSE & KASSENBUCH */}
      {activeTab === 'SAVINGS' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Card A: Sonderkasse Balance Hero */}
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 font-display mb-1.5">
                  <PiggyBank className="w-4 h-4" />
                  <span>Sonderkasse ({activeLocation?.name || 'WG'})</span>
                </div>
                <div className="text-3xl sm:text-4xl font-display font-extrabold font-mono text-white tracking-tight">
                  {budgetData ? `${budgetData.totalSavingsBalance.toFixed(2)} €` : '...'}
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Rücklagen aus Wocheneinkäufen und Startguthaben für WG-Aktivitäten & Ausflüge.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTransType('EXPENSE');
                    setShowAddTransaction(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buchung erfassen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransType('STARTGUTHABEN');
                    setTransPurpose('Bestehende Rücklagen aus Zeit vor der App');
                    setShowAddTransaction(true);
                  }}
                  className="px-4 py-2 bg-surface-elevated hover:bg-surface-card border border-surface-border text-slate-300 hover:text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Startguthaben</span>
                </button>
              </div>
            </div>

            {/* Quick breakdown footer */}
            <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
              <span>Aus Wochenüberschüssen: +{(budgetData?.confirmedSurplusTotal ?? 0).toFixed(2)} €</span>
              <span>•</span>
              <span>Sonderbuchungen / Start: {(budgetData?.extraTransactionsTotal ?? 0).toFixed(2)} €</span>
            </div>
          </div>

          {/* Card B: New Transaction Form (collapsible) */}
          {showAddTransaction && (
            <div className="bento-card rounded-[2.5rem] p-6 border border-emerald-500/30 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/15 text-emerald-300 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-display font-bold text-white">
                    {transType === 'STARTGUTHABEN'
                      ? '🪙 Startguthaben / Alt-Rücklagen erfassen'
                      : 'Neue Sonderkassen-Buchung'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                {/* Type Selection */}
                <div className="flex bg-surface-card p-1 rounded-xl border border-surface-border gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setTransType('EXPENSE')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      transType === 'EXPENSE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ausgabe (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransType('DEPOSIT')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      transType === 'DEPOSIT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Einzahlung (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransType('STARTGUTHABEN')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      transType === 'STARTGUTHABEN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🪙 Startguthaben
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Betrag (€) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={transAmount}
                        onChange={(e) => setTransAmount(e.target.value)}
                        placeholder="25.00"
                        className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">€</span>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Verwendungszweck *
                    </label>
                    <input
                      type="text"
                      required
                      value={transPurpose}
                      onChange={(e) => setTransPurpose(e.target.value)}
                      placeholder={
                        transType === 'STARTGUTHABEN'
                          ? 'Bestehende Rücklagen aus Zeit vor der App'
                          : 'z.B. Kinobesuch, Neues Waffeleisen'
                      }
                      className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Datum</label>
                  <input
                    type="date"
                    value={transDate}
                    onChange={(e) => setTransDate(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(false)}
                    className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTrans}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 transition-all shadow-md"
                  >
                    {isSubmittingTrans ? 'Speichere...' : 'Buchung speichern'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Card C: Kassenbuch List & Search */}
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  Kassenbuch
                </h3>
                <p className="text-xs text-slate-400">
                  Chronologische Übersicht aller Ausgaben und Einzahlungen
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
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
              <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
                <PiggyBank className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-semibold text-slate-300">Keine Buchungen vorhanden</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Sobald Wocheneinkäufe abgerechnet oder Sonderbuchungen erfasst werden, erscheinen sie hier.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredTransactions.map((tx) => {
                  const isNegative = tx.amount < 0;
                  const isStartguthaben =
                    tx.category === 'STARTGUTHABEN' ||
                    tx.purpose.toLowerCase().includes('startguthaben') ||
                    tx.purpose.toLowerCase().includes('alt-rücklage');

                  return (
                    <div
                      key={tx.id}
                      className="py-3 px-2 flex items-center justify-between gap-3 group rounded-xl hover:bg-surface-elevated/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isStartguthaben
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
                          <div className="font-semibold text-slate-200 truncate text-xs sm:text-sm">
                            {tx.purpose}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                            <span>{tx.date}</span>
                            {isStartguthaben && (
                              <>
                                <span>•</span>
                                <span className="text-amber-300 font-semibold">Startguthaben</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono font-bold text-xs sm:text-sm ${
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
                            className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
