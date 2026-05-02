import rateLimit from 'express-rate-limit'

// 通用 API 限流：每 15 分钟 200 次
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
})

// 登录接口限流：每 15 分钟 20 次
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { code: 429, message: '登录请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

// 游戏记录提交限流：每分钟 30 次
export const recordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { code: 429, message: '提交过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
})
