import { analyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  /**
   * GET /api/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const { shop } = req;
      const data = await analyticsService.getAdminAnalytics(shop);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
