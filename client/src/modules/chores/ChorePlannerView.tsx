import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { formatGermanDate } from '../../utils/formatters.js';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Check,
  User,
  Users,
  Sparkles,
  Settings,
  Clock,
  Filter,
  ArrowRight,
  ListTodo,
  X,
  Plus,
} from 'lucide-react';

interface ChorePlannerViewProps {
  setCurrentTab?: (tab: string) => void;
}

export const ChorePlannerView: React.FC<ChorePlannerViewProps> = ({ setCurrentTab }) => {
  const { user, activeLocation, activeLocationId } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const now = new Date();
  // Get current ISO calendar week
  const dateCopy = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = dateCopy.getUTCDay() || 7;
  dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
  const realCurrentWeek = Math.ceil(((dateCopy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const realCurrentYear = dateCopy.getUTCFullYear();

  const [year, setYear] = useState<number>(realCurrentYear);
  const [weekNumber, setWeekNumber] = useState<number>(realCurrentWeek);
  const [weekData, setWeekData] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters: 'ALL' or 'MINE'
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE'>(
    user?.role === 'BEWOHNER' ? 'ALL' : 'ALL'
  );

  // Mobile selected day (1=Mo ... 7=So)
  const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(todayDayOfWeek);

  // Assign Modal State (for Staff)
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    template: any;
    day: any;
    currentResidentId: string | null;
  } | null>(null);

  const fetchWeekData = async () => {
    try {
      setIsLoading(true);
      const [wData, usersList] = await Promise.all([
        api.chores.week(activeLocationId, year, weekNumber),
        api.users.list(activeLocationId).catch(() => []),
      ]);
      setWeekData(wData);
      setResidents((usersList || []).filter((u: any) => u.role === 'BEWOHNER'));
    } catch (err) {
      console.error('Fehler beim Laden des Aufgabenplans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekData();
  }, [activeLocationId, year, weekNumber]);

  // Week navigation helpers
  const handlePrevWeek = () => {
    if (weekNumber <= 1) {
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
    setYear(realCurrentYear);
    setWeekNumber(realCurrentWeek);
  };

  // Toggle completion
  const handleToggleCompletion = async (
    templateId: string,
    day: any,
    existingAssignment: any
  ) => {
    try {
      await api.chores.toggleComplete({
        assignmentId: existingAssignment ? existingAssignment.id : undefined,
        templateId,
        date: day.date,
        year,
        weekNumber,
        dayOfWeek: day.dayOfWeek,
      });
      // Refresh without full loading state
      const refreshed = await api.chores.week(activeLocationId, year, weekNumber);
      setWeekData(refreshed);
    } catch (err) {
      console.error('Fehler beim Status-Wechsel:', err);
    }
  };

  // Assign resident
  const handleSaveAssignment = async (residentId: string | null) => {
    if (!assignModal) return;
    try {
      await api.chores.assign({
        locationId: activeLocationId,
        templateId: assignModal.template.id,
        date: assignModal.day.date,
        year,
        weekNumber,
        dayOfWeek: assignModal.day.dayOfWeek,
        residentId,
      });
      setAssignModal(null);
      const refreshed = await api.chores.week(activeLocationId, year, weekNumber);
      setWeekData(refreshed);
    } catch (err) {
      console.error('Fehler beim Zuweisen der Aufgabe:', err);
    }
  };

  // Compute weekly statistics
  const totalTasksPossible =
    (weekData?.templates?.length || 0) * (weekData?.days?.length || 0);
  const completedAssignmentsCount =
    (weekData?.assignments || []).filter((a: any) => a.isCompleted).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Header & Controls */}
      <div className="bg-surface-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1.5 font-sans">
            <span>📋 Aufgabenplan</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">WG {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            Haushalts- & Alltagsorganisation
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Verteile tägliche Aufgaben wie Zimmerreinigung, Küche & Abwasch und hake erledigte Dienste einfach digital ab.
          </p>
        </div>

        {/* Action buttons & Stats */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {totalTasksPossible > 0 && (
            <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>
                {completedAssignmentsCount} / {totalTasksPossible} erledigt
              </span>
            </div>
          )}

          {isStaff && setCurrentTab && (
            <button
              type="button"
              onClick={() => setCurrentTab('admin')}
              className="px-3.5 py-2 rounded-2xl bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              title="Aufgaben-Vorlagen in den Einstellungen verwalten"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Vorlagen bearbeiten</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Selector & Filters Bar */}
      <div className="bg-surface-card rounded-3xl p-4 sm:p-5 border border-surface-border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* KW Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={handlePrevWeek}
            aria-label="Vorherige Woche"
            className="p-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 text-slate-300 hover:text-white border border-surface-border transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Kalenderwoche
            </span>
            <span className="text-base sm:text-lg font-bold text-white font-display">
              KW {weekNumber} · {year}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            aria-label="Nächste Woche"
            className="p-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 text-slate-300 hover:text-white border border-surface-border transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {(year !== realCurrentYear || weekNumber !== realCurrentWeek) && (
            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="ml-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer border border-indigo-500/30"
            >
              Heute
            </button>
          )}
        </div>

        {/* Filter Toggle (All vs Mine) */}
        <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-2xl border border-surface-border self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle Aufgaben
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('MINE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'MINE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Nur meine Aufgaben</span>
          </button>
        </div>
      </div>

      {/* Mobile Day Tabs (visible only on < lg screens) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {(weekData?.days || []).map((day: any) => {
          const isToday =
            year === realCurrentYear &&
            weekNumber === realCurrentWeek &&
            day.dayOfWeek === todayDayOfWeek;
          const isSelected = selectedMobileDay === day.dayOfWeek;

          // Day assignments
          const dayAssignments = (weekData?.assignments || []).filter(
            (a: any) => a.date === day.date
          );
          const dayDoneCount = dayAssignments.filter((a: any) => a.isCompleted).length;

          return (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => setSelectedMobileDay(day.dayOfWeek)}
              className={`flex-1 min-w-[75px] py-2 px-2 rounded-2xl border flex flex-col items-center text-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 font-bold'
                  : isToday
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-surface-card border-surface-border text-slate-300 hover:bg-surface-elevated'
              }`}
            >
              <span className="text-[11px] font-semibold">{day.name.slice(0, 2)}</span>
              <span className="text-[10px] opacity-75 font-mono">
                {day.date ? day.date.slice(8, 10) + '.' + day.date.slice(5, 7) : ''}
              </span>
              {dayDoneCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="bg-surface-card rounded-3xl p-12 text-center text-slate-400 font-sans border border-surface-border">
          Aufgabenplan wird geladen...
        </div>
      ) : !weekData?.templates || weekData.templates.length === 0 ? (
        <div className="bg-surface-card rounded-[2.5rem] p-12 text-center border border-surface-border shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto">
            🧹
          </div>
          <h2 className="text-xl font-bold text-white font-sans">
            Noch keine Aufgaben-Vorlagen angelegt
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Betreuer können in den Einstellungen Vorlagen wie Zimmerreinigung, Küche & Abwasch oder Mülldienst anlegen, um diesen Wochenplan zu befüllen.
          </p>
          {isStaff && setCurrentTab && (
            <button
              type="button"
              onClick={() => setCurrentTab('admin')}
              className="btn-theme-gradient px-5 py-2.5 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Vorlagen jetzt anlegen</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop 7-Column Board (hidden on mobile) */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-3.5 items-start">
            {weekData.days.map((day: any) => {
              const isToday =
                year === realCurrentYear &&
                weekNumber === realCurrentWeek &&
                day.dayOfWeek === todayDayOfWeek;

              return (
                <div
                  key={day.dayOfWeek}
                  className={`bg-surface-card/90 rounded-3xl border flex flex-col min-h-[500px] overflow-hidden transition-all ${
                    isToday
                      ? 'border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
                      : 'border-surface-border'
                  }`}
                >
                  {/* Day Column Header */}
                  <div
                    className={`p-3.5 border-b border-surface-border text-center flex flex-col gap-0.5 ${
                      isToday ? 'bg-indigo-500/15' : 'bg-surface-elevated/40'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs font-bold text-white font-display">
                        {day.name}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500 text-white uppercase font-sans">
                          Heute
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {formatGermanDate(day.date)}
                    </span>
                  </div>

                  {/* Tasks List for Day */}
                  <div className="p-2.5 space-y-2.5 flex-1">
                    {weekData.templates.map((tmpl: any) => {
                      const assignment = (weekData.assignments || []).find(
                        (a: any) => a.templateId === tmpl.id && a.date === day.date
                      );
                      const isAssigned = !!assignment?.resident;
                      const isCompleted = !!assignment?.isCompleted;

                      // Filter check if filterMode === 'MINE'
                      if (
                        filterMode === 'MINE' &&
                        assignment?.residentId !== user?.id
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={tmpl.id}
                          className={`rounded-2xl border p-3 flex flex-col justify-between gap-2.5 transition-all text-left relative group ${
                            isCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                              : isAssigned
                              ? 'bg-surface-elevated/80 border-surface-border hover:border-indigo-500/40'
                              : 'bg-surface-elevated/30 border-surface-border/50 border-dashed hover:border-surface-border'
                          }`}
                        >
                          {/* Task Header & Completion Checkbox */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="text-lg shrink-0 select-none">
                                {tmpl.icon || '🧹'}
                              </span>
                              <div className="min-w-0">
                                <span
                                  className={`text-xs font-semibold block leading-tight truncate ${
                                    isCompleted ? 'line-through text-slate-400' : 'text-white'
                                  }`}
                                  title={tmpl.title}
                                >
                                  {tmpl.title}
                                </span>
                                {tmpl.description && (
                                  <span
                                    className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-snug"
                                    title={tmpl.description}
                                  >
                                    {tmpl.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Complete Toggle Checkbox */}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleCompletion(tmpl.id, day, assignment)
                              }
                              title={
                                isCompleted
                                  ? 'Als offen markieren'
                                  : 'Als erledigt abhaken'
                              }
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'border border-slate-600 hover:border-indigo-400 text-transparent hover:text-slate-400'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>

                          {/* Resident Assigned Badge / Selector Button */}
                          <div className="pt-1 border-t border-white/5 flex items-center justify-between gap-1">
                            {assignment?.resident ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isStaff) {
                                    setAssignModal({
                                      isOpen: true,
                                      template: tmpl,
                                      day,
                                      currentResidentId: assignment.residentId,
                                    });
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-semibold transition-all truncate max-w-full ${
                                  isStaff
                                    ? 'hover:bg-white/10 cursor-pointer text-indigo-300'
                                    : 'cursor-default text-slate-300'
                                }`}
                              >
                                {assignment.resident.avatarUrl ? (
                                  <img
                                    src={assignment.resident.avatarUrl}
                                    alt={assignment.resident.name}
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0"
                                    style={{
                                      backgroundColor:
                                        assignment.resident.avatarColor || '#6366f1',
                                    }}
                                  >
                                    {assignment.resident.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate">{assignment.resident.name}</span>
                              </button>
                            ) : isStaff ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setAssignModal({
                                    isOpen: true,
                                    template: tmpl,
                                    day,
                                    currentResidentId: null,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-300 px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <User className="w-3 h-3" />
                                <span>Zuweisen</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 italic px-1">
                                Nicht eingeteilt
                              </span>
                            )}

                            {isCompleted && (
                              <span className="text-[9px] font-bold text-emerald-400 font-mono shrink-0">
                                Erledigt
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Single-Day View (visible only on < lg screens) */}
          <div className="lg:hidden space-y-3">
            {(() => {
              const currentDay = (weekData?.days || []).find(
                (d: any) => d.dayOfWeek === selectedMobileDay
              );
              if (!currentDay) return null;

              const isToday =
                year === realCurrentYear &&
                weekNumber === realCurrentWeek &&
                currentDay.dayOfWeek === todayDayOfWeek;

              return (
                <div className="bg-surface-card rounded-3xl border border-surface-border p-4 sm:p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white font-display">
                        {currentDay.name}
                      </h2>
                      {isToday && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white uppercase font-sans">
                          Heute
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatGermanDate(currentDay.date)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {weekData.templates.map((tmpl: any) => {
                      const assignment = (weekData.assignments || []).find(
                        (a: any) =>
                          a.templateId === tmpl.id && a.date === currentDay.date
                      );
                      const isCompleted = !!assignment?.isCompleted;

                      if (
                        filterMode === 'MINE' &&
                        assignment?.residentId !== user?.id
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={tmpl.id}
                          className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                            isCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                              : 'bg-surface-elevated/70 border-surface-border text-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="text-2xl shrink-0">
                                {tmpl.icon || '🧹'}
                              </span>
                              <div>
                                <h4
                                  className={`text-sm font-semibold ${
                                    isCompleted ? 'line-through text-slate-400' : 'text-white'
                                  }`}
                                >
                                  {tmpl.title}
                                </h4>
                                {tmpl.description && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {tmpl.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleCompletion(tmpl.id, currentDay, assignment)
                              }
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                                  : 'border-2 border-slate-600 hover:border-indigo-400 text-slate-400'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            {assignment?.resident ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isStaff) {
                                    setAssignModal({
                                      isOpen: true,
                                      template: tmpl,
                                      day: currentDay,
                                      currentResidentId: assignment.residentId,
                                    });
                                  }
                                }}
                                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                                  isStaff
                                    ? 'hover:bg-white/10 cursor-pointer text-indigo-300'
                                    : 'cursor-default text-slate-300'
                                }`}
                              >
                                {assignment.resident.avatarUrl ? (
                                  <img
                                    src={assignment.resident.avatarUrl}
                                    alt={assignment.resident.name}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                    style={{
                                      backgroundColor:
                                        assignment.resident.avatarColor || '#6366f1',
                                    }}
                                  >
                                    {assignment.resident.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span>{assignment.resident.name}</span>
                              </button>
                            ) : isStaff ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setAssignModal({
                                    isOpen: true,
                                    template: tmpl,
                                    day: currentDay,
                                    currentResidentId: null,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>Bewohner zuweisen</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 italic">
                                Niemand eingeteilt
                              </span>
                            )}

                            {isCompleted && (
                              <span className="text-xs font-bold text-emerald-400 font-mono">
                                Erledigt ✅
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Assignment Modal (Staff Only) */}
      {assignModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignModal(null);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-surface-card rounded-[2rem] max-w-md w-full border border-surface-border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block font-mono">
                  Aufgabe zuweisen
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{assignModal.template.icon || '🧹'}</span>
                  <span>{assignModal.template.title}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {assignModal.day.name}, {formatGermanDate(assignModal.day.date)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resident selection list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleSaveAssignment(null)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  !assignModal.currentResidentId
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                    : 'bg-surface-elevated/40 border-surface-border hover:bg-surface-elevated text-slate-400'
                }`}
              >
                <span className="text-xs font-semibold">Keine Zuweisung (Freilassen)</span>
                {!assignModal.currentResidentId && (
                  <Check className="w-4 h-4 text-rose-300" />
                )}
              </button>

              {residents.map((res: any) => {
                const isSelected = assignModal.currentResidentId === res.id;
                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSaveAssignment(res.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                        : 'bg-surface-elevated/60 border-surface-border hover:border-indigo-500/40 hover:bg-surface-elevated text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {res.avatarUrl ? (
                        <img
                          src={res.avatarUrl}
                          alt={res.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0"
                          style={{
                            backgroundColor: res.avatarColor || '#6366f1',
                          }}
                        >
                          {res.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold truncate">{res.name}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-card border border-surface-border text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
