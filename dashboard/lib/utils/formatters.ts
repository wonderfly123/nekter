/**
 * Formats currency with commas and dollar sign
 * @example formatCurrency(450000) => "$450,000"
 */
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats currency in compact form (K/M)
 * @example formatCompactCurrency(450000) => "$450K"
 * @example formatCompactCurrency(1500000) => "$1.5M"
 */
export function formatCompactCurrency(value: number | null): string {
  if (value === null || value === undefined) return '$0';

  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${value}`;
}

/**
 * Formats number with commas
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Formats percentage
 * @example formatPercentage(87.5) => "88%"
 */
export function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
}
