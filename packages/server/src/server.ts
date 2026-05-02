import { config } from './config'
import { testDbConnection, testRedisConnection } from './config/database'
import app from './app'

async function bootstrap() {
  try {
    // 测试数据库连接
    await testDbConnection()
    await testRedisConnection()

    // 启动服务器
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`)
      console.log(`   Health: http://localhost:${config.port}/api/health`)
    })

    // 优雅退出
    const gracefulShutdown = (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`)
      server.close(() => {
        console.log('HTTP server closed')
        process.exit(0)
      })

      // 强制退出
      setTimeout(() => {
        console.error('Forced shutdown')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

bootstrap()
