/**
 * Session verification and tenant isolation helper
 */

export function requireAuthenticatedShop(req, res, next) {
  // Allow test shop simulation in automated test environment only
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-shop']) {
    req.shop = String(req.headers['x-test-shop']);
    return next();
  }

  const session = res.locals?.shopify?.session;

  if (!session || !session.shop) {
    return res.status(401).json({
      error: 'Unauthorized: Valid Shopify session is required',
    });
  }

  // Bind verified shop domain to request context
  req.shop = session.shop;
  next();
}
