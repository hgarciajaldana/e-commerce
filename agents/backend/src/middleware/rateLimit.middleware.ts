import rateLimit from "express-rate-limit";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);

const rateLimitResponse = (msg: string) => ({
  error: { code: "RATE_LIMIT", message: msg },
});

export const storeLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_STORE_MAX ?? "120", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("Demasiadas solicitudes. Intenta más tarde."),
});

export const adminLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX ?? "60", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("Demasiadas solicitudes. Intenta más tarde."),
});

export const checkoutLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_CHECKOUT_MAX ?? "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("Demasiadas solicitudes de checkout. Intenta más tarde."),
});
