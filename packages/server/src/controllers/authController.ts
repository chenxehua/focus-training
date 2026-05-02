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
}
