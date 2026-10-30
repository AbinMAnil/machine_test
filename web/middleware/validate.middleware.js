import { ZodError } from 'zod';

/**
 * Validate request body against a Zod schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: (err.issues || []).map((issue) => ({
            field: (issue.path || []).join('.'),
            message: issue.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          issues: (err.issues || []).map((issue) => ({
            field: (issue.path || []).join('.'),
            message: issue.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
}
