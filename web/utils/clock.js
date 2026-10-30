/**
 * Deterministic Clock Utility
 * Supports injecting a custom clock function for time-dependent testing
 */

let systemClock = () => new Date();

export function getNow() {
  return systemClock();
}

export function setSystemClock(clockFn) {
  systemClock = clockFn;
}

export function resetSystemClock() {
  systemClock = () => new Date();
}
