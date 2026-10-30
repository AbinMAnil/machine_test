import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../web/index.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';
import { analyticsRepository } from '../../web/repositories/analytics.repository.js';

describe('Admin Timers API & Multi-Tenant Isolation', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  const shopA = 'store-alpha.myshopify.com';
  const shopB = 'store-beta.myshopify.com';

  const fixedTimerPayload = {
    name: 'Holiday Flash Sale',
    type: 'fixed',
    status: 'active',
    startAt: '2026-11-01T00:00:00.000Z',
    endAt: '2026-11-10T00:00:00.000Z',
    targeting: { type: 'all' },
    appearance: {
      text: 'Sale ends in {time}!',
      backgroundColor: '#111827',
      textColor: '#ffffff',
      position: 'above_buy_button',
      urgencyThresholdSeconds: 3600,
    },
    priority: 5,
  };

  const evergreenTimerPayload = {
    name: 'Welcome Evergreen Countdown',
    type: 'evergreen',
    status: 'active',
    evergreenDurationSeconds: 1800, // 30 minutes
    targeting: {
      type: 'products',
      productIds: ['gid://shopify/Product/123456'],
    },
    appearance: {
      text: 'Offer expires in {time}',
      backgroundColor: '#0f172a',
      textColor: '#38bdf8',
      position: 'top_of_page',
      urgencyThresholdSeconds: 300,
    },
    priority: 1,
  };

  it('creates fixed and evergreen timers successfully for an authenticated shop', async () => {
    // 1. Create fixed timer
    const resFixed = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopA)
      .send(fixedTimerPayload)
      .expect(201);

    expect(resFixed.body.timer).toBeDefined();
    expect(resFixed.body.timer.name).toBe('Holiday Flash Sale');
    expect(resFixed.body.timer.type).toBe('fixed');
    expect(resFixed.body.timer.shop).toBe(shopA);
    expect(resFixed.body.timer.id).toBeDefined();

    // 2. Create evergreen timer
    const resEvergreen = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopA)
      .send(evergreenTimerPayload)
      .expect(201);

    expect(resEvergreen.body.timer.name).toBe('Welcome Evergreen Countdown');
    expect(resEvergreen.body.timer.evergreenDurationSeconds).toBe(1800);
  });

  it('strictly enforces multi-tenant isolation across different shops', async () => {
    // 1. Shop A creates a timer
    const resA = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopA)
      .send(fixedTimerPayload)
      .expect(201);

    const timerAId = resA.body.timer.id;

    // 2. Shop B creates its own timer
    const resB = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopB)
      .send(evergreenTimerPayload)
      .expect(201);

    const timerBId = resB.body.timer.id;

    // 3. Shop A lists timers -> only sees Timer A
    const listA = await request(app)
      .get('/api/timers')
      .set('x-test-shop', shopA)
      .expect(200);

    expect(listA.body.timers).toHaveLength(1);
    expect(listA.body.timers[0].id).toBe(timerAId);

    // 4. Shop B lists timers -> only sees Timer B
    const listB = await request(app)
      .get('/api/timers')
      .set('x-test-shop', shopB)
      .expect(200);

    expect(listB.body.timers).toHaveLength(1);
    expect(listB.body.timers[0].id).toBe(timerBId);

    // 5. Cross-tenant retrieval: Shop B cannot GET Shop A's timer
    await request(app)
      .get(`/api/timers/${timerAId}`)
      .set('x-test-shop', shopB)
      .expect(404);

    // 6. Cross-tenant modification: Shop B cannot PUT Shop A's timer
    await request(app)
      .put(`/api/timers/${timerAId}`)
      .set('x-test-shop', shopB)
      .send({ ...fixedTimerPayload, name: 'Hacked Name' })
      .expect(404);

    // 7. Cross-tenant status change: Shop B cannot PATCH Shop A's timer
    await request(app)
      .patch(`/api/timers/${timerAId}/status`)
      .set('x-test-shop', shopB)
      .send({ status: 'paused' })
      .expect(404);

    // 8. Cross-tenant deletion: Shop B cannot DELETE Shop A's timer
    await request(app)
      .delete(`/api/timers/${timerAId}`)
      .set('x-test-shop', shopB)
      .expect(404);

    // 9. Verify Timer A is completely intact and unaffected in Shop A
    const verifyA = await request(app)
      .get(`/api/timers/${timerAId}`)
      .set('x-test-shop', shopA)
      .expect(200);

    expect(verifyA.body.timer.name).toBe('Holiday Flash Sale');
    expect(verifyA.body.timer.status).toBe('active');
  });

  it('handles updates and status toggling correctly', async () => {
    const createRes = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopA)
      .send(fixedTimerPayload)
      .expect(201);

    const timerId = createRes.body.timer.id;

    // Pause timer
    const patchRes = await request(app)
      .patch(`/api/timers/${timerId}/status`)
      .set('x-test-shop', shopA)
      .send({ status: 'paused' })
      .expect(200);

    expect(patchRes.body.timer.status).toBe('paused');
    expect(patchRes.body.timer.effectiveStatus).toBe('paused');

    // Update timer name and appearance
    const updateRes = await request(app)
      .put(`/api/timers/${timerId}`)
      .set('x-test-shop', shopA)
      .send({
        ...fixedTimerPayload,
        name: 'Cyber Monday Deals',
        appearance: {
          ...fixedTimerPayload.appearance,
          backgroundColor: '#ff0000',
        },
      })
      .expect(200);

    expect(updateRes.body.timer.name).toBe('Cyber Monday Deals');
    expect(updateRes.body.timer.appearance.backgroundColor).toBe('#ff0000');

    // Delete timer
    await request(app)
      .delete(`/api/timers/${timerId}`)
      .set('x-test-shop', shopA)
      .expect(200);

    // Verify deletion
    await request(app)
      .get(`/api/timers/${timerId}`)
      .set('x-test-shop', shopA)
      .expect(404);
  });

  it('returns aggregated analytics for the authenticated shop', async () => {
    // Create 2 timers for Shop A
    const t1 = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopA)
      .send(fixedTimerPayload);

    const t2 = await request(app)
      .post('/api/timers')
      .set('x-test-shop', shopA)
      .send(evergreenTimerPayload);

    // Simulate impressions
    await analyticsRepository.incrementImpression(shopA, t1.body.timer.id, '2026-11-01');
    await analyticsRepository.incrementImpression(shopA, t1.body.timer.id, '2026-11-01');
    await analyticsRepository.incrementImpression(shopA, t2.body.timer.id, '2026-11-01');

    const res = await request(app)
      .get('/api/analytics')
      .set('x-test-shop', shopA)
      .expect(200);

    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalTimers).toBe(2);
    expect(res.body.summary.totalImpressions).toBe(3);
    expect(res.body.timerBreakdown).toHaveLength(2);
  });
});
