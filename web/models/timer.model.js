import mongoose from 'mongoose';
import {
  TIMER_TYPES,
  TIMER_STATUSES,
  TARGETING_TYPES,
  POSITIONS,
  DEFAULT_APPEARANCE,
} from '../../shared/constants/timer.constants.js';

const targetingSubSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: TARGETING_TYPES,
      default: 'all',
      required: true,
    },
    productIds: {
      type: [String],
      default: [],
    },
    collectionIds: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const appearanceSubSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      default: DEFAULT_APPEARANCE.text,
      required: true,
    },
    backgroundColor: {
      type: String,
      trim: true,
      default: DEFAULT_APPEARANCE.backgroundColor,
      required: true,
    },
    textColor: {
      type: String,
      trim: true,
      default: DEFAULT_APPEARANCE.textColor,
      required: true,
    },
    position: {
      type: String,
      enum: POSITIONS,
      default: DEFAULT_APPEARANCE.position,
      required: true,
    },
    urgencyThresholdSeconds: {
      type: Number,
      min: 0,
      default: DEFAULT_APPEARANCE.urgencyThresholdSeconds,
      required: true,
    },
  },
  { _id: false }
);

const timerSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: TIMER_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: TIMER_STATUSES,
      default: 'active',
      index: true,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    evergreenDurationSeconds: {
      type: Number,
      min: 1,
      default: null,
    },
    targeting: {
      type: targetingSubSchema,
      default: () => ({ type: 'all', productIds: [], collectionIds: [] }),
    },
    appearance: {
      type: appearanceSubSchema,
      default: () => ({ ...DEFAULT_APPEARANCE }),
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Query optimization compound indexes
timerSchema.index({ shop: 1, status: 1 });
timerSchema.index({ shop: 1, 'targeting.type': 1 });
timerSchema.index({ shop: 1, 'targeting.productIds': 1 });
timerSchema.index({ shop: 1, 'targeting.collectionIds': 1 });

export const Timer = mongoose.models.Timer || mongoose.model('Timer', timerSchema);
