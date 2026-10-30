import { getNow } from './clock.js';

/**
 * Authoritative status calculation for timers.
 * 
 * @param {object} timer - Timer object containing type, status, startAt, endAt
 * @param {Date|Function|number} [clock] - Optional custom date, timestamp, or clock function
 * @returns {'active'|'scheduled'|'expired'|'paused'|'archived'}
 */
export function calculateTimerStatus(timer, clock = getNow) {
  if (!timer) {
    throw new Error('Timer is required for status calculation');
  }

  // Paused and archived override date calculations
  if (timer.status === 'paused') {
    return 'paused';
  }
  if (timer.status === 'archived') {
    return 'archived';
  }

  // If timer is not active in config, return its raw status
  if (timer.status !== 'active') {
    return timer.status;
  }

  // For Evergreen timers, activation status governs the timer globally.
  // Visitor-specific expiry is evaluated on the client.
  if (timer.type === 'evergreen') {
    return 'active';
  }

  // For Fixed timers, calculate based on startAt and endAt
  const currentDate = typeof clock === 'function' ? clock() : new Date(clock);
  const nowMs = currentDate.getTime();
  const startMs = new Date(timer.startAt).getTime();
  const endMs = new Date(timer.endAt).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new Error('Invalid dates provided for fixed timer status calculation');
  }

  if (nowMs < startMs) {
    return 'scheduled';
  }
  if (nowMs >= startMs && nowMs < endMs) {
    return 'active';
  }
  return 'expired';
}

/**
 * Calculates remaining seconds for a fixed timer.
 * 
 * @param {object} timer
 * @param {Date|Function|number} [clock]
 * @returns {number|null}
 */
export function calculateRemainingSeconds(timer, clock = getNow) {
  if (!timer || timer.type !== 'fixed') {
    return null;
  }
  const currentDate = typeof clock === 'function' ? clock() : new Date(clock);
  const nowMs = currentDate.getTime();
  const endMs = new Date(timer.endAt).getTime();

  if (Number.isNaN(endMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endMs - nowMs) / 1000));
}

/**
 * Resolves visitor-specific expiry for evergreen countdown.
 *
 * @param {number|string|null} storedExpiryMs - Stored timestamp in ms
 * @param {number} durationSeconds - Configured duration in seconds
 * @param {number} [nowMs] - Current timestamp in ms (defaults to Date.now())
 * @returns {{ expiryMs: number, isNew: boolean }}
 */
export function resolveEvergreenVisitorExpiry(storedExpiryMs, durationSeconds, nowMs = Date.now()) {
  const parsed = storedExpiryMs ? Number(storedExpiryMs) : NaN;

  // If valid future expiry exists, reuse it
  if (!Number.isNaN(parsed) && parsed > nowMs) {
    return {
      expiryMs: parsed,
      isNew: false,
    };
  }

  // Otherwise, create a new expiry from now
  const newExpiryMs = nowMs + durationSeconds * 1000;
  return {
    expiryMs: newExpiryMs,
    isNew: true,
  };
}
