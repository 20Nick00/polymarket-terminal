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

/**
 * Get color for a probability value (0-1 scale).
 * 0-20%: Deep red, 20-40%: Orange-red, 40-60%: Yellow,
 * 60-80%: Light green, 80-100%: Bright green
 */
export function getProbabilityColor(prob: number): string {
  if (prob >= 0.8) return '#00d4aa';
  if (prob >= 0.6) return '#51cf66';
  if (prob >= 0.4) return '#ffd43b';
  if (prob >= 0.2) return '#ff6b6b';
  return '#ff4757';
}

/**
 * Format a change value with arrow: "↗ +5.2%" or "↘ -3.1%"
 */
export function formatChange(change: number): { text: string; color: string; arrow: string } {
  const isPositive = change >= 0;
  return {
    text: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
    color: isPositive ? '#00d4aa' : '#ff4757',
    arrow: isPositive ? '↗' : '↘',
  };
}

/**
 * Format relative time: "just now", "23m ago", "5h ago", "3d ago", etc.
 */
export function formatRelativeTime(dateStr: string | number): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Format time-to-resolution with urgency coloring.
 */
export function formatTimeToResolution(endDate: string | null | undefined): { text: string; color: string; urgent: boolean } {
  if (!endDate) return { text: 'N/A', color: '#888', urgent: false };
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return { text: 'Ended', color: '#ff4757', urgent: false };

    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const remainHrs = diffHrs % 24;
    const remainMin = Math.floor((diffMs / 60000) % 60);

    if (diffHrs < 24) {
      return { text: `Ends in ${diffHrs}h ${remainMin}m`, color: '#ff6b6b', urgent: true };
    }
    if (diffDays < 7) {
      return { text: `Ends in ${diffDays}d ${remainHrs}h`, color: '#ffd43b', urgent: false };
    }
    if (diffDays < 30) {
      return { text: `Ends in ${diffDays} days`, color: '#888', urgent: false };
    }
    return {
      text: `Ends ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      color: '#888',
      urgent: false,
    };
  } catch {
    return { text: 'N/A', color: '#888', urgent: false };
  }
}
