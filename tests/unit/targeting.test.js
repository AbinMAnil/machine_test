import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorefrontService } from '../../web/services/storefront.service.js';
import { timerRepository } from '../../web/repositories/timer.repository.js';

describe('Storefront Targeting Resolution Engine', () => {
  let storefrontService;

  beforeEach(() => {
    storefrontService = new StorefrontService();
    vi.restoreAllMocks();
  });

  const now = new Date('2026-11-02T12:00:00.000Z');

  it('matches product-specific timer over collection and storewide timers', async () => {
    const candidateTimers = [
      {
        _id: 'timer_all',
        name: 'Global Storewide Banner',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: { type: 'all' },
        priority: 10,
        appearance: { text: 'Storewide Sale' },
      },
      {
        _id: 'timer_col',
        name: 'Footwear Collection Timer',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: {
          type: 'collections',
          collectionIds: ['gid://shopify/Collection/999'],
        },
        priority: 5,
        appearance: { text: 'Footwear Sale' },
      },
      {
        _id: 'timer_prod',
        name: 'Running Shoes Specific Timer',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: {
          type: 'products',
          productIds: ['gid://shopify/Product/12345'],
        },
        priority: 0,
        appearance: { text: 'Shoes Sale' },
      },
    ];

    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue(candidateTimers);

    const resolved = await storefrontService.resolveTimerForStorefront(
      'demo.myshopify.com',
      'gid://shopify/Product/12345',
      ['gid://shopify/Collection/999'],
      now
    );

    expect(resolved).not.toBeNull();
    expect(resolved.id).toBe('timer_prod');
    expect(resolved.name).toBe('Running Shoes Specific Timer');
  });

  it('matches collection timer over storewide timer when product does not have direct product timer', async () => {
    const candidateTimers = [
      {
        _id: 'timer_all',
        name: 'Storewide Timer',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: { type: 'all' },
        priority: 100,
      },
      {
        _id: 'timer_col',
        name: 'Electronics Collection Timer',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: {
          type: 'collections',
          collectionIds: ['gid://shopify/Collection/777'],
        },
        priority: 1,
      },
    ];

    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue(candidateTimers);

    const resolved = await storefrontService.resolveTimerForStorefront(
      'demo.myshopify.com',
      'gid://shopify/Product/555',
      ['gid://shopify/Collection/777'],
      now
    );

    expect(resolved).not.toBeNull();
    expect(resolved.id).toBe('timer_col');
  });

  it('falls back to storewide timer when collection targeting does not match', async () => {
    const candidateTimers = [
      {
        _id: 'timer_all',
        name: 'Storewide Timer',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: { type: 'all' },
      },
      {
        _id: 'timer_col',
        name: 'Electronics Collection Timer',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: {
          type: 'collections',
          collectionIds: ['gid://shopify/Collection/777'],
        },
      },
    ];

    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue(candidateTimers);

    // Product is in collection 888, not 777
    const resolved = await storefrontService.resolveTimerForStorefront(
      'demo.myshopify.com',
      'gid://shopify/Product/555',
      ['gid://shopify/Collection/888'],
      now
    );

    expect(resolved).not.toBeNull();
    expect(resolved.id).toBe('timer_all');
  });

  it('filters out scheduled fixed timers whose start time is in the future', async () => {
    const candidateTimers = [
      {
        _id: 'future_timer',
        name: 'Cyber Monday (Not started yet)',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-10T00:00:00.000Z'),
        endAt: new Date('2026-11-15T00:00:00.000Z'),
        targeting: { type: 'all' },
      },
    ];

    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue(candidateTimers);

    const resolved = await storefrontService.resolveTimerForStorefront(
      'demo.myshopify.com',
      'gid://shopify/Product/555',
      [],
      now
    );

    expect(resolved).toBeNull();
  });

  it('filters out expired fixed timers whose end time is in the past', async () => {
    const candidateTimers = [
      {
        _id: 'past_timer',
        name: 'Summer Sale (Ended)',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-10-01T00:00:00.000Z'),
        endAt: new Date('2026-10-15T00:00:00.000Z'),
        targeting: { type: 'all' },
      },
    ];

    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue(candidateTimers);

    const resolved = await storefrontService.resolveTimerForStorefront(
      'demo.myshopify.com',
      'gid://shopify/Product/555',
      [],
      now
    );

    expect(resolved).toBeNull();
  });

  it('resolves deterministic tie-break using priority descending when multiple timers match', async () => {
    const candidateTimers = [
      {
        _id: 'timer_low_prio',
        name: 'Low Priority Storewide',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: { type: 'all' },
        priority: 1,
      },
      {
        _id: 'timer_high_prio',
        name: 'High Priority Storewide',
        type: 'fixed',
        status: 'active',
        startAt: new Date('2026-11-01T00:00:00.000Z'),
        endAt: new Date('2026-11-05T00:00:00.000Z'),
        targeting: { type: 'all' },
        priority: 10,
      },
    ];

    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue(candidateTimers);

    const resolved = await storefrontService.resolveTimerForStorefront(
      'demo.myshopify.com',
      'gid://shopify/Product/555',
      [],
      now
    );

    expect(resolved).not.toBeNull();
    expect(resolved.id).toBe('timer_high_prio');
  });

  it('returns null when no candidate timers exist for shop', async () => {
    vi.spyOn(timerRepository, 'findActiveTimersForStorefront').mockResolvedValue([]);

    const resolved = await storefrontService.resolveTimerForStorefront(
      'empty.myshopify.com',
      'gid://shopify/Product/1',
      [],
      now
    );

    expect(resolved).toBeNull();
  });
});
