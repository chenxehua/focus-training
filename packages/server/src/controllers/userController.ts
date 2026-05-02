import type { Response, NextFunction } from 'express'
import { UserModel } from '../models/User'
import { ChildModel } from '../models/Child'
import { successResponse, errorResponse } from '../types'
import { AppError } from '../middleware/errorHandler'
import type { AuthRequest, AddChildBody, UpdateUserBody } from '../types'

export class UserController {
  static async getInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const user = await UserModel.findById(userId)

      if (!user) {
        res.status(404).json(errorResponse('用户不存在'))
        return
      }

      res.json(successResponse(UserModel.toPublic(user)))
    } catch (error) {
      next(error)
    }
  }

  static async updateInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { nickname, avatar, phone } = req.body as UpdateUserBody

      await UserModel.update(userId, { nickname, avatar, phone })
      const user = await UserModel.findById(userId)

      res.json(successResponse(UserModel.toPublic(user!)))
    } catch (error) {
      next(error)
    }
  }

  static async addChild(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { name, age, gender, ageGroup } = req.body as AddChildBody

      if (!name || !name.trim()) {
        throw new AppError('孩子姓名不能为空')
      }
      if (!age || age < 4 || age > 12) {
        throw new AppError('年龄需在 4-12 岁之间')
      }
      if (!['male', 'female'].includes(gender)) {
        throw new AppError('性别参数错误')
      }
      if (!['4-6', '7-9', '10-12'].includes(ageGroup)) {
        throw new AppError('年龄段参数错误')
      }

      const childId = await ChildModel.create(userId, { name: name.trim(), age, gender, ageGroup })
      const child = await ChildModel.findById(childId)

      res.status(201).json(successResponse(ChildModel.toPublic(child!)))
    } catch (error) {
      next(error)
    }
  }

  static async getChildren(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const children = await ChildModel.findByUserId(userId)
      res.json(successResponse(children.map(ChildModel.toPublic)))
    } catch (error) {
      next(error)
    }
  }

  static async updateChild(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const childId = parseInt(req.params['childId'] ?? '0', 10)

      const isOwned = await ChildModel.isOwnedByUser(childId, userId)
      if (!isOwned) {
        throw new AppError('无权操作该孩子信息', 403)
      }

      const { name, age, gender } = req.body as Partial<AddChildBody>
      await ChildModel.update(childId, { name, age, gender })
      const child = await ChildModel.findById(childId)

      res.json(successResponse(ChildModel.toPublic(child!)))
    } catch (error) {
      next(error)
    }
  }
}
