import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      trim: true,
    },
    timerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timer',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index for atomic daily aggregation per timer and shop
analyticsSchema.index({ shop: 1, timerId: 1, date: 1 }, { unique: true });
analyticsSchema.index({ shop: 1, date: 1 });

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);
