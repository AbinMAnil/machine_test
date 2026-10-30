import { describe, it, expect } from 'vitest';
import {
  hexColorSchema,
  safeTextSchema,
  shopifyProductGidSchema,
  shopifyCollectionGidSchema,
  timerInputSchema,
  storefrontQuerySchema,
  storefrontImpressionSchema,
} from '../../shared/validation/timer.schema.js';

describe('Validation Schemas', () => {
  describe('Hex Color Validation', () => {
    it('accepts valid 6-character hex colors', () => {
      expect(hexColorSchema.parse('#111827')).toBe('#111827');
      expect(hexColorSchema.parse('#ffffff')).toBe('#ffffff');
      expect(hexColorSchema.parse('#A3E635')).toBe('#A3E635');
    });

    it('accepts valid 3-character hex colors', () => {
      expect(hexColorSchema.parse('#000')).toBe('#000');
      expect(hexColorSchema.parse('#fff')).toBe('#fff');
    });

    it('rejects invalid color values', () => {
      expect(() => hexColorSchema.parse('red')).toThrow();
      expect(() => hexColorSchema.parse('111827')).toThrow();
      expect(() => hexColorSchema.parse('#12345')).toThrow();
      expect(() => hexColorSchema.parse('#gggggg')).toThrow();
      expect(() => hexColorSchema.parse('rgba(0,0,0,1)')).toThrow();
    });
  });

  describe('Safe Text & HTML Injection Prevention', () => {
    it('accepts clean promotional messages with tokens', () => {
      const text = 'Hurry! Flash Sale ends in {time}';
      expect(safeTextSchema.parse(text)).toBe(text);
    });

    it('rejects text containing executable script tags', () => {
      const malicious = 'Hurry! <script>alert("xss")</script>';
      expect(() => safeTextSchema.parse(malicious)).toThrow('Text must not contain script tags');
    });

    it('rejects empty text and text exceeding 200 characters', () => {
      expect(() => safeTextSchema.parse('')).toThrow();
      expect(() => safeTextSchema.parse('a'.repeat(201))).toThrow();
    });
  });

  describe('Shopify GID Validation', () => {
    it('validates product GIDs properly', () => {
      expect(shopifyProductGidSchema.parse('gid://shopify/Product/1234567890')).toBe(
        'gid://shopify/Product/1234567890'
      );
      expect(() => shopifyProductGidSchema.parse('1234567890')).toThrow();
      expect(() => shopifyProductGidSchema.parse('gid://shopify/Collection/123')).toThrow();
    });

    it('validates collection GIDs properly', () => {
      expect(shopifyCollectionGidSchema.parse('gid://shopify/Collection/9876543210')).toBe(
        'gid://shopify/Collection/9876543210'
      );
      expect(() => shopifyCollectionGidSchema.parse('9876543210')).toThrow();
    });
  });

  describe('Timer Input Schema (Fixed vs Evergreen Rules)', () => {
    const validFixed = {
      name: 'Black Friday Sale',
      type: 'fixed',
      status: 'active',
      startAt: '2026-11-20T00:00:00.000Z',
      endAt: '2026-11-25T00:00:00.000Z',
      targeting: { type: 'all' },
      appearance: {
        text: 'Black Friday ends in {time}',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        position: 'above_buy_button',
        urgencyThresholdSeconds: 7200,
      },
    };

    it('accepts a valid fixed timer configuration', () => {
      const result = timerInputSchema.safeParse(validFixed);
      expect(result.success).toBe(true);
    });

    it('rejects a fixed timer where startAt is equal to or after endAt', () => {
      const invalid = {
        ...validFixed,
        startAt: '2026-11-25T00:00:00.000Z',
        endAt: '2026-11-20T00:00:00.000Z',
      };
      const result = timerInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('End date must be strictly after the start date');
    });

    it('rejects a fixed timer missing startAt or endAt', () => {
      const invalid = { ...validFixed, startAt: null };
      const result = timerInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts a valid evergreen timer configuration', () => {
      const validEvergreen = {
        name: 'Welcome Discount Timer',
        type: 'evergreen',
        status: 'active',
        evergreenDurationSeconds: 1800, // 30 minutes
        targeting: { type: 'all' },
        appearance: {
          text: 'Claim your 15% off in {time}',
          backgroundColor: '#1e3a8a',
          textColor: '#ffffff',
          position: 'top_of_page',
          urgencyThresholdSeconds: 300,
        },
      };
      const result = timerInputSchema.safeParse(validEvergreen);
      expect(result.success).toBe(true);
    });

    it('rejects evergreen timer with negative or zero duration', () => {
      const invalid = {
        name: 'Bad Evergreen',
        type: 'evergreen',
        evergreenDurationSeconds: 0,
        targeting: { type: 'all' },
      };
      const result = timerInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects evergreen timer exceeding maximum duration of 30 days', () => {
      const invalid = {
        name: 'Excessive Evergreen',
        type: 'evergreen',
        evergreenDurationSeconds: 31 * 24 * 3600, // 31 days
        targeting: { type: 'all' },
      };
      const result = timerInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('enforces productIds when targeting.type is products', () => {
      const invalid = {
        ...validFixed,
        targeting: { type: 'products', productIds: [] },
      };
      const result = timerInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('At least one product must be selected');
    });

    it('enforces collectionIds when targeting.type is collections', () => {
      const invalid = {
        ...validFixed,
        targeting: { type: 'collections', collectionIds: [] },
      };
      const result = timerInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('At least one collection must be selected');
    });
  });

  describe('Storefront Query & Impression Schemas', () => {
    it('validates correct storefront queries', () => {
      const query = {
        shop: 'quickstart-store.myshopify.com',
        productId: 'gid://shopify/Product/12345678',
        collectionIds: 'gid://shopify/Collection/111,gid://shopify/Collection/222',
      };
      const result = storefrontQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('rejects queries without shop parameter or with invalid domain', () => {
      expect(storefrontQuerySchema.safeParse({}).success).toBe(false);
      expect(storefrontQuerySchema.safeParse({ shop: 'not a domain!' }).success).toBe(false);
    });

    it('validates storefront impression reports', () => {
      const validImpression = {
        shop: 'quickstart-store.myshopify.com',
        timerId: '654321098765432109876543',
      };
      expect(storefrontImpressionSchema.safeParse(validImpression).success).toBe(true);

      const invalidImpression = {
        shop: 'quickstart-store.myshopify.com',
        timerId: 'bad_id',
      };
      expect(storefrontImpressionSchema.safeParse(invalidImpression).success).toBe(false);
    });
  });
});
