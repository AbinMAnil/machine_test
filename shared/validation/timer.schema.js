import { z } from 'zod';
import {
  TIMER_TYPES,
  TIMER_STATUSES,
  TARGETING_TYPES,
  POSITIONS,
  MIN_EVERGREEN_DURATION_SECONDS,
  MAX_EVERGREEN_DURATION_SECONDS,
} from '../constants/timer.constants.js';

// Hex color validator (#fff or #ffffff)
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Must be a valid hex color (e.g. #111827 or #fff)',
  });

// Safe text without script injection
export const safeTextSchema = z
  .string()
  .trim()
  .min(1, 'Text cannot be empty')
  .max(200, 'Text must not exceed 200 characters')
  .refine((val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val), {
    message: 'Text must not contain script tags or executable HTML',
  });

// Shopify GID validators
export const shopifyProductGidSchema = z
  .string()
  .trim()
  .regex(/^gid:\/\/shopify\/Product\/\d+$/, {
    message: 'Must be a valid Shopify Product GID (e.g. gid://shopify/Product/1234567890)',
  });

export const shopifyCollectionGidSchema = z
  .string()
  .trim()
  .regex(/^gid:\/\/shopify\/Collection\/\d+$/, {
    message: 'Must be a valid Shopify Collection GID (e.g. gid://shopify/Collection/1234567890)',
  });

// Targeting schema
export const targetingSchema = z
  .object({
    type: z.enum(TARGETING_TYPES),
    productIds: z.array(shopifyProductGidSchema).default([]),
    collectionIds: z.array(shopifyCollectionGidSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'products' && (!data.productIds || data.productIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productIds'],
        message: 'At least one product must be selected for product targeting',
      });
    }
    if (data.type === 'collections' && (!data.collectionIds || data.collectionIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['collectionIds'],
        message: 'At least one collection must be selected for collection targeting',
      });
    }
  });

// Appearance schema
export const appearanceSchema = z.object({
  text: safeTextSchema.default('Sale ends in {time}!'),
  backgroundColor: hexColorSchema.default('#111827'),
  textColor: hexColorSchema.default('#ffffff'),
  position: z.enum(POSITIONS).default('above_buy_button'),
  urgencyThresholdSeconds: z
    .number()
    .int()
    .min(0, 'Urgency threshold must be a non-negative integer')
    .default(3600),
});

// Full Timer Create / Update schema
export const timerInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Timer name is required').max(100, 'Timer name cannot exceed 100 characters'),
    type: z.enum(TIMER_TYPES),
    status: z.enum(TIMER_STATUSES).default('active'),
    startAt: z.string().datetime({ offset: true }).nullable().optional(),
    endAt: z.string().datetime({ offset: true }).nullable().optional(),
    evergreenDurationSeconds: z
      .number()
      .int()
      .min(MIN_EVERGREEN_DURATION_SECONDS, `Duration must be at least ${MIN_EVERGREEN_DURATION_SECONDS} seconds`)
      .max(MAX_EVERGREEN_DURATION_SECONDS, `Duration must not exceed ${MAX_EVERGREEN_DURATION_SECONDS} seconds (30 days)`)
      .nullable()
      .optional(),
    targeting: targetingSchema,
    appearance: appearanceSchema,
    priority: z.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'fixed') {
      if (!data.startAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startAt'],
          message: 'Start date and time is required for fixed timers',
        });
      }
      if (!data.endAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endAt'],
          message: 'End date and time is required for fixed timers',
        });
      }
      if (data.startAt && data.endAt) {
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();
        if (Number.isNaN(start)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startAt'],
            message: 'Invalid start date format',
          });
        }
        if (Number.isNaN(end)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endAt'],
            message: 'Invalid end date format',
          });
        }
        if (start >= end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endAt'],
            message: 'End date must be strictly after the start date',
          });
        }
      }
    } else if (data.type === 'evergreen') {
      if (typeof data.evergreenDurationSeconds !== 'number' || data.evergreenDurationSeconds <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['evergreenDurationSeconds'],
          message: 'A positive duration in seconds is required for evergreen timers',
        });
      }
    }
  });

// Status patch schema
export const timerStatusPatchSchema = z.object({
  status: z.enum(TIMER_STATUSES),
});

// Storefront timer query schema
export const storefrontQuerySchema = z.object({
  shop: z
    .string()
    .trim()
    .min(1, 'shop parameter is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-.]*\.[a-zA-Z]{2,}$/, 'Invalid shop domain format'),
  productId: z
    .string()
    .trim()
    .regex(/^gid:\/\/shopify\/Product\/\d+$|^\d+$/, 'Invalid productId format')
    .optional(),
  collectionIds: z
    .string()
    .trim()
    .optional(),
});

// Storefront impression schema
export const storefrontImpressionSchema = z.object({
  shop: z
    .string()
    .trim()
    .min(1, 'shop is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-.]*\.[a-zA-Z]{2,}$/, 'Invalid shop domain format'),
  timerId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid timerId format'),
});
