import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

export const config = {
  port: parseInt(getEnv('PORT', '3003'), 10),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isDev: getEnv('NODE_ENV', 'development') === 'development',

  db: {
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '3306'), 10),
    user: getEnv('DB_USER', 'root'),
    password: getEnv('DB_PASSWORD', ''),
    name: getEnv('DB_NAME', 'focus_training'),
    connectionLimit: 10,
  },

  redis: {
    url: getEnv('REDIS_URL', 'redis://localhost:6379'),
    sessionTtl: 7 * 24 * 3600, // 7 days in seconds
  },

  jwt: {
    secret: getEnv('JWT_SECRET', 'fallback_dev_secret_change_in_production'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  },

  wx: {
    appid: getEnv('WX_APPID', ''),
    secret: getEnv('WX_SECRET', ''),
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
  },
}
