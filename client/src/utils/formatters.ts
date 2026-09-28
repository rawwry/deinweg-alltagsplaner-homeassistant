/**
 * Deutsche Datums- und Uhrzeitformatierer
 * Garantiert striktes Format TT.MM.JJJJ (z. B. 15.09.2026)
 */

const WEEKDAYS = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

const SHORT_WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function parseDate(date: string | Date | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Vermeide UTC-Zeitzonenverschiebung bei YYYY-MM-DD
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return new Date(date);
}

/**
 * Formatiert ein Datum strikt als TT.MM.JJJJ (z. B. "15.09.2026")
 * Optional mit Wochentag (z. B. "Dienstag, 15.09.2026" oder "Di, 15.09.2026")
 */
export function formatGermanDate(
  date: string | Date | number | null | undefined,
  options?: { withWeekday?: boolean; shortWeekday?: boolean }
): string {
  if (!date) return '';
  const d = parseDate(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  if (options?.withWeekday) {
    const weekday = options.shortWeekday ? SHORT_WEEKDAYS[d.getDay()] : WEEKDAYS[d.getDay()];
    return `${weekday}, ${dateStr}`;
  }

  return dateStr;
}

/**
 * Formatiert Datum & Uhrzeit (z. B. "15.09.2026, 14:30 Uhr")
 */
export function formatGermanDateTime(
  date: string | Date | number | null | undefined,
  options?: { withWeekday?: boolean }
): string {
  if (!date) return '';
  const d = parseDate(date);
  if (isNaN(d.getTime())) return '';

  const datePart = formatGermanDate(d, options);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${datePart}, ${hours}:${minutes} Uhr`;
}

/**
 * Formatiert kurzes Datum für Kalender / Essensplan-Spalten (z. B. "15.09.")
 */
export function formatGermanDayMonth(date: string | Date | number | null | undefined): string {
  if (!date) return '';
  const d = parseDate(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.`;
}

/**
 * Berechnet ISO-Woche und ISO-Jahr für ein Datum
 */
export function getCurrentISOWeekAndYear(date: Date = new Date()): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * Ermittelt die Gesamtzahl der ISO-Kalenderwochen in einem Jahr (52 oder 53)
 */
export function getISOWeeksInYear(year: number): number {
  return getCurrentISOWeekAndYear(new Date(year, 11, 28)).week;
}

/**
 * Berechnet den Montag (Date-Objekt) einer gegebenen ISO-Kalenderwoche
 */
export function getMondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monWeek1 = new Date(jan4);
  monWeek1.setUTCDate(jan4.getUTCDate() - (day - 1) + (week - 1) * 7);
  return monWeek1;
}

/**
 * Berechnet das Datum als deutsches TT.MM.JJJJ für einen Wochentag (1 = Mo, 7 = So) einer ISO-Woche
 */
export function getDateForISOWeekDay(year: number, week: number, dayOfWeek: number): string {
  const monday = getMondayOfISOWeek(year, week);
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + (dayOfWeek - 1));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day}.${m}.${y}`;
}

