import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    installedAt: {
      type: Date,
      default: Date.now,
    },
    uninstalledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['installed', 'uninstalled'],
      default: 'installed',
    },
  },
  {
    timestamps: true,
  }
);

export const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
