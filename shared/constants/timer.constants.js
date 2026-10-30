/**
 * Constants for Countdown Timer + Analytics
 */

export const TIMER_TYPES = /** @type {const} */ (['fixed', 'evergreen']);

export const TIMER_STATUSES = /** @type {const} */ (['active', 'paused', 'archived']);

export const EFFECTIVE_STATUSES = /** @type {const} */ ([
  'active',
  'scheduled',
  'expired',
  'paused',
  'archived',
]);

export const TARGETING_TYPES = /** @type {const} */ (['all', 'products', 'collections']);

export const POSITIONS = /** @type {const} */ ([
  'above_buy_button',
  'below_buy_button',
  'top_of_page',
  'bottom_of_page',
  'custom',
]);

export const MIN_EVERGREEN_DURATION_SECONDS = 60; // 1 minute
export const MAX_EVERGREEN_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days (2,592,000s)

export const DEFAULT_APPEARANCE = {
  text: 'Sale ends in {time}!',
  backgroundColor: '#111827',
  textColor: '#ffffff',
  position: 'above_buy_button',
  urgencyThresholdSeconds: 3600, // 1 hour
};
