import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { formatGermanDate } from '../../utils/formatters.js';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Users,
  Settings,
  X,
  Plus,
  ChefHat,
} from 'lucide-react';
import { getChoreOutlineIcon } from '../hub/DashboardHub.js';

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

  // Filters: 'ALL' or 'MINE' (residents default to 'MINE')
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE'>(
    user?.role === 'BEWOHNER' ? 'MINE' : 'ALL'
  );

  const [mealPlan, setMealPlan] = useState<any>(null);

  const [personalDoneChores, setPersonalDoneChores] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`resident_chores_done_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user?.id) return;
    try {
      const storedChores = localStorage.getItem(`resident_chores_done_${user.id}`);
      if (storedChores) {
        setPersonalDoneChores(JSON.parse(storedChores));
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  const togglePersonalChore = (key: string) => {
    setPersonalDoneChores((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (user?.id) {
        try {
          localStorage.setItem(`resident_chores_done_${user.id}`, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  // Mobile selected day (1=Mo ... 7=So)
  const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(todayDayOfWeek);

  // Desktop day filter: 'ALL' or dayOfWeek (1..7)
  const [desktopDayFilter, setDesktopDayFilter] = useState<'ALL' | number>('ALL');

  // Assign Modal State (for Staff)
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    template: any;
    day: any;
    selectedResidentIds: string[];
  } | null>(null);

  const fetchWeekData = async () => {
    try {
      setIsLoading(true);
      const [wData, usersList, mPlan] = await Promise.all([
        api.chores.week(activeLocationId, year, weekNumber),
        api.users.list(activeLocationId).catch(() => []),
        api.food.mealplan(activeLocationId, year, weekNumber).catch(() => null),
      ]);
      setWeekData(wData);
      setMealPlan(mPlan);
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

  // Assign resident(s)
  const handleSaveAssignment = async (residentIds: string[]) => {
    if (!assignModal) return;
    try {
      await api.chores.assign({
        locationId: activeLocationId,
        templateId: assignModal.template.id,
        date: assignModal.day.date,
        year,
        weekNumber,
        dayOfWeek: assignModal.day.dayOfWeek,
        assignedResidentIds: residentIds,
      });
      setAssignModal(null);
      const refreshed = await api.chores.week(activeLocationId, year, weekNumber);
      setWeekData(refreshed);
    } catch (err) {
      console.error('Fehler beim Zuweisen der Aufgabe:', err);
    }
  };

  // Helper to render a single day's card
  const renderDayCard = (day: any, isSingleFocus: boolean = false, isLastSunday: boolean = false) => {
    const isToday =
      year === realCurrentYear &&
      weekNumber === realCurrentWeek &&
      day.dayOfWeek === todayDayOfWeek;

    const dayAssignments = (weekData?.assignments || []).filter(
      (a: any) => a.date === day.date
    );

    const dayMeal = mealPlan?.days?.find((d: any) => d.dayOfWeek === day.dayOfWeek);
    const isCookMe = Boolean(user?.id && dayMeal?.cookUserId === user.id);
    const chefDishTitle = dayMeal?.recipe?.title || dayMeal?.customDishTitle || 'Gemeinsames Abendessen';
    const chefTask = dayMeal?.cookUserId
      ? {
          id: `chefkoch_${day.date}`,
          title: `Kochtraining: ${chefDishTitle}`,
          description: 'Du bist heute für die Zubereitung des Gemeinschaftsessens zuständig.',
          icon: '👨‍🍳',
          isChefkoch: true,
          cookUserId: dayMeal.cookUserId,
          cookName: dayMeal.cookName,
          assignedResidents: [{ id: dayMeal.cookUserId, name: dayMeal.cookName }],
          isAllResidents: false,
        }
      : null;

    const totalDayTasks = (weekData?.templates?.length || 0) + (chefTask ? 1 : 0);

    const regularVisibleTemplates = (weekData?.templates || []).filter((tmpl: any) => {
      if (filterMode === 'MINE') {
        const assignment = dayAssignments.find((a: any) => a.templateId === tmpl.id);
        const isAll = assignment ? assignment.isAllResidents : tmpl.isAllResidents;
        const assignedRes: any[] = assignment
          ? (assignment.assignedResidents || [])
          : (tmpl.assignedResidents || []);
        if (isAll) return true;
        if (assignedRes.some((r: any) => r.id === user?.id)) return true;
        if (assignment?.residentId === user?.id) return true;
        return false;
      }
      return true;
    });

    const shouldShowChefTask = chefTask && (filterMode === 'ALL' || isCookMe);
    const visibleTasks = [
      ...(shouldShowChefTask ? [chefTask] : []),
      ...regularVisibleTemplates,
    ];

    return (
      <div
        key={day.dayOfWeek}
        className={`bento-card bg-surface-card rounded-[2.5rem] border p-5 sm:p-6 md:p-7 shadow-xl transition-all ${
          isToday
            ? 'border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-indigo-500/10'
            : 'border-surface-border'
        } ${isLastSunday && !isSingleFocus ? 'xl:col-span-2' : ''}`}
      >
        {/* Day Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-white font-display">
              {day.name}
            </h3>
            <span className="text-xs text-slate-400 font-mono font-medium">
              {formatGermanDate(day.date)}
            </span>
            {isToday && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Heute
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium px-3 py-1 rounded-full bg-surface-elevated border border-surface-border">
              {totalDayTasks} {totalDayTasks === 1 ? 'Aufgabe' : 'Aufgaben'}
            </span>

            {isSingleFocus && (
              <button
                type="button"
                onClick={() => setDesktopDayFilter('ALL')}
                className="hidden lg:inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-white/5 border border-surface-border transition-colors cursor-pointer ml-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Woche zeigen</span>
              </button>
            )}
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3 mt-4">
          {visibleTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic bg-surface-elevated/20 rounded-2xl border border-surface-border/40">
              {filterMode === 'MINE'
                ? 'Keine Aufgaben für dich an diesem Tag eingeteilt.'
                : 'Keine Aufgaben für diesen Tag vorhanden.'}
            </div>
          ) : (
            visibleTasks.map((tmpl: any) => {
              const choreKey = `${day.date}_${tmpl.id}`;
              const isPersonalDone = personalDoneChores.includes(choreKey);

              if (tmpl.isChefkoch) {
                return (
                  <div
                    key={tmpl.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col gap-3 ${
                      isPersonalDone
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-surface-elevated/70 hover:bg-surface-elevated border-rose-500/30 shadow-xs'
                    }`}
                  >
                    {/* Top Tier: Icon + Title & Kochplan badge + Personal Check-off Top-Right */}
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-xs">
                          {getChoreOutlineIcon(tmpl, 'w-5 h-5')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-sm font-bold tracking-tight block truncate ${
                              isPersonalDone ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {tmpl.title}
                          </span>
                        </div>
                      </div>

                      {user?.role === 'BEWOHNER' && isCookMe && (
                        <button
                          type="button"
                          onClick={() => togglePersonalChore(choreKey)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                            isPersonalDone
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-surface-card hover:bg-surface-elevated border-surface-border text-slate-300 hover:text-white'
                          }`}
                          title={isPersonalDone ? 'Als unerledigt markieren' : 'Als erledigt abhaken'}
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                              isPersonalDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-500 bg-transparent'
                            }`}
                          >
                            {isPersonalDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{isPersonalDone ? 'Erledigt' : 'Abhaken'}</span>
                        </button>
                      )}
                    </div>

                    {/* Middle Tier: 100% Full Width Description */}
                    {tmpl.description && (
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {tmpl.description}
                      </p>
                    )}

                    {/* Bottom Tier: Resident Assignment Footer */}
                    <div className="pt-2.5 border-t border-surface-border/50 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border bg-rose-500/10 border-rose-500/25 text-rose-300 text-xs font-semibold">
                        <ChefHat className="w-3.5 h-3.5 text-rose-400 stroke-[2]" />
                        <span>{tmpl.cookName}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              const assignment = dayAssignments.find(
                (a: any) => a.templateId === tmpl.id
              );
              const isAllResidents = assignment ? !!assignment.isAllResidents : !!tmpl.isAllResidents;
              const assignedResidents: any[] = assignment
                ? (assignment.assignedResidents || [])
                : (tmpl.assignedResidents || []);
              const isAssigned = isAllResidents || assignedResidents.length > 0 || !!assignment?.resident;
              const isMyTask =
                isAllResidents ||
                assignedResidents.some((r: any) => r.id === user?.id) ||
                assignment?.residentId === user?.id;

              const modalInitialIds = assignment
                ? (assignment.isAllResidents ? ['ALL'] : (assignment.assignedResidentIdsList || (assignment.residentId ? [assignment.residentId] : [])))
                : (tmpl.isAllResidents ? ['ALL'] : (tmpl.assignedResidentIdsList || []));

              return (
                <div
                  key={tmpl.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col gap-3 ${
                    isPersonalDone
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : isAssigned
                      ? 'bg-surface-elevated/70 hover:bg-surface-elevated border-surface-border hover:border-indigo-500/40 shadow-xs'
                      : 'bg-surface-elevated/30 border-surface-border/60 border-dashed hover:border-surface-border'
                  }`}
                >
                  {/* Top Tier: Icon + Title + Personal Check-off Top-Right */}
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center shrink-0 shadow-xs">
                        {getChoreOutlineIcon(tmpl, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-bold tracking-tight block truncate ${
                            isPersonalDone ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {tmpl.title}
                        </span>
                      </div>
                    </div>

                    {/* Personal check-off button for residents */}
                    {user?.role === 'BEWOHNER' && isMyTask && (
                      <button
                        type="button"
                        onClick={() => togglePersonalChore(choreKey)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          isPersonalDone
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-surface-card hover:bg-surface-elevated border-surface-border text-slate-300 hover:text-white'
                        }`}
                        title={isPersonalDone ? 'Als unerledigt markieren' : 'Als erledigt abhaken'}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                            isPersonalDone
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-500 bg-transparent'
                          }`}
                        >
                          {isPersonalDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{isPersonalDone ? 'Erledigt' : 'Abhaken'}</span>
                      </button>
                    )}
                  </div>

                  {/* Middle Tier: 100% Full Width Description */}
                  {tmpl.description && (
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {tmpl.description}
                    </p>
                  )}

                  {/* Bottom Tier: Resident Assignment Footer */}
                  <div className="pt-2.5 border-t border-surface-border/50 flex items-center justify-between">
                    {/* Resident Pill */}
                    {isAllResidents ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isStaff) {
                            setAssignModal({
                              isOpen: true,
                              template: tmpl,
                              day,
                              selectedResidentIds: ['ALL'],
                            });
                          }
                        }}
                        disabled={!isStaff}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isStaff
                            ? 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/35 text-indigo-300 hover:text-white cursor-pointer shadow-xs group'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 cursor-default'
                        }`}
                        title={isStaff ? 'Einteilung bearbeiten' : undefined}
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Alle Bewohner</span>
                        {isStaff && (
                          <span className="text-[10px] text-indigo-400/70 group-hover:text-white ml-0.5">
                            ✎
                          </span>
                        )}
                      </button>
                    ) : assignedResidents.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isStaff) {
                            setAssignModal({
                              isOpen: true,
                              template: tmpl,
                              day,
                              selectedResidentIds: assignedResidents.map((r: any) => r.id),
                            });
                          }
                        }}
                        disabled={!isStaff}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isStaff
                            ? 'bg-surface-card hover:bg-indigo-600/10 border-surface-border hover:border-indigo-500/40 text-slate-200 hover:text-white cursor-pointer shadow-xs group'
                            : 'bg-surface-card border-surface-border text-slate-300 cursor-default'
                        }`}
                        title={isStaff ? 'Einteilung ändern oder aufheben' : undefined}
                      >
                        <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                          {assignedResidents.slice(0, 3).map((r: any) =>
                            r.avatarUrl ? (
                              <img
                                key={r.id}
                                src={r.avatarUrl}
                                alt={r.name}
                                className="inline-block h-5 w-5 rounded-full ring-1 ring-surface-card object-cover"
                              />
                            ) : (
                              <div
                                key={r.id}
                                className="inline-flex h-5 w-5 rounded-full ring-1 ring-surface-card items-center justify-center text-[9px] text-white font-bold"
                                style={{ backgroundColor: r.avatarColor || '#6366f1' }}
                              >
                                {r.name.charAt(0).toUpperCase()}
                              </div>
                            )
                          )}
                        </div>
                        <span className="truncate max-w-[160px]">
                          {assignedResidents.map((r: any) => r.name).join(', ')}
                        </span>
                        {isStaff && (
                          <span className="text-[10px] text-slate-500 group-hover:text-indigo-300 ml-0.5">
                            ✎
                          </span>
                        )}
                      </button>
                    ) : assignedResidents.length === 1 ? (
                      (() => {
                        const res = assignedResidents[0];
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (isStaff) {
                                setAssignModal({
                                  isOpen: true,
                                  template: tmpl,
                                  day,
                                  selectedResidentIds: [res.id],
                                });
                              }
                            }}
                            disabled={!isStaff}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              isStaff
                                ? 'bg-surface-card hover:bg-indigo-600/10 border-surface-border hover:border-indigo-500/40 text-slate-200 hover:text-white cursor-pointer shadow-xs group'
                                : 'bg-surface-card border-surface-border text-slate-300 cursor-default'
                            }`}
                            title={isStaff ? 'Einteilung ändern oder aufheben' : undefined}
                          >
                            {res.avatarUrl ? (
                              <img
                                src={res.avatarUrl}
                                alt={res.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                              />
                            ) : (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                                style={{
                                  backgroundColor: res.avatarColor || '#6366f1',
                                }}
                              >
                                {res.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate max-w-[160px]">
                              {res.name}
                            </span>
                            {isStaff && (
                              <span className="text-[10px] text-slate-500 group-hover:text-indigo-300 ml-0.5">
                                ✎
                              </span>
                            )}
                          </button>
                        );
                      })()
                    ) : isStaff ? (
                      <button
                        type="button"
                        onClick={() =>
                          setAssignModal({
                            isOpen: true,
                            template: tmpl,
                            day,
                            selectedResidentIds: modalInitialIds,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-500/15 hover:border-indigo-500/60 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Bewohner zuweisen</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic px-2">
                        Nicht eingeteilt
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

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
            Aufgabenübersicht
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Wöchentliche Einteilung und Zuweisungen der Haushalts- & Alltagsaufgaben für die gesamte WG.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

      {/* Desktop Weekday Quick-Filter Bar (visible on >= lg screens) */}
      <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setDesktopDayFilter('ALL')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
            desktopDayFilter === 'ALL'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'bg-surface-card border-surface-border text-slate-300 hover:bg-surface-elevated hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Ganze Woche (7 Tage)</span>
        </button>

        {(weekData?.days || []).map((day: any) => {
          const isToday =
            year === realCurrentYear &&
            weekNumber === realCurrentWeek &&
            day.dayOfWeek === todayDayOfWeek;
          const isSelected = desktopDayFilter === day.dayOfWeek;

          return (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => setDesktopDayFilter(day.dayOfWeek)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : isToday
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25'
                  : 'bg-surface-card border-surface-border text-slate-300 hover:bg-surface-elevated hover:text-white'
              }`}
            >
              <span>{day.name}</span>
              <span className="font-mono text-[11px] opacity-75">
                {day.date ? day.date.slice(8, 10) + '.' + day.date.slice(5, 7) : ''}
              </span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Day Tabs (visible only on < lg screens) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {(weekData?.days || []).map((day: any) => {
          const isToday =
            year === realCurrentYear &&
            weekNumber === realCurrentWeek &&
            day.dayOfWeek === todayDayOfWeek;
          const isSelected = selectedMobileDay === day.dayOfWeek;

          return (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => setSelectedMobileDay(day.dayOfWeek)}
              className={`flex-1 min-w-[75px] py-2.5 px-2 rounded-2xl border flex flex-col items-center text-center transition-all cursor-pointer relative ${
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
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
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
            Betreuer können in den Einstellungen Vorlagen wie Zimmerreinigung, Küche & Abwasch oder Mülldienst anlegen, um diesen Aufgabenplan zu befüllen.
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
          {/* Desktop View (>= lg) */}
          <div className="hidden lg:block">
            {desktopDayFilter === 'ALL' ? (
              /* Spacious 2-Column Grid for all 7 Days */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {weekData.days.map((day: any, idx: number) =>
                  renderDayCard(day, false, idx === 6)
                )}
              </div>
            ) : (
              /* Single-Day Focused View on Desktop */
              <div className="max-w-4xl mx-auto space-y-4">
                {(() => {
                  const targetDay = weekData.days.find(
                    (d: any) => d.dayOfWeek === desktopDayFilter
                  );
                  return targetDay ? renderDayCard(targetDay, true, false) : null;
                })()}
              </div>
            )}
          </div>

          {/* Mobile Single-Day View (< lg) */}
          <div className="lg:hidden space-y-3">
            {(() => {
              const currentDay = (weekData?.days || []).find(
                (d: any) => d.dayOfWeek === selectedMobileDay
              );
              return currentDay ? renderDayCard(currentDay, false, false) : null;
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
                  Aufgabe einteilen
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

            {/* Quick Option: Alle Bewohner */}
            <button
              type="button"
              onClick={() => {
                const isAll = assignModal.selectedResidentIds.includes('ALL');
                setAssignModal((prev) =>
                  prev ? { ...prev, selectedResidentIds: isAll ? [] : ['ALL'] } : null
                );
              }}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                assignModal.selectedResidentIds.includes('ALL')
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-surface-elevated/60 border-surface-border hover:border-indigo-500/40 hover:bg-surface-elevated text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Allen Bewohnern zuweisen</span>
                  <span className="text-[11px] text-slate-400">z. B. eigene Zimmerreinigung</span>
                </div>
              </div>
              {assignModal.selectedResidentIds.includes('ALL') && (
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
            </button>

            {/* Resident checkboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Oder bestimmte Bewohner auswählen:
                </span>
                {assignModal.selectedResidentIds.length > 0 && !assignModal.selectedResidentIds.includes('ALL') && (
                  <span className="text-[11px] text-indigo-400 font-mono font-semibold">
                    {assignModal.selectedResidentIds.length} ausgewählt
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {residents.map((res: any) => {
                  const isSelected =
                    assignModal.selectedResidentIds.includes('ALL') ||
                    assignModal.selectedResidentIds.includes(res.id);

                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        setAssignModal((prev) => {
                          if (!prev) return null;
                          let newIds = prev.selectedResidentIds.includes('ALL')
                            ? []
                            : [...prev.selectedResidentIds];

                          if (newIds.includes(res.id)) {
                            newIds = newIds.filter((id) => id !== res.id);
                          } else {
                            newIds.push(res.id);
                          }
                          return { ...prev, selectedResidentIds: newIds };
                        });
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/25 border-indigo-500/70 text-white'
                          : 'bg-surface-elevated/40 border-surface-border hover:bg-surface-elevated text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {res.avatarUrl ? (
                          <img
                            src={res.avatarUrl}
                            alt={res.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                            style={{
                              backgroundColor: res.avatarColor || '#6366f1',
                            }}
                          >
                            {res.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium truncate">{res.name}</span>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-600 bg-surface-card'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSaveAssignment([])}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                title="Zuweisung für diesen Tag aufheben"
              >
                Keine Zuweisung
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-card border border-surface-border text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAssignment(assignModal.selectedResidentIds)}
                  className="btn-theme-gradient px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
