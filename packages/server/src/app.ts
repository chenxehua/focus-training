import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { config } from './config'
import { apiLimiter } from './middleware/rateLimit'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import router from './routes'

const app = express()

// ============================================================
// 安全中间件
// ============================================================
app.use(helmet())

app.use(
  cors({
    origin: config.isDev ? '*' : ['https://servicewechat.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
)

// ============================================================
// 请求解析与压缩
// ============================================================
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(compression())

// ============================================================
// 日志
// ============================================================
app.use(morgan(config.isDev ? 'dev' : 'combined'))

// ============================================================
// 全局限流
// ============================================================
app.use('/api', apiLimiter)

// ============================================================
// 路由
// ============================================================
app.use('/api', router)

// ============================================================
// 错误处理
// ============================================================
app.use(notFoundHandler)
app.use(errorHandler)

export default app
