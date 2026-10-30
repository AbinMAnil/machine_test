import { Timer } from '../models/timer.model.js';

export class TimerRepository {
  /**
   * List timers for a shop with optional status filter and pagination
   */
  async findByShop(shop, { status, search, page = 1, limit = 50 } = {}) {
    const query = { shop };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [timers, total] = await Promise.all([
      Timer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Timer.countDocuments(query),
    ]);

    return {
      timers,
      pagination: {
        page: Math.max(1, page),
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find single timer by ID scoped to shop (Strict tenant isolation)
   */
  async findByIdAndShop(id, shop) {
    return Timer.findOne({ _id: id, shop }).lean();
  }

  /**
   * Create new timer scoped to shop
   */
  async create(timerData) {
    const timer = new Timer(timerData);
    return timer.save();
  }

  /**
   * Update existing timer by ID scoped to shop
   */
  async updateByIdAndShop(id, shop, updateData) {
    return Timer.findOneAndUpdate(
      { _id: id, shop },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).lean();
  }

  /**
   * Delete timer by ID scoped to shop
   */
  async deleteByIdAndShop(id, shop) {
    return Timer.findOneAndDelete({ _id: id, shop }).lean();
  }

  /**
   * Find candidate active timers for storefront resolution
   */
  async findActiveTimersForStorefront(shop) {
    return Timer.find({
      shop,
      status: 'active',
    })
      .sort({ priority: -1, updatedAt: -1 })
      .lean();
  }

  /**
   * Count timers grouped by status
   */
  async getStatusCountsByShop(shop) {
    return Timer.aggregate([
      { $match: { shop } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  /**
   * Count all timers for a shop
   */
  async countByShop(shop) {
    return Timer.countDocuments({ shop });
  }
}

export const timerRepository = new TimerRepository();
