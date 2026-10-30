import { analyticsRepository } from '../repositories/analytics.repository.js';
import { timerRepository } from '../repositories/timer.repository.js';
import { calculateTimerStatus } from '../utils/status-calculator.js';
import { getNow } from '../utils/clock.js';

export class AnalyticsService {
  /**
   * Record a storefront impression for a timer.
   * Atomically increments the daily count.
   */
  async recordImpression(shop, timerId) {
    // Verify that the timer exists and belongs to the shop
    const timer = await timerRepository.findByIdAndShop(timerId, shop);
    if (!timer) {
      return { success: false, reason: 'Timer not found for shop' };
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    const record = await analyticsRepository.incrementImpression(shop, timerId, todayDateStr);

    return {
      success: true,
      impressions: record.impressions,
    };
  }

  /**
   * Get comprehensive aggregated analytics for admin dashboard
   */
  async getAdminAnalytics(shop, clock = getNow) {
    const [timersResult, totalImpressions, impressionsMap, dailyTrend] = await Promise.all([
      timerRepository.findByShop(shop, { limit: 1000 }),
      analyticsRepository.getTotalImpressionsByShop(shop),
      analyticsRepository.getImpressionsGroupedByTimer(shop),
      analyticsRepository.getDailyImpressionTrend(shop, 30),
    ]);

    const { timers } = timersResult;

    let activeCount = 0;
    let scheduledCount = 0;
    let expiredCount = 0;
    let pausedCount = 0;
    let archivedCount = 0;

    const timerBreakdown = timers.map((timer) => {
      const effectiveStatus = calculateTimerStatus(timer, clock);
      if (effectiveStatus === 'active') activeCount++;
      else if (effectiveStatus === 'scheduled') scheduledCount++;
      else if (effectiveStatus === 'expired') expiredCount++;
      else if (effectiveStatus === 'paused') pausedCount++;
      else if (effectiveStatus === 'archived') archivedCount++;

      const impressions = impressionsMap[String(timer._id)] || 0;

      return {
        id: String(timer._id),
        name: timer.name,
        type: timer.type,
        effectiveStatus,
        impressions,
        createdAt: timer.createdAt,
      };
    });

    return {
      summary: {
        totalTimers: timers.length,
        activeTimers: activeCount,
        scheduledTimers: scheduledCount,
        expiredTimers: expiredCount,
        pausedTimers: pausedCount,
        archivedTimers: archivedCount,
        totalImpressions,
      },
      timerBreakdown,
      dailyTrend,
    };
  }
}

export const analyticsService = new AnalyticsService();
