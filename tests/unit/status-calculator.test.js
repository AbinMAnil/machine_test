import { describe, it, expect } from 'vitest';
import {
  calculateTimerStatus,
  calculateRemainingSeconds,
  resolveEvergreenVisitorExpiry,
} from '../../web/utils/status-calculator.js';

describe('Authoritative Timer Status Calculator', () => {
  const baseFixedTimer = {
    type: 'fixed',
    status: 'active',
    startAt: '2026-11-01T10:00:00.000Z',
    endAt: '2026-11-05T10:00:00.000Z',
  };

  it('calculates scheduled status for fixed timer before its start time', () => {
    const clock = new Date('2026-10-31T23:59:59.000Z');
    const status = calculateTimerStatus(baseFixedTimer, clock);
    expect(status).toBe('scheduled');
  });

  it('calculates active status for fixed timer during its active period', () => {
    const clock = new Date('2026-11-02T12:00:00.000Z');
    const status = calculateTimerStatus(baseFixedTimer, clock);
    expect(status).toBe('active');
  });

  it('calculates active status exactly at the start millisecond', () => {
    const clock = new Date('2026-11-01T10:00:00.000Z');
    const status = calculateTimerStatus(baseFixedTimer, clock);
    expect(status).toBe('active');
  });

  it('calculates expired status for fixed timer exactly at expiration', () => {
    const clock = new Date('2026-11-05T10:00:00.000Z');
    const status = calculateTimerStatus(baseFixedTimer, clock);
    expect(status).toBe('expired');
  });

  it('calculates expired status for fixed timer after expiration', () => {
    const clock = new Date('2026-11-06T00:00:00.000Z');
    const status = calculateTimerStatus(baseFixedTimer, clock);
    expect(status).toBe('expired');
  });

  it('respects paused status even when within the active date window', () => {
    const clock = new Date('2026-11-02T12:00:00.000Z');
    const pausedTimer = { ...baseFixedTimer, status: 'paused' };
    const status = calculateTimerStatus(pausedTimer, clock);
    expect(status).toBe('paused');
  });

  it('respects archived status', () => {
    const clock = new Date('2026-11-02T12:00:00.000Z');
    const archivedTimer = { ...baseFixedTimer, status: 'archived' };
    const status = calculateTimerStatus(archivedTimer, clock);
    expect(status).toBe('archived');
  });

  it('throws an error when fixed timer has invalid dates', () => {
    const invalidTimer = {
      type: 'fixed',
      status: 'active',
      startAt: 'not-a-date',
      endAt: 'invalid',
    };
    expect(() => calculateTimerStatus(invalidTimer)).toThrow('Invalid dates');
  });

  it('calculates remaining seconds accurately for active fixed timers', () => {
    const clock = new Date('2026-11-05T09:59:00.000Z'); // 60 seconds before end
    const remaining = calculateRemainingSeconds(baseFixedTimer, clock);
    expect(remaining).toBe(60);
  });

  it('returns 0 remaining seconds when fixed timer has expired', () => {
    const clock = new Date('2026-11-05T10:00:01.000Z');
    const remaining = calculateRemainingSeconds(baseFixedTimer, clock);
    expect(remaining).toBe(0);
  });
});

describe('Evergreen Timer Expiry & Session Logic', () => {
  const baseEvergreenTimer = {
    type: 'evergreen',
    status: 'active',
    evergreenDurationSeconds: 7200, // 2 hours
  };

  it('returns active for global evergreen timer status', () => {
    const status = calculateTimerStatus(baseEvergreenTimer);
    expect(status).toBe('active');
  });

  it('returns paused for paused evergreen timer', () => {
    const status = calculateTimerStatus({ ...baseEvergreenTimer, status: 'paused' });
    expect(status).toBe('paused');
  });

  it('creates a new expiry on first visitor visit when stored expiry is null', () => {
    const now = 1000000;
    const duration = 3600; // 1 hour
    const result = resolveEvergreenVisitorExpiry(null, duration, now);

    expect(result.isNew).toBe(true);
    expect(result.expiryMs).toBe(now + 3600 * 1000);
  });

  it('reuses existing valid expiry on return visits', () => {
    const now = 1000000;
    const duration = 3600;
    const existingExpiry = now + 1800 * 1000; // 30 minutes left

    const result = resolveEvergreenVisitorExpiry(existingExpiry, duration, now);
    expect(result.isNew).toBe(false);
    expect(result.expiryMs).toBe(existingExpiry);
  });

  it('resets and creates new expiry after visitor expiry has passed', () => {
    const now = 2000000;
    const pastExpiry = 1500000; // Expired 500 seconds ago
    const duration = 3600;

    const result = resolveEvergreenVisitorExpiry(pastExpiry, duration, now);
    expect(result.isNew).toBe(true);
    expect(result.expiryMs).toBe(now + 3600 * 1000);
  });

  it('handles invalid stored values gracefully by regenerating fresh expiry', () => {
    const now = 1000000;
    const duration = 1800;

    const result = resolveEvergreenVisitorExpiry('corrupt_timestamp', duration, now);
    expect(result.isNew).toBe(true);
    expect(result.expiryMs).toBe(now + 1800 * 1000);
  });
});
