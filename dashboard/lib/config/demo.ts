import { differenceInDays, parseISO } from 'date-fns';

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_IS_DEMO_MODE === 'true';
const DEMO_DATE = process.env.NEXT_PUBLIC_DEMO_DATE || '2025-12-18';

/**
 * Returns the current date, or demo date if in demo mode
 */
export function getCurrentDate(): Date {
  if (IS_DEMO_MODE) {
    return parseISO(DEMO_DATE);
  }
  return new Date();
}

/**
 * Calculates days between given date and "current" date (respecting demo mode)
 */
export function calculateDaysSince(date: string | Date | null): number {
  if (!date) return 0;

  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const currentDate = getCurrentDate();

  return differenceInDays(currentDate, targetDate);
}

/**
 * Returns the demo date string for SQL queries
 */
export function getDemoDateString(): string {
  return DEMO_DATE;
}

/**
 * Returns whether we're in demo mode
 */
export function isDemoMode(): boolean {
  return IS_DEMO_MODE;
}
