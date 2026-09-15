import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Coins,
  FileText,
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
  const [budgetData, setBudgetData] = useState<LocationBudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Caregiver receipt form state
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
      const data = await api.food.budget(locationId, year, weekNumber);
      setBudgetData(data);
      setActualSpentInput(data.actualSpent !== null && data.actualSpent !== undefined ? String(data.actualSpent) : '');
      setReceiptNoteInput(data.receiptNote || '');
      setIsConfirmedInput(data.isConfirmed || false);
    } catch (err) {
      console.error('Fehler beim Laden der Budgetdaten:', err);
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
      await api.food.saveReceipt({
        locationId,
        year,
        weekNumber,
        actualSpent: actualSpentInput !== '' ? parseFloat(actualSpentInput.replace(',', '.')) : null,
        receiptNote: receiptNoteInput.trim(),
        isConfirmed: isConfirmedInput,
      });
      await fetchBudget();
      onBudgetUpdated();
    } catch (err: any) {
      alert(`Fehler beim Speichern des Kassenbons: ${err.message || err}`);
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
    if (!window.confirm('Möchtest du diese Sonderkassen-Buchung wirklich löschen?')) return;
    try {
      await api.food.deleteSavingsTransaction(id);
      await fetchBudget();
      onBudgetUpdated();
    } catch (err: any) {
      alert(`Fehler beim Löschen: ${err.message || err}`);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-sm">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                <span>WG-Budget & Sonderkasse</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-elevated text-slate-300 font-mono">
                  KW {weekNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Standort {locationName} • Wöchentlicher Einkauf & Gemeinschafts-Rücklagen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading || !budgetData ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent mb-2" />
              <div>Lade Budget- und Sonderkassendaten...</div>
            </div>
          ) : (
            <>
              {/* Highlight Overview Bento Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weekly Budget Status */}
                <div className="bg-surface-elevated/80 border border-surface-border rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display font-semibold text-slate-400 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Einkauf KW {weekNumber}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        budgetData.isConfirmed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {budgetData.isConfirmed ? 'Abgerechnet' : 'In Planung'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold font-display text-white font-mono">
                        {budgetData.remainingBudget.toFixed(2)} €
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Verbleibend vom Budget ({budgetData.weeklyBudget.toFixed(2)} €)
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tatsächlich ausgegeben:</span>
                      <span className="font-mono font-semibold text-white">
                        {budgetData.actualSpent !== null && budgetData.actualSpent !== undefined
                          ? `${budgetData.actualSpent.toFixed(2)} € (Kassenbon)`
                          : `ca. ${budgetData.estimatedShoppingCost.toFixed(2)} € (Schätzung)`}
                      </span>
                    </div>
                    {budgetData.receiptNote && (
                      <div className="text-slate-400 italic truncate">
                        Notiz: {budgetData.receiptNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* WG Sonderkasse Pot Balance */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-surface-elevated/90 to-surface-card border border-emerald-500/30 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display font-semibold text-emerald-300 flex items-center gap-1.5">
                      <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WG-Sonderkasse (Rücklagen)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                      Verwahrt
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold font-display text-emerald-400 font-mono">
                        {budgetData.totalSavingsBalance.toFixed(2)} €
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Für Sonderanschaffungen & Aktivitäten
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aus Wochen-Überschüssen:</span>
                      <span className="font-mono text-emerald-300">
                        +{budgetData.confirmedSurplusTotal.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ausgaben & Buchungen:</span>
                      <span className="font-mono text-slate-300">
                        {budgetData.extraTransactionsTotal >= 0 ? '+' : ''}
                        {budgetData.extraTransactionsTotal.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caregiver Form: Record Receipt for Current Week */}
              {isStaff && (
                <form
                  onSubmit={handleSaveReceipt}
                  className="bg-surface-elevated/50 border border-surface-border rounded-2xl p-4.5 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kassenbon erfassen (KW {weekNumber})</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Nur für Betreuer</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tatsächlicher Betrag laut Bon (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={actualSpentInput}
                        onChange={(e) => setActualSpentInput(e.target.value)}
                        placeholder={budgetData.estimatedShoppingCost.toFixed(2)}
                        className="w-full px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Notiz zum Kassenbon
                      </label>
                      <input
                        type="text"
                        value={receiptNoteInput}
                        onChange={(e) => setReceiptNoteInput(e.target.value)}
                        placeholder="z.B. Netto Marken-Discount, Pfand verrechnet"
                        className="w-full px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isConfirmedInput}
                        onChange={(e) => setIsConfirmedInput(e.target.checked)}
                        className="w-4 h-4 rounded border-surface-border text-emerald-500 focus:ring-emerald-500/40 bg-surface-card"
                      />
                      <span className="text-xs text-slate-300">
                        Woche als abgerechnet markieren (Überschuss wird in Sonderkasse übernommen)
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSavingReceipt}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingReceipt ? 'Speichern...' : 'Kassenbon sichern'}
                    </button>
                  </div>
                </form>
              )}

              {/* Transactions History / Sonderkasse Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Transparente Sonderkassen-Buchungen</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      ({budgetData.recentTransactions.length} Einträge)
                    </span>
                  </div>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => setShowAddTransaction(!showAddTransaction)}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buchung erfassen</span>
                    </button>
                  )}
                </div>

                {/* Add Transaction Inline Form */}
                {showAddTransaction && isStaff && (
                  <form
                    onSubmit={handleCreateTransaction}
                    className="bg-surface-elevated border border-emerald-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
                  >
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Neue Buchung für die WG-Sonderkasse</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Art</label>
                        <select
                          value={transType}
                          onChange={(e) => setTransType(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white"
                        >
                          <option value="EXPENSE">Ausgabe / Entnahme (-)</option>
                          <option value="DEPOSIT">Einzahlung / Erstattung (+)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Kategorie</label>
                        <select
                          value={transCategory}
                          onChange={(e) => setTransCategory(e.target.value)}
                          className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white"
                        >
                          <option value="AKTIVITAET">Aktivität (z.B. Kino, Ausflug)</option>
                          <option value="SONDERANSCHAFFUNG">Sonderanschaffung (Geräte, Deko)</option>
                          <option value="REPARATUR">Reparatur / Ersatzteil</option>
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
                          placeholder="z.B. 35.00"
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
                          placeholder="z.B. Popcorn & Tickets Kinoabend, Neuer Sandwichtoaster"
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

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setShowAddTransaction(false)}
                        className="px-3 py-1.5 bg-surface-card text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingTrans}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        {isSubmittingTrans ? 'Speichern...' : 'Buchung eintragen'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Ledger entries list */}
                {budgetData.recentTransactions.length === 0 ? (
                  <div className="p-6 bg-surface-elevated/40 border border-dashed border-surface-border rounded-2xl text-center text-xs text-slate-400">
                    Bislang wurden keine Sonderausgaben oder Einzahlungen verbucht. Übrig gebliebene Beträge der Einkäufe fließen automatisch hier ein.
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
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
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
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>{tx.category}</span>
                                <span>•</span>
                                <span className="font-mono">{tx.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isNegative ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {isNegative ? '' : '+'}
                              {tx.amount.toFixed(2)} €
                            </span>

                            {isStaff && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                title="Buchung löschen"
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
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-surface-elevated/40 flex justify-between items-center text-xs text-slate-400">
          <span>WG-Kasse Transparenzbericht</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-card hover:bg-surface-elevated text-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
