import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import type { AuthRequest, JwtPayload } from '../types'
import { errorResponse } from '../types'
import { queryOne } from '../config/database'

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('未授权，请先登录', 401))
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.userId = payload.userId
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('登录已过期，请重新登录', 401))
    } else {
      res.status(401).json(errorResponse('无效的登录凭证', 401))
    }
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions)
}

// 管理员权限验证中间件
export async function adminAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('未授权，请先登录', 401))
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.userId = payload.userId

    // 验证用户是否是管理员
    const userSql = 'SELECT role FROM user WHERE id = ?'
    const user = await queryOne<{ role: string }>(userSql, [payload.userId])

    if (!user) {
      res.status(401).json(errorResponse('用户不存在', 401))
      return
    }

    if (user.role !== 'admin') {
      res.status(403).json(errorResponse('权限不足，需要管理员权限', 403))
      return
    }

    req.userRole = user.role
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('登录已过期，请重新登录', 401))
    } else {
      res.status(401).json(errorResponse('无效的登录凭证', 401))
    }
  }
}
