/**
 * Polymarket API returns some array fields as JSON strings.
 * This safely parses them into actual arrays.
 */
export function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not valid JSON
    }
  }
  return [];
}

/**
 * Get the YES token ID from a market's clobTokenIds field.
 * Index 0 = YES outcome token.
 */
export function getYesTokenId(clobTokenIds: unknown): string | null {
  const ids = parseJsonArray(clobTokenIds);
  return ids[0] || null;
}

/**
 * Get the NO token ID from a market's clobTokenIds field.
 * Index 1 = NO outcome token.
 */
export function getNoTokenId(clobTokenIds: unknown): string | null {
  const ids = parseJsonArray(clobTokenIds);
  return ids[1] || null;
}

/**
 * Parse outcomePrices to get YES and NO prices as numbers.
 */
export function parseOutcomePrices(outcomePrices: unknown): { yes: number; no: number } {
  const prices = parseJsonArray(outcomePrices);
  return {
    yes: parseFloat(prices[0] || '0'),
    no: parseFloat(prices[1] || '0'),
  };
}

/**
 * Format a number compactly: 1234567 -> "$1.2M", 12345 -> "$12.3K"
 */
export function formatUsd(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

/**
 * Format shares: 1234567 -> "1.2M", 12345 -> "12.3K"
 */
export function formatShares(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(0);
}
