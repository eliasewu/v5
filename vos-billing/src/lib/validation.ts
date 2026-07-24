/**
 * Shared validation constants for gateway configuration fields.
 * Used by both routing and mapping gateway editor forms.
 */

export const PORT_RANGE = { min: 1024, max: 65535 } as const;
export const DTMF_PAYLOAD_RANGE = { min: 0, max: 127 } as const;
export const TIMEOUT_RANGE = { min: 1, max: 3600 } as const;
export const CAPACITY_RANGE = { min: 0, max: 100000 } as const;
export const PRIORITY_RANGE = { min: 0, max: 9999 } as const;
export const PROFIT_PERCENT_RANGE = { min: 0, max: 100 } as const;
export const CALL_LENGTH_RANGE = { min: 0, max: 99999 } as const;
export const CALL_RATE_RANGE = { min: 0, max: 99999999 } as const;

/** Clamp a number value between min and max, returning the clamped integer. */
export function clampInt(
  value: number,
  min: number,
  max: number,
  fallback: number = min
): number {
  if (isNaN(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}
