import { Router } from 'express'
import authRouter from './auth'
import userRouter from './user'
import gameRouter from './game'
import reportRouter from './report'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/game', gameRouter)
router.use('/report', reportRouter)

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router
