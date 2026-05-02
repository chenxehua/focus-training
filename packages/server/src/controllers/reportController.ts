import type { Response, NextFunction } from 'express'
import { ChildModel } from '../models/Child'
import { TrainingRecordModel } from '../models/TrainingRecord'
import { FocusReportModel } from '../models/FocusReport'
import { successResponse, errorResponse } from '../types'
import { AppError } from '../middleware/errorHandler'
import type { AuthRequest } from '../types'

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as week start
  d.setDate(diff)
  return d.toISOString().split('T')[0] as string
}

function formatDateYMD(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

function buildWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const start = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(formatDateYMD(d))
  }
  return dates
}

export class ReportController {
  static async getTodayData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const childId = parseInt(req.params['childId'] ?? '0', 10)

      const isOwned = await ChildModel.isOwnedByUser(childId, userId)
      if (!isOwned) {
        throw new AppError('无权查看该孩子数据', 403)
      }

      const [records, streak, totalCount] = await Promise.all([
        TrainingRecordModel.findTodayByChildId(childId),
        TrainingRecordModel.getStreak(childId),
        TrainingRecordModel.getTotalCount(childId),
      ])

      const totalDuration = records.reduce((sum, r) => sum + r.duration_seconds, 0)
      const avgFocusScore =
        records.length > 0
          ? Math.round(records.reduce((sum, r) => sum + r.focus_score, 0) / records.length)
          : 0

      res.json(
        successResponse({
          records: records.map(TrainingRecordModel.toPublic),
          currentStreak: streak,
          totalTrainingCount: totalCount,
          totalDuration,
          avgFocusScore,
        })
      )
    } catch (error) {
      next(error)
    }
  }

  static async getWeeklyReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const childId = parseInt(req.params['childId'] ?? '0', 10)

      const isOwned = await ChildModel.isOwnedByUser(childId, userId)
      if (!isOwned) {
        throw new AppError('无权查看该孩子报告', 403)
      }

      const weekStart = getWeekStart(new Date())
      const weekDates = buildWeekDates(weekStart)

      const [dailyStats, gameBreakdown] = await Promise.all([
        FocusReportModel.getWeeklyStats(childId, weekStart),
        FocusReportModel.getGameBreakdownForWeek(childId, weekStart),
      ])

      // 构建趋势数据（补全没有训练的天）
      const statsMap = new Map(dailyStats.map(d => [d.date, d]))

      const trendData = weekDates.map(date => {
        const stat = statsMap.get(date)
        return {
          date,
          trainingCount: stat?.training_count ?? 0,
          duration: stat?.total_duration ?? 0,
          focusScore: stat?.avg_focus_score ?? 0,
        }
      })

      const totalTrainingCount = dailyStats.reduce((s, d) => s + d.training_count, 0)
      const totalDuration = dailyStats.reduce((s, d) => s + d.total_duration, 0)
      const avgFocusScore =
        dailyStats.length > 0
          ? Math.round(dailyStats.reduce((s, d) => s + d.avg_focus_score, 0) / dailyStats.length)
          : 0

      // 生成亮点
      const highlights: Array<{ type: string; title: string; description: string; value: number }> =
        []

      if (totalTrainingCount >= 7) {
        highlights.push({
          type: 'consistency',
          title: '训练达人',
          description: `本周完成了 ${totalTrainingCount} 次训练`,
          value: totalTrainingCount,
        })
      }
      if (avgFocusScore >= 80) {
        highlights.push({
          type: 'focus',
          title: '超级专注',
          description: `本周平均专注分达到 ${avgFocusScore} 分`,
          value: avgFocusScore,
        })
      }
      if (totalDuration >= 3600) {
        highlights.push({
          type: 'duration',
          title: '训练时长',
          description: `本周累计训练超过 ${Math.floor(totalDuration / 3600)} 小时`,
          value: totalDuration,
        })
      }

      res.json(
        successResponse({
          childId,
          reportDate: weekStart,
          trainingCount: totalTrainingCount,
          totalDuration,
          avgFocusScore,
          trendData,
          highlights,
          gameBreakdown: gameBreakdown.map(g => ({
            gameCode: g.game_code,
            gameName: g.game_name,
            count: g.count,
            avgScore: g.avg_score,
          })),
        })
      )
    } catch (error) {
      next(error)
    }
  }
}
