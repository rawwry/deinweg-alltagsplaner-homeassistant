import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { LocationBudgetSummary } from '../../../../shared/types.js';
import {
  X,
  PiggyBank,
  Receipt,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  Euro,
  ArrowRight,
} from 'lucide-react';

interface LocationBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  year: number;
  weekNumber: number;
  isStaff: boolean;
  onBudgetUpdated: () => void;
}

export const LocationBudgetModal: React.FC<LocationBudgetModalProps> = ({
  isOpen,
  onClose,
  locationId,
  locationName,
  year,
  weekNumber,
  isStaff,
  onBudgetUpdated,
}) => {
  const { user } = useAuth();
  const effectiveIsStaff =
    isStaff ||
    user?.role?.toUpperCase() === 'ADMIN' ||
    user?.role?.toUpperCase() === 'BETREUER';

  const [activeTab, setActiveTab] = useState<'WEEK' | 'SAVINGS'>('WEEK');
  const [budgetData, setBudgetData] = useState<LocationBudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Caregiver receipt form state
  const [weeklyBudgetInput, setWeeklyBudgetInput] = useState('');
  const [actualSpentInput, setActualSpentInput] = useState('');
  const [receiptNoteInput, setReceiptNoteInput] = useState('');
  const [isConfirmedInput, setIsConfirmedInput] = useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);

  // New transaction form state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transPurpose, setTransPurpose] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState<'EXPENSE' | 'DEPOSIT'>('EXPENSE');
  const [transCategory, setTransCategory] = useState('AKTIVITAET');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);

  const fetchBudget = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await api.food.budget(locationId, year, weekNumber);
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
      // Resilient fallback so the user is never locked out with an infinite spinner!
      const fallbackData: LocationBudgetSummary = {
        locationId,
        year,
        weekNumber,
        weeklyBudget: 350,
        estimatedShoppingCost: 0,
        actualSpent: null,
        receiptNote: null,
        isConfirmed: false,
        effectiveSpent: 0,
        remainingBudget: 350,
        totalSavingsBalance: 0,
        confirmedSurplusTotal: 0,
        extraTransactionsTotal: 0,
        recentTransactions: [],
      };
      setBudgetData(fallbackData);
      setWeeklyBudgetInput('350');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBudget();
    }
  }, [isOpen, locationId, year, weekNumber]);

  if (!isOpen) return null;

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingReceipt(true);
      const parsedBudget = weeklyBudgetInput !== '' ? parseFloat(weeklyBudgetInput.replace(',', '.')) : undefined;
      const parsedSpent = actualSpentInput !== '' ? parseFloat(actualSpentInput.replace(',', '.')) : null;

      if (parsedBudget !== undefined && isNaN(parsedBudget)) {
        alert('Bitte gib einen gültigen Betrag für das Wochenbudget ein.');
        return;
      }
      if (parsedSpent !== null && isNaN(parsedSpent)) {
        alert('Bitte gib einen gültigen Betrag für den Kassenbon ein.');
        return;
      }

      await api.food.saveReceipt({
        locationId,
        year,
        weekNumber,
        budgetAmount: parsedBudget,
        actualSpent: parsedSpent,
        receiptNote: receiptNoteInput.trim(),
        isConfirmed: isConfirmedInput,
      });
      await fetchBudget();
      onBudgetUpdated();
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
      await api.food.createSavingsTransaction({
        locationId,
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
      onBudgetUpdated();
    } catch (err: any) {
      alert(`Fehler beim Erfassen der Buchung: ${err.message || err}`);
    } finally {
      setIsSubmittingTrans(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) return;
    try {
      await api.food.deleteSavingsTransaction(id);
      await fetchBudget();
      onBudgetUpdated();
    } catch (err: any) {
      alert(`Fehler beim Löschen: ${err.message || err}`);
    }
  };

  // Visual calculation for weekly spent percentage
  const spentAmount = budgetData
    ? budgetData.actualSpent !== null && budgetData.actualSpent !== undefined
      ? budgetData.actualSpent
      : budgetData.estimatedShoppingCost
    : 0;

  const totalBudget = budgetData?.weeklyBudget || 350;
  const spentPercent = Math.min(100, Math.round((spentAmount / totalBudget) * 100));
  const isOverBudget = spentAmount > totalBudget;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl shadow-xs">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                WG-Kasse & Budget
              </h2>
              <p className="text-[11px] text-slate-400">
                Standort {locationName} • KW {weekNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Segmented Tab Switcher */}
        <div className="px-6 pt-4 pb-2 bg-surface-card border-b border-white/5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-elevated rounded-2xl border border-surface-border">
            <button
              type="button"
              onClick={() => setActiveTab('WEEK')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'WEEK'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-display'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Wocheneinkauf (KW {weekNumber})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SAVINGS')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'SAVINGS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-display'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>WG-Sonderkasse (Spartopf)</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loadError && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>Standard-Budgetdaten geladen. Server-Meldung: {loadError}</span>
              </div>
              <button
                type="button"
                onClick={fetchBudget}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                Erneut laden
              </button>
            </div>
          )}

          {!budgetData ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent mb-2" />
              <div className="text-xs">Lade Budgetdaten...</div>
            </div>
          ) : activeTab === 'WEEK' ? (
            /* TAB 1: WOCHENEINKAUF */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Main Status Hero Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-surface-elevated to-surface-card border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 font-display">
                    Verfügbares Budget für diese Woche
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      budgetData.isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {budgetData.isConfirmed ? 'Abgerechnet' : 'In Planung'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div
                      className={`text-3xl font-display font-bold font-mono ${
                        isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {budgetData.remainingBudget.toFixed(2)} €
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isOverBudget
                        ? 'Achtung: Der Einkauf liegt über dem Budget!'
                        : 'stehen für den Einkauf noch zur Verfügung.'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-2.5 bg-surface-card rounded-full overflow-hidden border border-surface-border">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Ausgegeben: {spentAmount.toFixed(2)} €</span>
                    <span>Budget: {totalBudget.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3.5 bg-surface-elevated/70 border border-surface-border rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  {budgetData.isConfirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Wocheneinkauf ist abgerechnet</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Einkauf noch nicht abgeschlossen</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {budgetData.isConfirmed
                    ? `Der Kassenbon über ${budgetData.actualSpent?.toFixed(
                        2
                      )} € wurde erfasst. Übrig gebliebene ${Math.max(
                        0,
                        budgetData.weeklyBudget - (budgetData.actualSpent ?? 0)
                      ).toFixed(2)} € fließen in die WG-Sonderkasse.`
                    : `Aktuell basiert die Berechnung auf dem geschätzten Zutatenpreis (${budgetData.estimatedShoppingCost.toFixed(
                        2
                      )} €). Sobald der Bon vorliegt, können Betreuer den Betrag final abrechnen.`}
                </p>
                {budgetData.receiptNote && (
                  <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5">
                    Notiz: {budgetData.receiptNote}
                  </p>
                )}
              </div>

              {/* Caregiver Form: Budget & Receipt */}
              {effectiveIsStaff && (
                <form
                  onSubmit={handleSaveReceipt}
                  className="bg-surface-elevated border border-surface-border rounded-2xl p-4 space-y-3"
                >
                  <div className="text-xs font-display font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Euro className="w-3.5 h-3.5" />
                      Wochenbudget & Kassenbon (Betreuer)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">KW {weekNumber}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                        Wochenbudget für KW {weekNumber} (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={weeklyBudgetInput}
                        onChange={(e) => setWeeklyBudgetInput(e.target.value)}
                        placeholder="350.00"
                        className="w-full px-3 py-2 bg-surface-card border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Betrag laut Bon (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={actualSpentInput}
                        onChange={(e) => setActualSpentInput(e.target.value)}
                        placeholder={budgetData.estimatedShoppingCost.toFixed(2)}
                        className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Notiz zum Bon / Einkauf
                      </label>
                      <input
                        type="text"
                        value={receiptNoteInput}
                        onChange={(e) => setReceiptNoteInput(e.target.value)}
                        placeholder="z.B. Netto, Pfand verrechnet"
                        className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isConfirmedInput}
                        onChange={(e) => setIsConfirmedInput(e.target.checked)}
                        className="w-4 h-4 rounded border-surface-border text-emerald-500 focus:ring-emerald-500/40 bg-surface-card"
                      />
                      <span className="text-[11px] text-slate-300">
                        Woche als abgerechnet markieren
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSavingReceipt}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSavingReceipt ? 'Speichern...' : 'Wochenbudget & Bon speichern'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* TAB 2: WG-SONDERKASSE */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Savings Pot Highlight Card */}
              <div className="bg-gradient-to-br from-emerald-500/15 via-surface-elevated to-surface-card border border-emerald-500/40 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 font-display flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-emerald-400" />
                    <span>Aktueller Stand der WG-Sonderkasse</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                    Gemeinschaftstopf
                  </span>
                </div>

                <div className="text-3xl font-display font-bold text-white font-mono">
                  {budgetData.totalSavingsBalance.toFixed(2)} €
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Dieses Geld stammt aus übrig gebliebenen Wocheneinkäufen und steht der WG für gemeinsame Aktivitäten (z.B. Kino), neue Anschaffungen oder Reparaturen zur Verfügung.
                </p>
              </div>

              {/* Transactions Header & Toggle */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  Kassenbuch & Ausgaben ({budgetData.recentTransactions.length})
                </h3>

                {effectiveIsStaff && (
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(!showAddTransaction)}
                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ausgabe / Einzahlung buchen</span>
                  </button>
                )}
              </div>

              {/* Add Transaction Form (Expandable) */}
              {showAddTransaction && effectiveIsStaff && (
                <form
                  onSubmit={handleCreateTransaction}
                  className="bg-surface-elevated border border-emerald-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
                >
                  <div className="text-xs font-bold text-emerald-300">
                    Neue Sonderkassen-Buchung erfassen
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Art</label>
                      <select
                        value={transType}
                        onChange={(e) => setTransType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white"
                      >
                        <option value="EXPENSE">Ausgabe (-)</option>
                        <option value="DEPOSIT">Einzahlung (+)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Kategorie</label>
                      <select
                        value={transCategory}
                        onChange={(e) => setTransCategory(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white"
                      >
                        <option value="AKTIVITAET">Aktivität (Kino, Ausflug)</option>
                        <option value="SONDERANSCHAFFUNG">Sonderanschaffung</option>
                        <option value="REPARATUR">Reparatur</option>
                        <option value="SONSTIGES">Sonstiges</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Betrag (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={transAmount}
                        onChange={(e) => setTransAmount(e.target.value)}
                        placeholder="z.B. 25.00"
                        className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Verwendungszweck</label>
                      <input
                        type="text"
                        required
                        value={transPurpose}
                        onChange={(e) => setTransPurpose(e.target.value)}
                        placeholder="z.B. Popcorn Kinoabend, Neuer Sandwichtoaster"
                        className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Datum</label>
                      <input
                        type="date"
                        value={transDate}
                        onChange={(e) => setTransDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowAddTransaction(false)}
                      className="px-3 py-1.5 bg-surface-card text-slate-300 rounded-xl text-xs cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTrans}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      {isSubmittingTrans ? 'Speichern...' : 'Buchen'}
                    </button>
                  </div>
                </form>
              )}

              {/* Transactions List */}
              {budgetData.recentTransactions.length === 0 ? (
                <div className="p-6 bg-surface-elevated/40 border border-dashed border-surface-border rounded-2xl text-center text-xs text-slate-400">
                  Noch keine Sonderausgaben erfasst. Übrig gebliebenes Geld aus den Wocheneinkäufen wird hier automatisch gesammelt.
                </div>
              ) : (
                <div className="space-y-2">
                  {budgetData.recentTransactions.map((tx) => {
                    const isNegative = tx.amount < 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-surface-elevated/60 border border-surface-border rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isNegative
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                            }`}
                          >
                            {isNegative ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{tx.purpose}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span>{tx.category}</span>
                              <span>•</span>
                              <span className="font-mono">{tx.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isNegative ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isNegative ? '' : '+'}
                            {tx.amount.toFixed(2)} €
                          </span>

                          {effectiveIsStaff && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              title="Eintrag löschen"
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-surface-elevated/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-card hover:bg-surface-elevated text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
