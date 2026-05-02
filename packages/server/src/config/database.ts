import mysql from 'mysql2/promise'
import Redis from 'ioredis'
import { config } from './index'

// ============================================================
// MySQL 连接池
// ============================================================
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+08:00',
})

export async function testDbConnection(): Promise<void> {
  const conn = await pool.getConnection()
  await conn.query('SELECT 1')
  conn.release()
  console.log('✅ MySQL connected')
}

// ============================================================
// Redis 客户端
// ============================================================
export const redis = new Redis(config.redis.url, {
  retryStrategy(times) {
    if (times > 5) {
      console.error('Redis connection failed after 5 retries')
      return null
    }
    return Math.min(times * 200, 2000)
  },
  lazyConnect: true,
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', (err) => console.error('Redis error:', err))

export async function testRedisConnection(): Promise<void> {
  await redis.connect()
  await redis.ping()
  console.log('✅ Redis ping ok')
}

// ============================================================
// 辅助查询函数
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryValues = any[]

export async function query<T = Record<string, unknown>>(
  sql: string,
  values?: QueryValues
): Promise<T[]> {
  const [rows] = await pool.execute(sql, values)
  return rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  values?: QueryValues
): Promise<T | null> {
  const rows = await query<T>(sql, values)
  return rows[0] ?? null
}

export async function execute(
  sql: string,
  values?: QueryValues
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, values)
  return result as mysql.ResultSetHeader
}
