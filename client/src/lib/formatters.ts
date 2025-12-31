/**
 * Format number to German locale with thousands separator (.) and decimal comma (,)
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "15.662,38")
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency to German locale with € symbol after the amount
 * @param value - Amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "15.662,38 €")
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)} €`;
}

/**
 * Format percentage with German decimal comma
 * @param value - Percentage value (e.g., 2.5 for 2.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "2,50%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format ROAS multiplier with German decimal comma
 * @param value - ROAS value (e.g., 1.03 for 1.03x)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1,03x")
 */
export function formatRoas(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}x`;
}
