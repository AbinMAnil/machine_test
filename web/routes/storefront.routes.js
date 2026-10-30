import { Router } from 'express';
import cors from 'cors';
import { storefrontController } from '../controllers/storefront.controller.js';
import {
  storefrontRateLimiter,
  impressionRateLimiter,
} from '../middleware/rate-limit.middleware.js';
import {
  validateQuery,
  validateBody,
} from '../middleware/validate.middleware.js';
import {
  storefrontQuerySchema,
  storefrontImpressionSchema,
} from '../../shared/validation/timer.schema.js';

const router = Router();

// Storefront calls originate from merchants' storefront domains, so enable CORS for public GET and POST
router.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  })
);

router.get(
  '/timer',
  storefrontRateLimiter,
  validateQuery(storefrontQuerySchema),
  (req, res, next) => storefrontController.getTimer(req, res, next)
);

router.post(
  '/impression',
  impressionRateLimiter,
  validateBody(storefrontImpressionSchema),
  (req, res, next) => storefrontController.recordImpression(req, res, next)
);

export default router;
