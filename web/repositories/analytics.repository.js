import mongoose from 'mongoose';
import { Analytics } from '../models/analytics.model.js';

export class AnalyticsRepository {
  /**
   * Atomically increment impressions for a given shop, timerId, and date (YYYY-MM-DD UTC)
   */
  async incrementImpression(shop, timerId, date) {
    const objectId = typeof timerId === 'string' ? new mongoose.Types.ObjectId(timerId) : timerId;

    return Analytics.findOneAndUpdate(
      { shop, timerId: objectId, date },
      { $inc: { impressions: 1 } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).lean();
  }

  /**
   * Get total impressions across all timers for a given shop
   */
  async getTotalImpressionsByShop(shop) {
    const result = await Analytics.aggregate([
      { $match: { shop } },
      { $group: { _id: null, total: { $sum: '$impressions' } } },
    ]);
    return result[0]?.total || 0;
  }

  /**
   * Get impressions per timer for a given shop
   */
  async getImpressionsGroupedByTimer(shop) {
    const results = await Analytics.aggregate([
      { $match: { shop } },
      {
        $group: {
          _id: '$timerId',
          totalImpressions: { $sum: '$impressions' },
        },
      },
    ]);

    const map = {};
    for (const row of results) {
      map[String(row._id)] = row.totalImpressions;
    }
    return map;
  }

  /**
   * Get daily impression trend for the shop
   */
  async getDailyImpressionTrend(shop, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return Analytics.aggregate([
      {
        $match: {
          shop,
          date: { $gte: cutoffStr },
        },
      },
      {
        $group: {
          _id: '$date',
          impressions: { $sum: '$impressions' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          impressions: 1,
        },
      },
    ]);
  }

  /**
   * Delete analytics data for a timer when the timer is deleted
   */
  async deleteByTimerIdAndShop(timerId, shop) {
    const objectId = typeof timerId === 'string' ? new mongoose.Types.ObjectId(timerId) : timerId;
    return Analytics.deleteMany({ timerId: objectId, shop });
  }
}

export const analyticsRepository = new AnalyticsRepository();
