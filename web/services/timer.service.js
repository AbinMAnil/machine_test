import { timerRepository } from '../repositories/timer.repository.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { calculateTimerStatus } from '../utils/status-calculator.js';
import { getNow } from '../utils/clock.js';

export class TimerService {
  /**
   * Enrich timer with effective calculated status and total impressions
   */
  enrichTimer(timer, impressionsMap = {}, clock = getNow) {
    const effectiveStatus = calculateTimerStatus(timer, clock);
    const impressions = impressionsMap[String(timer._id)] || 0;

    return {
      ...timer,
      id: timer._id.toString(),
      effectiveStatus,
      impressions,
    };
  }

  /**
   * List timers for a shop with enriched data
   */
  async listTimers(shop, options = {}, clock = getNow) {
    const { timers, pagination } = await timerRepository.findByShop(shop, options);
    const impressionsMap = await analyticsRepository.getImpressionsGroupedByTimer(shop);

    const enrichedTimers = timers.map((t) => this.enrichTimer(t, impressionsMap, clock));

    return {
      timers: enrichedTimers,
      pagination,
    };
  }

  /**
   * Get single timer by ID for a shop
   */
  async getTimerById(id, shop, clock = getNow) {
    const timer = await timerRepository.findByIdAndShop(id, shop);
    if (!timer) {
      return null;
    }
    const impressionsMap = await analyticsRepository.getImpressionsGroupedByTimer(shop);
    return this.enrichTimer(timer, impressionsMap, clock);
  }

  /**
   * Create new timer for shop
   */
  async createTimer(shop, data) {
    const timerData = {
      ...data,
      shop,
    };
    const created = await timerRepository.create(timerData);
    return this.enrichTimer(created.toObject ? created.toObject() : created);
  }

  /**
   * Update existing timer for shop
   */
  async updateTimer(id, shop, updateData) {
    // Ensure shop cannot be overwritten
    const { shop: _ignored, ...cleanUpdate } = updateData;
    const updated = await timerRepository.updateByIdAndShop(id, shop, cleanUpdate);
    if (!updated) {
      return null;
    }
    const impressionsMap = await analyticsRepository.getImpressionsGroupedByTimer(shop);
    return this.enrichTimer(updated, impressionsMap);
  }

  /**
   * Update status (e.g. active <-> paused <-> archived)
   */
  async updateTimerStatus(id, shop, status) {
    const updated = await timerRepository.updateByIdAndShop(id, shop, { status });
    if (!updated) {
      return null;
    }
    const impressionsMap = await analyticsRepository.getImpressionsGroupedByTimer(shop);
    return this.enrichTimer(updated, impressionsMap);
  }

  /**
   * Delete timer and associated analytics data
   */
  async deleteTimer(id, shop) {
    const deleted = await timerRepository.deleteByIdAndShop(id, shop);
    if (!deleted) {
      return false;
    }
    await analyticsRepository.deleteByTimerIdAndShop(id, shop);
    return true;
  }
}

export const timerService = new TimerService();
