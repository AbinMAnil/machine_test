import { timerRepository } from '../repositories/timer.repository.js';
import { calculateTimerStatus } from '../utils/status-calculator.js';
import { toProductGid, toCollectionGid } from '../utils/gid.js';
import { getNow } from '../utils/clock.js';

export class StorefrontService {
  /**
   * Deterministically resolve active timer for a given shop, product, and collection context.
   *
   * Priority hierarchy:
   * 1. Specific product match (targeting.type === 'products')
   * 2. Specific collection match (targeting.type === 'collections')
   * 3. Global storewide match (targeting.type === 'all')
   *
   * Tie-breaker within tiers:
   * 1. timer.priority (descending)
   * 2. timer.updatedAt (descending)
   * 3. timer._id (descending)
   *
   * @param {string} shop - Shopify domain
   * @param {string|null} [productId] - Shopify Product ID or GID
   * @param {string[]|string|null} [collectionIds] - Shopify Collection ID(s) or GID(s)
   * @param {Date|Function} [clock] - Injectable clock for deterministic testing
   * @returns {Promise<object|null>} Safe public timer configuration or null
   */
  async resolveTimerForStorefront(shop, productId, collectionIds, clock = getNow) {
    if (!shop) {
      return null;
    }

    const candidateTimers = await timerRepository.findActiveTimersForStorefront(shop);
    if (!candidateTimers || candidateTimers.length === 0) {
      return null;
    }

    // Filter to only timers that are currently effective
    const activeTimers = candidateTimers.filter((timer) => {
      try {
        const effectiveStatus = calculateTimerStatus(timer, clock);
        return effectiveStatus === 'active';
      } catch {
        return false;
      }
    });

    if (activeTimers.length === 0) {
      return null;
    }

    const productGid = productId ? toProductGid(productId) : null;
    const rawCollections = Array.isArray(collectionIds)
      ? collectionIds
      : typeof collectionIds === 'string'
      ? collectionIds.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    const collectionGidSet = new Set(rawCollections.map((c) => toCollectionGid(c)));

    const productMatches = [];
    const collectionMatches = [];
    const allMatches = [];

    for (const timer of activeTimers) {
      const targeting = timer.targeting || { type: 'all' };

      if (targeting.type === 'products' && productGid) {
        if (Array.isArray(targeting.productIds) && targeting.productIds.includes(productGid)) {
          productMatches.push(timer);
        }
      } else if (targeting.type === 'collections' && collectionGidSet.size > 0) {
        if (
          Array.isArray(targeting.collectionIds) &&
          targeting.collectionIds.some((cid) => collectionGidSet.has(cid))
        ) {
          collectionMatches.push(timer);
        }
      } else if (targeting.type === 'all') {
        allMatches.push(timer);
      }
    }

    // Sorter: priority descending, updatedAt descending, id descending
    const sortMatches = (list) =>
      list.sort((a, b) => {
        const pA = a.priority ?? 0;
        const pB = b.priority ?? 0;
        if (pA !== pB) return pB - pA;

        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;

        return String(b._id).localeCompare(String(a._id));
      });

    let winningTimer = null;
    if (productMatches.length > 0) {
      winningTimer = sortMatches(productMatches)[0];
    } else if (collectionMatches.length > 0) {
      winningTimer = sortMatches(collectionMatches)[0];
    } else if (allMatches.length > 0) {
      winningTimer = sortMatches(allMatches)[0];
    }

    if (!winningTimer) {
      return null;
    }

    // Return safe, minimal public configuration only
    return {
      id: String(winningTimer._id),
      name: winningTimer.name,
      type: winningTimer.type,
      startAt: winningTimer.startAt ? new Date(winningTimer.startAt).toISOString() : null,
      endAt: winningTimer.endAt ? new Date(winningTimer.endAt).toISOString() : null,
      evergreenDurationSeconds: winningTimer.evergreenDurationSeconds || null,
      appearance: {
        text: winningTimer.appearance?.text || 'Sale ends in {time}!',
        backgroundColor: winningTimer.appearance?.backgroundColor || '#111827',
        textColor: winningTimer.appearance?.textColor || '#ffffff',
        position: winningTimer.appearance?.position || 'above_buy_button',
        urgencyThresholdSeconds: winningTimer.appearance?.urgencyThresholdSeconds ?? 3600,
      },
    };
  }
}

export const storefrontService = new StorefrontService();
