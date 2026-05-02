import type { Response, NextFunction } from 'express'
import { query, queryOne } from '../config/database'
import { ChildModel } from '../models/Child'
import { TrainingRecordModel } from '../models/TrainingRecord'
import { successResponse, errorResponse } from '../types'
import { AppError } from '../middleware/errorHandler'
import type { AuthRequest, SubmitRecordBody, DbGame } from '../types'

export class GameController {
  static async getGameList(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const games = await query<DbGame>(
        "SELECT * FROM game WHERE status = 'active' ORDER BY id ASC"
      )
      res.json(
        successResponse(
          games.map(g => ({
            id: g.id,
            gameCode: g.game_code,
            gameName: g.game_name,
            gameType: g.game_type,
            iconUrl: g.icon_url,
            difficultyLevels: g.difficulty_levels,
            targetAgeGroup: g.target_age_group,
            description: g.description,
            isFree: g.is_free,
          }))
        )
      )
    } catch (error) {
      next(error)
    }
  }

  static async getGameDetail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gameId = parseInt(req.params['gameId'] ?? '0', 10)
      const game = await queryOne<DbGame>('SELECT * FROM game WHERE id = ?', [gameId])

      if (!game) {
        res.status(404).json(errorResponse('游戏不存在'))
        return
      }

      res.json(successResponse(game))
    } catch (error) {
      next(error)
    }
  }

  static async submitRecord(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const {
        childId,
        gameId,
        durationSeconds,
        accuracy,
        score,
        focusScore,
        difficultyLevel,
        gameConfig,
        resultData,
      } = req.body as SubmitRecordBody

      // 校验孩子归属
      const isOwned = await ChildModel.isOwnedByUser(childId, userId)
      if (!isOwned) {
        throw new AppError('无权操作该孩子记录', 403)
      }

      // 校验游戏存在
      const game = await queryOne<DbGame>('SELECT * FROM game WHERE id = ?', [gameId])
      if (!game) {
        throw new AppError('游戏不存在')
      }

      // 参数校验
      if (durationSeconds < 1 || durationSeconds > 7200) {
        throw new AppError('训练时长参数异常')
      }
      if (accuracy < 0 || accuracy > 100) {
        throw new AppError('准确率参数异常')
      }
      if (score < 0 || focusScore < 0 || focusScore > 100) {
        throw new AppError('分数参数异常')
      }

      const recordId = await TrainingRecordModel.create({
        childId,
        gameId,
        durationSeconds,
        accuracy,
        score,
        focusScore,
        difficultyLevel,
        gameConfig,
        resultData,
      })

      // 增加经验值（按专注分计算）
      const expGain = Math.round(focusScore / 10)
      if (expGain > 0) {
        await ChildModel.addExperience(childId, expGain)
      }

      // 返回完整记录
      const records = await TrainingRecordModel.findByChildId(childId, { page: 1, pageSize: 1 })
      const record = records.list.find(r => r.id === recordId)

      res.status(201).json(
        successResponse(record ? TrainingRecordModel.toPublic(record) : { id: recordId })
      )
    } catch (error) {
      next(error)
    }
  }

  static async getRecords(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const childId = parseInt((req.query['childId'] as string) ?? '0', 10)
      const page = parseInt((req.query['page'] as string) ?? '1', 10)
      const pageSize = parseInt((req.query['pageSize'] as string) ?? '20', 10)
      const gameCode = req.query['gameCode'] as string | undefined

      if (!childId) {
        res.status(400).json(errorResponse('缺少 childId 参数'))
        return
      }

      const isOwned = await ChildModel.isOwnedByUser(childId, userId)
      if (!isOwned) {
        throw new AppError('无权查看该孩子记录', 403)
      }

      const { list, total } = await TrainingRecordModel.findByChildId(childId, {
        page,
        pageSize: Math.min(pageSize, 100),
        gameCode,
      })

      res.json(
        successResponse({
          list: list.map(TrainingRecordModel.toPublic),
          total,
          page,
          pageSize,
        })
      )
    } catch (error) {
      next(error)
    }
  }
}
