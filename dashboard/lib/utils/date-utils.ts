import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { getCurrentDate, calculateDaysSince } from '../config/demo';

/**
 * Formats date as "Dec 9, 2025"
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Formats date relative to current/demo date
 * @example formatRelativeDate(someDate) => "32 days ago"
 */
export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return 'Never';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const currentDate = getCurrentDate();

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    includeSeconds: false,
  });
}

/**
 * Formats days ago in compact form
 * @example formatDaysAgo(11) => "11d ago"
 * @example formatDaysAgo(0) => "Today"
 * @example formatDaysAgo(1) => "Yesterday"
 */
export function formatDaysAgo(days: number | null): string {
  if (days === null || days === undefined) return 'N/A';

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

/**
 * Calculates and formats days since a date
 * @example formatDaysSinceDate('2025-11-07') => "51d ago"
 */
export function formatDaysSinceDate(date: string | Date | null): string {
  if (!date) return 'N/A';
  const days = calculateDaysSince(date);
  return formatDaysAgo(days);
}
