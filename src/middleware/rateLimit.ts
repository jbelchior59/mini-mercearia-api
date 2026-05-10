import rateLimit from 'express-rate-limit';

const genericRateLimitResponse = { error: 'Demasiadas tentativas. Tenta novamente mais tarde.' };

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: genericRateLimitResponse,
});

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: genericRateLimitResponse,
});
