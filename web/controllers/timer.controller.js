import mongoose from 'mongoose';
import { timerService } from '../services/timer.service.js';

export class TimerController {
  /**
   * GET /api/timers
   */
  async listTimers(req, res, next) {
    try {
      const { shop } = req;
      const { status, search, page, limit } = req.query;

      const pageNum = page ? parseInt(String(page), 10) : 1;
      const limitNum = limit ? Math.min(100, Math.max(1, parseInt(String(limit), 10))) : 50;

      const result = await timerService.listTimers(shop, {
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
        page: pageNum,
        limit: limitNum,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/timers
   */
  async createTimer(req, res, next) {
    try {
      const { shop } = req;
      const timer = await timerService.createTimer(shop, req.body);
      res.status(201).json({ timer });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/timers/:id
   */
  async getTimer(req, res, next) {
    try {
      const { shop } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid timer ID format' });
      }

      const timer = await timerService.getTimerById(id, shop);
      if (!timer) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.status(200).json({ timer });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/timers/:id
   */
  async updateTimer(req, res, next) {
    try {
      const { shop } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid timer ID format' });
      }

      const updated = await timerService.updateTimer(id, shop, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.status(200).json({ timer: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/timers/:id/status
   */
  async patchTimerStatus(req, res, next) {
    try {
      const { shop } = req;
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid timer ID format' });
      }

      const updated = await timerService.updateTimerStatus(id, shop, status);
      if (!updated) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.status(200).json({ timer: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/timers/:id
   */
  async deleteTimer(req, res, next) {
    try {
      const { shop } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid timer ID format' });
      }

      const deleted = await timerService.deleteTimer(id, shop);
      if (!deleted) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Timer deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const timerController = new TimerController();
