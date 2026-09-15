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
