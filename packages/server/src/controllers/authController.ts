import type { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { config } from '../config'
import { redis } from '../config/database'
import { UserModel } from '../models/User'
import { generateToken } from '../middleware/auth'
import { successResponse, errorResponse } from '../types'
import { AppError } from '../middleware/errorHandler'
import type { WxLoginBody } from '../types'

interface WxSessionResponse {
  openid?: string
  session_key?: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

export class AuthController {
  static async wxLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body as WxLoginBody

      if (!code || typeof code !== 'string') {
        res.status(400).json(errorResponse('缺少微信 code 参数'))
        return
      }

      // 用 code 换取 openid + session_key
      const wxRes = await axios.get<WxSessionResponse>(config.wx.loginUrl, {
        params: {
          appid: config.wx.appid,
          secret: config.wx.secret,
          js_code: code,
          grant_type: 'authorization_code',
        },
        timeout: 5000,
      })

      const wxData = wxRes.data

      if (wxData.errcode) {
        throw new AppError(`微信登录失败: ${wxData.errmsg}`, 400)
      }

      const openid = wxData.openid
      if (!openid) {
        throw new AppError('获取 openid 失败', 500)
      }

      // 查找或创建用户
      let user = await UserModel.findByOpenid(openid)
      let isNew = false

      if (!user) {
        const userId = await UserModel.create({ openid })
        user = await UserModel.findById(userId)
        isNew = true
      }

      if (!user) {
        throw new AppError('用户数据异常', 500)
      }

      if (user.status === 'banned') {
        throw new AppError('账号已被封禁', 403)
      }

      // 生成 JWT
      const token = generateToken(user.id)

      // 缓存 session_key 到 Redis（7天）
      if (wxData.session_key) {
        await redis.setex(
          `wx_session:${user.id}`,
          config.redis.sessionTtl,
          wxData.session_key
        )
      }

      res.json(
        successResponse({
          token,
          userInfo: UserModel.toPublic(user),
          isNew,
        })
      )
    } catch (error) {
      next(error)
    }
  }

  // 管理员账号密码登录
  static async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        res.status(400).json(errorResponse('请输入用户名和密码'))
        return
      }

      // 简单验证：管理员用户名格式 admin + 密码验证
      // 生产环境应该从数据库验证，这里简化处理
      const adminUsers = [
        { id: 1, username: 'admin', password: 'admin123', nickname: '超级管理员', role: 'admin' },
        { id: 2, username: 'manager', password: 'manager123', nickname: '运营管理员', role: 'admin' }
      ]

      const user = adminUsers.find(u => u.username === username)
      
      if (!user || user.password !== password) {
        res.status(401).json(errorResponse('用户名或密码错误'))
        return
      }

      // 生成 JWT
      const token = generateToken(user.id)

      res.json(
        successResponse({
          token,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            role: user.role,
            avatar: ''
          }
        })
      )
    } catch (error) {
      next(error)
    }
  }

  // 获取管理员信息
  static async getAdminInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      
      const adminUsers: Record<number, { id: number; username: string; nickname: string; role: string; avatar: string }> = {
        1: { id: 1, username: 'admin', nickname: '超级管理员', role: 'admin', avatar: '' },
        2: { id: 2, username: 'manager', nickname: '运营管理员', role: 'admin', avatar: '' }
      }

      const user = adminUsers[userId]
      if (!user) {
        res.status(404).json(errorResponse('用户不存在'))
        return
      }

      res.json(successResponse(user))
    } catch (error) {
      next(error)
    }
  }
}
