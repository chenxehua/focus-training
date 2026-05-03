import { Router } from 'express'
import authRouter from './auth'
import userRouter from './user'
import gameRouter from './game'
import reportRouter from './report'
import achievementRouter from './achievement'
import membershipRouter from './membership'
import assessmentRouter from './assessment'
import recommendationRouter from './recommendation'
import academyRouter from './academy'
import schoolRouter from './school'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/game', gameRouter)
router.use('/report', reportRouter)
router.use('/achievement', achievementRouter)
router.use('/membership', membershipRouter)
router.use('/assessment', assessmentRouter)
router.use('/recommendation', recommendationRouter)
router.use('/academy', academyRouter)
router.use('/school', schoolRouter)

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router
