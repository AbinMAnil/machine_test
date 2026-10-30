import { Router } from 'express';
import { timerController } from '../controllers/timer.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  timerInputSchema,
  timerStatusPatchSchema,
} from '../../shared/validation/timer.schema.js';

const router = Router();

router.get('/', (req, res, next) => timerController.listTimers(req, res, next));
router.post('/', validateBody(timerInputSchema), (req, res, next) =>
  timerController.createTimer(req, res, next)
);
router.get('/:id', (req, res, next) => timerController.getTimer(req, res, next));
router.put('/:id', validateBody(timerInputSchema), (req, res, next) =>
  timerController.updateTimer(req, res, next)
);
router.patch('/:id/status', validateBody(timerStatusPatchSchema), (req, res, next) =>
  timerController.patchTimerStatus(req, res, next)
);
router.delete('/:id', (req, res, next) => timerController.deleteTimer(req, res, next));

export default router;
