import { storefrontService } from '../services/storefront.service.js';
import { analyticsService } from '../services/analytics.service.js';

export class StorefrontController {
  /**
   * GET /api/storefront/timer?shop=...&productId=...&collectionIds=...
   */
  async getTimer(req, res, next) {
    try {
      const { shop, productId, collectionIds } = req.query;

      const timer = await storefrontService.resolveTimerForStorefront(
        shop,
        productId,
        collectionIds
      );

      // Return public cache headers: cache for 30s, stale-while-revalidate for 60s
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      res.status(200).json({ timer });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/storefront/impression
   */
  async recordImpression(req, res, next) {
    try {
      const { shop, timerId } = req.body;

      const result = await analyticsService.recordImpression(shop, timerId);

      if (!result.success) {
        return res.status(404).json({ error: result.reason });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

export const storefrontController = new StorefrontController();
