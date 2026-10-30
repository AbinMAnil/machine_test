import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../web/index.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';
import { Timer } from '../../web/models/timer.model.js';
import { Analytics } from '../../web/models/analytics.model.js';

describe('Storefront Public API Endpoints', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  const shop = 'storefront-demo.myshopify.com';
  const productId = 'gid://shopify/Product/987654321';

  it('returns active timer configuration for storefront requests', async () => {
    const timer = await Timer.create({
      shop,
      name: 'Summer Flash Deal',
      type: 'fixed',
      status: 'active',
      startAt: new Date(Date.now() - 3600 * 1000), // Started 1 hour ago
      endAt: new Date(Date.now() + 86400 * 1000), // Ends tomorrow
      targeting: {
        type: 'products',
        productIds: [productId],
      },
      appearance: {
        text: 'Limited stock! Ends in {time}',
        backgroundColor: '#ef4444',
        textColor: '#ffffff',
        position: 'above_buy_button',
        urgencyThresholdSeconds: 7200,
      },
      priority: 10,
    });

    const res = await request(app)
      .get(`/api/storefront/timer?shop=${shop}&productId=${encodeURIComponent(productId)}`)
      .expect(200);

    expect(res.headers['cache-control']).toBeDefined();
    expect(res.body.timer).not.toBeNull();
    expect(res.body.timer.id).toBe(String(timer._id));
    expect(res.body.timer.name).toBe('Summer Flash Deal');
    expect(res.body.timer.appearance.backgroundColor).toBe('#ef4444');
    expect(res.body.timer.appearance.text).toBe('Limited stock! Ends in {time}');

    // Verify sensitive data is NOT exposed
    expect(res.body.timer.shop).toBeUndefined();
    expect(res.body.timer.targeting).toBeUndefined();
  });

  it('returns null timer when no active timer matches the product context', async () => {
    const res = await request(app)
      .get(`/api/storefront/timer?shop=${shop}&productId=gid://shopify/Product/999999999`)
      .expect(200);

    expect(res.body.timer).toBeNull();
  });

  it('returns 400 Bad Request when shop parameter is missing or invalid', async () => {
    const res = await request(app)
      .get('/api/storefront/timer')
      .expect(400);

    expect(res.body.error).toContain('Invalid query parameters');
  });

  it('records impression atomically and deduplicates daily impressions', async () => {
    const timer = await Timer.create({
      shop,
      name: 'Evergreen Promotion',
      type: 'evergreen',
      status: 'active',
      evergreenDurationSeconds: 7200,
      targeting: { type: 'all' },
      appearance: { text: 'Sale ends in {time}' },
    });

    // First impression
    const imp1 = await request(app)
      .post('/api/storefront/impression')
      .send({ shop, timerId: String(timer._id) })
      .expect(200);

    expect(imp1.body.success).toBe(true);

    // Second impression
    const imp2 = await request(app)
      .post('/api/storefront/impression')
      .send({ shop, timerId: String(timer._id) })
      .expect(200);

    expect(imp2.body.success).toBe(true);

    // Verify in database: atomic count should be 2
    const today = new Date().toISOString().split('T')[0];
    const record = await Analytics.findOne({ shop, timerId: timer._id, date: today });
    expect(record).not.toBeNull();
    expect(record.impressions).toBe(2);
  });

  it('returns 404 when reporting impression for non-existent timer', async () => {
    const nonExistentId = '654321098765432109876543';
    const res = await request(app)
      .post('/api/storefront/impression')
      .send({ shop, timerId: nonExistentId })
      .expect(404);

    expect(res.body.error).toContain('Timer not found');
  });

  it('returns 400 when impression payload has invalid format', async () => {
    const res = await request(app)
      .post('/api/storefront/impression')
      .send({ shop, timerId: 'invalid-id' })
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
  });
});
