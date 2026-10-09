import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes input data against NoSQL operator injection and prototype pollution.
 * Rejects or strips keys starting with '$' (e.g. $ne, $gt, $where, $regex)
 * and keys containing '.' which can manipulate nested queries.
 */
function containsMongoOperators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;

  if (Array.isArray(obj)) {
    return obj.some(containsMongoOperators);
  }

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object' && containsMongoOperators(val)) {
      return true;
    }
  }

  return false;
}

export function noSqlSanitizer(req: Request, res: Response, next: NextFunction): void {
  // Check req.body, req.query, and req.params for operator injection
  if (containsMongoOperators(req.body) || containsMongoOperators(req.query) || containsMongoOperators(req.params)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT_OPERATOR',
        message: 'Potentially malicious NoSQL query operators detected in request parameters.',
        requestId: (req as any).correlationId,
      },
    });
    return;
  }

  next();
}
