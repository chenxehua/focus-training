/**
 * 初次测评系统控制器
 * 
 * 功能：
 * - 测评状态管理
 * - 问卷获取与提交
 * - 游戏测评与结果
 * - 报告生成
 * - 百分位计算
 */

import { Request, Response } from 'express'
import { query, queryOne, execute } from '../config/database'
import { RowDataPacket } from 'mysql2'

interface AuthRequest extends Request {
  userId?: number
}

// 年龄组分组的辅助函数
function getAgeGroup(age: number): string {
  if (age >= 4 && age <= 5) return '4-5'
  if (age >= 6 && age <= 7) return '6-7'
  if (age >= 8 && age <= 9) return '8-9'
  return '10-12'
}

// 百分位计算函数
function calculatePercentile(score: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 50
  const zScore = (score - mean) / stdDev
  
  // 标准正态分布累积分布函数近似
  let percentile = 0
  if (zScore < -2) percentile = 0
  else if (zScore > 2) percentile = 100
  else {
    // 使用近似公式
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore))
    const d = 0.3989423 * Math.exp(-zScore * zScore / 2)
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    percentile = zScore > 0 ? Math.round((1 - p) * 100) : Math.round(p * 100)
  }
  return Math.max(0, Math.min(100, percentile))
}

// 评级获取函数
function getRating(percentile: number): { rating: string; label: string; color: string } {
  if (percentile >= 90) return { rating: 'excellent', label: '超越卓越', color: 'gold' }
  if (percentile >= 70) return { rating: 'good', label: '良好发展', color: 'green' }
  if (percentile >= 30) return { rating: 'normal', label: '普通范围', color: 'blue' }
  if (percentile >= 10) return { rating: 'concern', label: '需要关注', color: 'orange' }
  return { rating: 'severe', label: '建议专业评估', color: 'red' }
}

// 维度权重配置
const DIMENSION_WEIGHTS: { [key: string]: number } = {
  'sustained_attention': 1.2,    // 持续注意力权重稍高
  'selective_attention': 1.1,
  'divided_attention': 1.0,
  'attention_shifting': 1.0,
  'working_memory': 1.15,        // 工作记忆权重较高
  'impulse_control': 1.0,
  'reaction_speed': 0.95
}

export class InitialAssessmentController {
  /**
   * 获取儿童测评状态
   * GET /api/assessment/status/:childId
   */
  static async getStatus(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      // 获取最新的测评记录
      const assessment = await queryOne<RowDataPacket>(
        `SELECT id, assessment_no, status, current_stage, started_at, completed_at,
                estimated_duration, actual_duration
         FROM assessment 
         WHERE child_id = ? AND assessment_type = 'initial'
         ORDER BY created_at DESC LIMIT 1`,
        [childId]
      )

      // 获取问卷答案数量
      let questionnaireCompleted = false
      let questionnaireAnswers = 0
      if (assessment) {
        const answers = await queryOne<RowDataPacket>(
          `SELECT COUNT(*) as count FROM assessment_questionnaire_answer WHERE assessment_id = ?`,
          [assessment.id]
        )
        questionnaireAnswers = answers?.count || 0
        
        // 检查问卷是否完成（需要完成该年龄组的全部题目）
        const childInfo = await queryOne<RowDataPacket>(
          `SELECT age, age_group FROM child WHERE id = ?`,
          [childId]
        )
        // 转换 age_group 格式: 4-6 -> 4-5, 7-9 -> 6-7, 10-12 -> 8-9 或 10-12
        let ageGroupValue = '8-9'
        if (childInfo?.age_group) {
          switch (childInfo.age_group) {
            case '4-6': ageGroupValue = '4-5'; break
            case '7-9': ageGroupValue = '6-7'; break
            case '10-12': ageGroupValue = '8-9'; break
            default: ageGroupValue = '10-12'
          }
        } else if (childInfo?.age) {
          ageGroupValue = getAgeGroup(childInfo.age)
        }
        const ageGroup = ageGroupValue
        const requiredQuestions = ageGroup === '4-5' ? 14 : ageGroup === '6-7' ? 17 : ageGroup === '8-9' ? 19 : 21
        questionnaireCompleted = questionnaireAnswers >= requiredQuestions
      }

      // 获取游戏结果数量
      let gamesCompleted = 0
      let gamesCount = 0
      if (assessment) {
        const games = await query<RowDataPacket>(
          `SELECT COUNT(*) as count FROM assessment_game_result WHERE assessment_id = ? AND completed = 1`,
          [assessment.id]
        )
        gamesCompleted = games[0]?.count || 0
        
        // 获取该年龄组需要的游戏数量
        const childAge = await queryOne<RowDataPacket>(
          `SELECT age FROM child WHERE id = ?`,
          [childId]
        )
        const ageGroup = getAgeGroup(childAge?.age || 8)
        gamesCount = ageGroup === '4-5' ? 3 : 3 // 所有年龄组都是3款游戏
      }

      // 检查报告是否生成
      let reportGenerated = false
      if (assessment) {
        const report = await queryOne<RowDataPacket>(
          `SELECT id FROM assessment_report WHERE assessment_id = ?`,
          [assessment.id]
        )
        reportGenerated = !!report
      }

      // 计算完成率
      let completionRate = 0
      let hasCompletedInitial = false

      if (assessment && assessment.status === 'completed') {
        hasCompletedInitial = true
        completionRate = 100
      } else if (assessment) {
        const totalSteps = 3 // 问卷、游戏、报告
        let completedSteps = 0
        if (questionnaireCompleted) completedSteps++
        if (gamesCompleted >= gamesCount) completedSteps++
        if (reportGenerated) completedSteps++
        completionRate = Math.round((completedSteps / totalSteps) * 100)
      }

      // 确定下一步
      let nextStep: string | null = null
      if (!assessment) {
        nextStep = 'questionnaire'
      } else if (!questionnaireCompleted) {
        nextStep = 'questionnaire'
      } else if (gamesCompleted < gamesCount) {
        nextStep = 'games'
      } else if (!reportGenerated) {
        nextStep = 'report'
      }

      res.json({
        success: true,
        data: {
          childId,
          hasCompletedInitial,
          lastAssessmentDate: assessment?.completed_at || null,
          completionRate,
          stages: {
            questionnaire: {
              completed: questionnaireCompleted,
              answers: questionnaireAnswers
            },
            gameTesting: {
              completed: gamesCompleted >= gamesCount,
              completedGames: gamesCompleted,
              totalGames: gamesCount
            },
            report: {
              generated: reportGenerated
            }
          },
          nextStep,
          currentStage: assessment?.current_stage || null,
          assessmentId: assessment?.id || null
        }
      })
    } catch (error) {
      console.error('获取测评状态失败:', error)
      res.status(500).json({
        success: false,
        message: '获取测评状态失败'
      })
    }
  }

  /**
   * 开始新测评
   * POST /api/assessment/start
   */
  static async startAssessment(req: AuthRequest, res: Response) {
    try {
      const { childId, type = 'initial' } = req.body

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      // 获取儿童信息
      const child = await queryOne<RowDataPacket>(
        `SELECT id, name, age, age_group FROM child WHERE id = ?`,
        [childId]
      )

      if (!child) {
        return res.status(404).json({
          success: false,
          message: '儿童不存在'
        })
      }

      // 检查是否已有进行中的测评
      const existing = await queryOne<RowDataPacket>(
        `SELECT id FROM assessment WHERE child_id = ? AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1`,
        [childId]
      )

      if (existing) {
        // 返回现有的测评
        return res.json({
          success: true,
          data: {
            assessmentId: existing.id,
            childInfo: {
              name: child.name,
              age: child.age,
              ageGroup: child.age_group || getAgeGroup(child.age)
            },
            estimatedDuration: 15,
            totalSteps: 3,
            consentRequired: true,
            isExisting: true
          }
        })
      }

      // 生成测评编号
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const seqResult = await queryOne<RowDataPacket>(
        `SELECT COUNT(*) + 1 as seq FROM assessment WHERE DATE(created_at) = CURDATE()`
      )
      const assessmentNo = `ASM${dateStr}${String(seqResult?.seq || 1).padStart(4, '0')}`

      // 估算时长（根据年龄组）
      const ageGroup = child.age_group || getAgeGroup(child.age)
      const estimatedDuration = ageGroup === '4-5' ? 10 : ageGroup === '6-7' ? 15 : 20

      // 创建新测评记录
      const result = await execute(
        `INSERT INTO assessment (assessment_no, child_id, assessment_type, status, current_stage, started_at, estimated_duration)
         VALUES (?, ?, ?, 'in_progress', 'questionnaire', NOW(), ?)`,
        [assessmentNo, childId, type, estimatedDuration]
      )

      res.json({
        success: true,
        data: {
          assessmentId: result.insertId,
          assessmentNo,
          childInfo: {
            name: child.name,
            age: child.age,
            ageGroup: ageGroup
          },
          estimatedDuration,
          totalSteps: 3,
          consentRequired: true,
          isExisting: false
        }
      })
    } catch (error) {
      console.error('开始测评失败:', error)
      res.status(500).json({
        success: false,
        message: '开始测评失败'
      })
    }
  }

  /**
   * 获取测评问卷
   * GET /api/assessment/questionnaire/:assessmentId
   * 
   * 题库随机抽取逻辑：
   * 1. 从80道题库中随机抽取5-7道题
   * 2. 确保每维度至少抽取1道题
   * 3. 根据年龄调整题目数量
   */
  static async getQuestionnaire(req: AuthRequest, res: Response) {
    try {
      const assessmentId = parseInt(req.params.assessmentId)

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: '缺少 assessmentId 参数'
        })
      }

      // 获取测评信息
      const assessment = await queryOne<RowDataPacket>(
        `SELECT a.child_id, a.status, a.current_stage, c.age, c.age_group
         FROM assessment a
         JOIN child c ON a.child_id = c.id
         WHERE a.id = ?`,
        [assessmentId]
      )

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: '测评不存在'
        })
      }

      // 获取年龄组 - 转换 child 表的 age_group 格式到测评系统格式
      let ageGroupValue = '8-9' // 默认值
      if (assessment.age_group) {
        switch (assessment.age_group) {
          case '4-6': ageGroupValue = '4-5'; break
          case '7-9': ageGroupValue = '6-7'; break
          case '10-12': ageGroupValue = '8-9'; break
          default: ageGroupValue = '10-12'
        }
      } else if (assessment.age) {
        ageGroupValue = getAgeGroup(assessment.age)
      }
      const ageGroup = ageGroupValue

      // 根据年龄组确定问卷字段
      let questionField: string
      let optionsField: string
      switch (ageGroup) {
        case '4-5':
          questionField = 'question_early'
          optionsField = 'options_early'
          break
        case '6-7':
          questionField = 'question_mid'
          optionsField = 'options_mid'
          break
        case '8-9':
          questionField = 'question_late'
          optionsField = 'options_late'
          break
        default:
          questionField = 'question_all'
          optionsField = 'options_all'
      }

      // 获取该年龄组的所有题目
      const allQuestions = await query<RowDataPacket>(
        `SELECT id, question_code, dimension, dimension_name, question_type, 
                ${questionField} as content, ${optionsField} as options, weight, sort_order
         FROM assessment_question 
         WHERE is_active = 1 AND ${questionField} IS NOT NULL AND ${questionField} != ''
         ORDER BY sort_order ASC`
      )

      // 获取已答题目（用于断点续测）
      const answered = await query<RowDataPacket>(
        `SELECT question_id, answer_value FROM assessment_questionnaire_answer WHERE assessment_id = ?`,
        [assessmentId]
      )

      const answeredMap: { [key: number]: number } = {}
      const answeredQuestionIds = new Set<number>()
      answered.forEach(a => {
        answeredMap[a.question_id] = a.answer_value
        answeredQuestionIds.add(a.question_id)
      })

      // 如果已有答题记录，直接返回已答题目（支持断点续测）
      if (answeredQuestionIds.size > 0) {
        const answeredQuestions = allQuestions.filter(q => answeredQuestionIds.has(q.id))
        const formattedQuestions = answeredQuestions.map(q => {
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          return {
            id: q.id,
            questionCode: q.question_code,
            dimension: q.dimension,
            dimensionName: q.dimension_name,
            type: q.question_type,
            content: q.content,
            options: options,
            weight: q.weight,
            hasAnswered: true,
            userAnswer: answeredMap[q.id] || null
          }
        })

        return res.json({
          success: true,
          data: {
            assessmentId,
            questionnaireId: `QN${assessmentId}`,
            ageGroup,
            questions: formattedQuestions,
            totalQuestions: formattedQuestions.length,
            currentQuestion: formattedQuestions.length + 1,
            currentQuestionIndex: formattedQuestions.length,
            estimatedTime: Math.ceil(formattedQuestions.length * 0.3),
            progress: {
              answered: formattedQuestions.length,
              total: formattedQuestions.length,
              percentage: 100,
              isResuming: true
            },
            message: '继续上次答题'
          }
        })
      }

      // ========== 智能随机抽取算法 ==========
      
      // 7个评估维度
      const dimensions = [
        'sustained_attention',     // 持续注意力
        'selective_attention',     // 选择性注意力
        'divided_attention',       // 分配注意力
        'attention_shifting',      // 转移注意力
        'working_memory',          // 工作记忆
        'impulse_control',         // 冲动控制
        'reaction_speed'            // 反应速度
      ]

      // 按维度分组题目
      const questionsByDimension: { [key: string]: any[] } = {}
      dimensions.forEach(dim => {
        questionsByDimension[dim] = allQuestions.filter(q => q.dimension === dim)
      })

      // 根据年龄确定抽取数量
      let targetCount: number
      switch (ageGroup) {
        case '4-5': // 幼儿组：5-6题
          targetCount = Math.random() < 0.5 ? 5 : 6
          break
        case '6-7': // 学前期：5-6题
          targetCount = Math.random() < 0.5 ? 5 : 6
          break
        case '8-9': // 小学低年级：6-7题
          targetCount = Math.random() < 0.5 ? 6 : 7
          break
        default: // 小学高年级：6-7题
          targetCount = Math.random() < 0.5 ? 6 : 7
      }

      // 第一步：确保每维度至少抽取1题（保证7题）
      const selectedQuestions: any[] = []
      const usedQuestionIds = new Set<number>()

      dimensions.forEach(dim => {
        const dimQuestions = questionsByDimension[dim]
        if (dimQuestions && dimQuestions.length > 0) {
          // 随机选择1题
          const randomIndex = Math.floor(Math.random() * dimQuestions.length)
          const selected = dimQuestions[randomIndex]
          selectedQuestions.push(selected)
          usedQuestionIds.add(selected.id)
        }
      })

      // 第二步：剩余名额随机抽取
      const remainingSlots = targetCount - selectedQuestions.length
      if (remainingSlots > 0) {
        // 获取未被选中的题目
        const remainingQuestions = allQuestions.filter(q => !usedQuestionIds.has(q.id))
        
        // 从剩余题目中随机抽取
        const shuffled = remainingQuestions.sort(() => Math.random() - 0.5)
        const toAdd = shuffled.slice(0, remainingSlots)
        
        toAdd.forEach(q => {
          selectedQuestions.push(q)
          usedQuestionIds.add(q.id)
        })
      }

      // 打乱最终顺序
      const shuffledFinal = selectedQuestions.sort(() => Math.random() - 0.5)

      // 转换题目数据
      const formattedQuestions = shuffledFinal.map(q => {
        const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        return {
          id: q.id,
          questionCode: q.question_code,
          dimension: q.dimension,
          dimensionName: q.dimension_name,
          type: q.question_type,
          content: q.content,
          options: options,
          weight: q.weight,
          hasAnswered: false,
          userAnswer: null
        }
      })

      // 计算维度覆盖
      const coveredDimensions = new Set(formattedQuestions.map(q => q.dimension))

      res.json({
        success: true,
        data: {
          assessmentId,
          questionnaireId: `QN${assessmentId}`,
          ageGroup,
          questions: formattedQuestions,
          totalQuestions: formattedQuestions.length,
          currentQuestion: 1,
          currentQuestionIndex: 0,
          estimatedTime: Math.ceil(formattedQuestions.length * 0.3), // 每题约0.3分钟
          progress: {
            answered: 0,
            total: formattedQuestions.length,
            percentage: 0
          },
          extraction: {
            totalBank: allQuestions.length,
            selectedCount: formattedQuestions.length,
            dimensionsCovered: coveredDimensions.size,
            allDimensionsCovered: coveredDimensions.size === 7
          },
          message: `从${allQuestions.length}道题中随机抽取${formattedQuestions.length}道，覆盖${coveredDimensions.size}个维度`
        }
      })
    } catch (error) {
      console.error('获取问卷失败:', error)
      res.status(500).json({
        success: false,
        message: '获取问卷失败'
      })
    }
  }

  /**
   * 提交问卷答案
   * POST /api/assessment/questionnaire/:assessmentId
   */
  static async submitQuestionnaire(req: AuthRequest, res: Response) {
    try {
      const assessmentId = parseInt(req.params.assessmentId)
      const { answers, completed = false } = req.body

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: '缺少 assessmentId 参数'
        })
      }

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少 answers 参数'
        })
      }

      // 获取题目信息用于计算分数
      const questionIds = answers.map((a: { questionId: number }) => a.questionId)
      const questions = await query<RowDataPacket>(
        `SELECT id, dimension, weight, options_early, options_mid, options_late, options_all 
         FROM assessment_question WHERE id IN (?)`,
        [questionIds]
      )

      const questionMap: { [key: number]: any } = {}
      questions.forEach(q => questionMap[q.id] = q)

      // 保存答案
      let savedCount = 0
      for (const answer of answers) {
        const question = questionMap[answer.questionId]
        if (!question) continue

        // 根据维度确定选项字段（这里简化为使用通用的第一个有效选项）
        const optionsStr = question.options_all || question.options_late || question.options_mid || question.options_early
        const options = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr
        
        // 计算得分
        const selectedOption = options.find((o: any) => o.value === answer.value)
        const score = selectedOption?.score || 0

        // 插入或更新答案
        await execute(
          `INSERT INTO assessment_questionnaire_answer (assessment_id, question_id, answer_value, score, dimension, answered_at)
           VALUES (?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE answer_value = VALUES(answer_value), score = VALUES(score), answered_at = NOW()`,
          [assessmentId, answer.questionId, answer.value || answer.selectedOption, score, question.dimension]
        )
        savedCount++
      }

      // 如果完成，更新测评状态
      if (completed) {
        await execute(
          `UPDATE assessment SET current_stage = 'games' WHERE id = ?`,
          [assessmentId]
        )
      }

      // 获取当前进度
      const totalAnswers = await queryOne<RowDataPacket>(
        `SELECT COUNT(*) as count FROM assessment_questionnaire_answer WHERE assessment_id = ?`,
        [assessmentId]
      )

      // 获取总题数 - 按年龄组获取对应的题目数
      const ageGroupResult = await queryOne<RowDataPacket>(
        `SELECT c.age_group FROM assessment a 
         JOIN child c ON a.child_id = c.id WHERE a.id = ?`,
        [assessmentId]
      )
      
      let questionField = 'question_late'
      if (ageGroupResult?.age_group === '4-6') questionField = 'question_early'
      else if (ageGroupResult?.age_group === '7-9') questionField = 'question_mid'
      else if (ageGroupResult?.age_group === '10-12') questionField = 'question_late'
      
      const totalQuestions = await queryOne<RowDataPacket>(
        `SELECT COUNT(*) as count FROM assessment_question WHERE is_active = 1 AND ${questionField} IS NOT NULL AND ${questionField} != ''`
      )

      res.json({
        success: true,
        data: {
          saved: savedCount,
          currentQuestion: totalAnswers?.count || 0,
          progress: {
            current: totalAnswers?.count || 0,
            total: totalQuestions?.count || 0,
            percentage: Math.round(((totalAnswers?.count || 0) / (totalQuestions?.count || 1)) * 100)
          },
          completed: completed || (totalAnswers?.count || 0) >= (totalQuestions?.count || 0)
        }
      })
    } catch (error) {
      console.error('提交问卷失败:', error)
      res.status(500).json({
        success: false,
        message: '提交问卷失败'
      })
    }
  }

  /**
   * 获取测评游戏列表
   * GET /api/assessment/games/:assessmentId
   */
  static async getGames(req: AuthRequest, res: Response) {
    try {
      const assessmentId = parseInt(req.params.assessmentId)

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: '缺少 assessmentId 参数'
        })
      }

      // 获取测评信息
      const assessment = await queryOne<RowDataPacket>(
        `SELECT a.child_id, a.status, c.age, c.age_group
         FROM assessment a
         JOIN child c ON a.child_id = c.id
         WHERE a.id = ?`,
        [assessmentId]
      )

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: '测评不存在'
        })
      }

      // 获取年龄组 - 转换 child 表的 age_group 格式到测评系统格式
      let ageGroupValue = '8-9' // 默认值
      if (assessment.age_group) {
        switch (assessment.age_group) {
          case '4-6': ageGroupValue = '4-5'; break
          case '7-9': ageGroupValue = '6-7'; break
          case '10-12': ageGroupValue = '8-9'; break
          default: ageGroupValue = '10-12'
        }
      } else if (assessment.age) {
        ageGroupValue = getAgeGroup(assessment.age)
      }
      const ageGroup = ageGroupValue

      // 获取该年龄组的游戏配置
      const games = await query<RowDataPacket>(
        `SELECT gdc.game_id, gdc.game_code, g.game_name, g.description, g.icon,
                gdc.difficulty_level, gdc.parameters, gdc.time_limit, gdc.pass_threshold, gdc.description as config_desc
         FROM game_difficulty_config gdc
         JOIN game g ON gdc.game_id = g.id
         WHERE gdc.age_group = ? AND gdc.is_assessment = 1 AND gdc.is_default = 1
         ORDER BY gdc.game_id`,
        [ageGroup]
      )

      // 获取已完成的游戏
      const completedGames = await query<RowDataPacket>(
        `SELECT game_code, score, percentile, rating, completed_at
         FROM assessment_game_result 
         WHERE assessment_id = ? AND completed = 1`,
        [assessmentId]
      )

      const completedMap: { [key: string]: any } = {}
      completedGames.forEach(g => {
        completedMap[g.game_code] = g
      })

      // 根据年龄组推荐游戏
      let recommendedGames: any[] = []
      
      // 每个年龄组推荐3款游戏
      const gameSelection: { [key: string]: string[] } = {
        '4-5': ['schulte', 'pattern_memory', 'rhythm_tap'],
        '6-7': ['schulte', 'audio_count', 'visual_tracking'],
        '8-9': ['schulte', 'quick_sort', 'auditory_memory'],
        '10-12': ['maze', 'quick_sort', 'target_tracking']
      }

      const selectedCodes = gameSelection[ageGroup] || gameSelection['8-9']

      recommendedGames = games
        .filter(g => selectedCodes.includes(g.game_code))
        .map(g => {
          const completed = completedMap[g.game_code]
          const params = typeof g.parameters === 'string' ? JSON.parse(g.parameters) : g.parameters

          return {
            gameId: g.game_code,
            gameName: g.game_name,
            description: g.config_desc || g.description,
            icon: g.icon_url,
            difficultyLevel: g.difficulty_level,
            config: params,
            timeLimit: g.time_limit,
            status: completed ? 'completed' : 'pending',
            score: completed?.score || null,
            percentile: completed?.percentile || null,
            rating: completed?.rating || null
          }
        })

      res.json({
        success: true,
        data: {
          assessmentId,
          ageGroup,
          games: recommendedGames,
          totalGames: recommendedGames.length,
          completedGames: Object.keys(completedMap).length,
          currentGame: Object.keys(completedMap).length + 1,
          estimatedTime: recommendedGames.length * 5 // 每款游戏约5分钟
        }
      })
    } catch (error) {
      console.error('获取游戏列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取游戏列表失败'
      })
    }
  }

  /**
   * 提交游戏结果
   * POST /api/assessment/games/:assessmentId
   */
  static async submitGameResult(req: AuthRequest, res: Response) {
    try {
      const assessmentId = parseInt(req.params.assessmentId)
      const { gameId, result } = req.body

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: '缺少 assessmentId 参数'
        })
      }

      if (!gameId || !result) {
        return res.status(400).json({
          success: false,
          message: '缺少 gameId 或 result 参数'
        })
      }

      // 获取游戏信息
      const game = await queryOne<RowDataPacket>(
        `SELECT id, game_code, game_name FROM game WHERE game_code = ?`,
        [gameId]
      )

      if (!game) {
        return res.status(404).json({
          success: false,
          message: '游戏不存在'
        })
      }

      // 获取测评信息
      const assessment = await queryOne<RowDataPacket>(
        `SELECT a.child_id, c.age, c.age_group
         FROM assessment a
         JOIN child c ON a.child_id = c.id
         WHERE a.id = ?`,
        [assessmentId]
      )

      // 确定年龄组 - 转换 child 表的 age_group 格式到测评系统格式
      let ageGroup = '8-9' // 默认值
      if (assessment?.age_group) {
        switch (assessment.age_group) {
          case '4-6': ageGroup = '4-5'; break
          case '7-9': ageGroup = '6-7'; break
          case '10-12': ageGroup = '8-9'; break
          default: ageGroup = '10-12'
        }
      } else if (assessment?.age) {
        ageGroup = getAgeGroup(assessment.age)
      }

      // 获取该游戏在该年龄组的配置
      const config = await queryOne<RowDataPacket>(
        `SELECT difficulty_level, parameters FROM game_difficulty_config
         WHERE game_id = ? AND age_group = ? AND is_assessment = 1 AND is_default = 1`,
        [game.id, ageGroup]
      )

      // 计算百分位
      let percentile = 50
      let rating = 'normal'

      // 获取该维度的常模数据
      const dimension = InitialAssessmentController.getDimensionByGame(gameId)
      if (dimension) {
        const norm = await queryOne<RowDataPacket>(
          `SELECT mean, std_dev FROM percentile_norm WHERE dimension = ? AND age_group = ?`,
          [dimension, ageGroup]
        )

        if (norm && norm.std_dev > 0) {
          percentile = calculatePercentile(result.score, norm.mean, norm.std_dev)
          rating = getRating(percentile).label
        }
      }

      // 保存游戏结果
      await execute(
        `INSERT INTO assessment_game_result 
         (assessment_id, game_id, game_code, difficulty_level, score, accuracy, duration, 
          focus_score, raw_data, percentile, rating, completed, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
         ON DUPLICATE KEY UPDATE
           score = VALUES(score), accuracy = VALUES(accuracy), duration = VALUES(duration),
           focus_score = VALUES(focus_score), raw_data = VALUES(raw_data),
           percentile = VALUES(percentile), rating = VALUES(rating), completed = 1, completed_at = NOW()`,
        [
          assessmentId,
          game.id,
          gameId,
          config?.difficulty_level || 1,
          result.score || 0,
          result.accuracy || 0,
          result.duration || 0,
          result.focusScore || 0,
          JSON.stringify(result.rawData || {}),
          percentile,
          rating,
          result.startedAt || null
        ]
      )

      // 检查是否所有游戏都完成了
      const completedGames = await query<RowDataPacket>(
        `SELECT COUNT(*) as count FROM assessment_game_result WHERE assessment_id = ? AND completed = 1`,
        [assessmentId]
      )

      const allGamesCompleted = completedGames[0]?.count >= 3

      // 如果所有游戏完成，更新测评状态
      if (allGamesCompleted) {
        await execute(
          `UPDATE assessment SET current_stage = 'report' WHERE id = ?`,
          [assessmentId]
        )
      }

      // 获取下一个游戏
      const gameSelection: { [key: string]: string[] } = {
        '4-5': ['schulte', 'pattern_memory', 'rhythm_tap'],
        '6-7': ['schulte', 'audio_count', 'visual_tracking'],
        '8-9': ['schulte', 'quick_sort', 'auditory_memory'],
        '10-12': ['maze', 'quick_sort', 'target_tracking']
      }

      const selectedCodes = gameSelection[ageGroup] || gameSelection['8-9']
      const currentIndex = selectedCodes.indexOf(gameId)
      const nextGame = currentIndex < selectedCodes.length - 1 ? selectedCodes[currentIndex + 1] : null

      res.json({
        success: true,
        data: {
          saved: true,
          performance: {
            score: result.score || 0,
            accuracy: result.accuracy || 0,
            percentile,
            rating
          },
          nextGame,
          progress: {
            completed: completedGames[0]?.count || 0,
            total: selectedCodes.length
          },
          allCompleted: allGamesCompleted
        }
      })
    } catch (error) {
      console.error('提交游戏结果失败:', error)
      res.status(500).json({
        success: false,
        message: '提交游戏结果失败'
      })
    }
  }

  /**
   * 生成测评报告
   * POST /api/assessment/generate-report/:assessmentId
   */
  static async generateReport(req: AuthRequest, res: Response) {
    try {
      const assessmentId = parseInt(req.params.assessmentId)

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: '缺少 assessmentId 参数'
        })
      }

      // 获取测评信息
      const assessment = await queryOne<RowDataPacket>(
        `SELECT a.id, a.assessment_no, a.child_id, a.actual_duration, c.name, c.age, c.age_group
         FROM assessment a
         JOIN child c ON a.child_id = c.id
         WHERE a.id = ?`,
        [assessmentId]
      )

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: '测评不存在'
        })
      }

      const ageGroup = assessment.age_group || getAgeGroup(assessment.age)

      // 获取问卷答案（按维度汇总）
      const questionnaireScores = await query<RowDataPacket>(
        `SELECT dimension, SUM(score) as total_score, COUNT(*) as count
         FROM assessment_questionnaire_answer
         WHERE assessment_id = ?
         GROUP BY dimension`,
        [assessmentId]
      )

      // 获取游戏结果
      const gameResults = await query<RowDataPacket>(
        `SELECT game_code, score, accuracy, duration, percentile, rating
         FROM assessment_game_result
         WHERE assessment_id = ? AND completed = 1`,
        [assessmentId]
      )

      // 计算各维度分数
      const dimensionScores: { [key: string]: number } = {}
      const dimensionPercentiles: { [key: string]: number } = {}

      // 7个维度的定义
      const dimensions = [
        { code: 'sustained_attention', name: '持续注意力', games: ['schulte', 'maze'] },
        { code: 'selective_attention', name: '选择性注意力', games: ['target_tracking', 'visual_tracking'] },
        { code: 'divided_attention', name: '分配注意力', games: ['rhythm_tap', 'target_tracking'] },
        { code: 'attention_shifting', name: '转移注意力', games: ['quick_sort', 'auditory_memory'] },
        { code: 'working_memory', name: '工作记忆', games: ['pattern_memory', 'auditory_memory'] },
        { code: 'impulse_control', name: '冲动控制', games: ['quick_sort', 'target_tracking'] },
        { code: 'reaction_speed', name: '反应速度', games: ['schulte', 'rhythm_tap'] }
      ]

      // 问卷维度分数计算
      const questionnaireMap: { [key: string]: number } = {}
      questionnaireScores.forEach(q => {
        questionnaireMap[q.dimension] = q.total_score
      })

      // 游戏维度分数计算
      dimensions.forEach(dim => {
        const relatedGames = gameResults.filter(g => dim.games.includes(g.game_code))
        let gameScore = 0
        let gamePercentile = 50

        if (relatedGames.length > 0) {
          gameScore = Math.round(relatedGames.reduce((sum, g) => sum + g.score, 0) / relatedGames.length)
          gamePercentile = Math.round(relatedGames.reduce((sum, g) => sum + (g.percentile || 50), 0) / relatedGames.length)
        }

        // 综合分数 = 问卷 * 0.4 + 游戏 * 0.6
        const qScore = questionnaireMap[dim.code] || 0
        const weight = DIMENSION_WEIGHTS[dim.code] || 1.0
        dimensionScores[dim.code] = Math.round((qScore * 0.4 + gameScore * 0.6) * weight)
        dimensionPercentiles[dim.code] = gamePercentile
      })

      // 计算综合分数（所有维度平均）
      const totalDimensionScore = Object.values(dimensionScores).reduce((a, b) => a + b, 0)
      const overallScore = Math.round(totalDimensionScore / Object.keys(dimensionScores).length)

      // 计算问卷总分和游戏总分
      const totalQuestionnaireScore = Object.values(questionnaireMap).reduce((a, b) => a + b, 0)
      const totalGameScore = gameResults.length > 0 
        ? Math.round(gameResults.reduce((sum, g) => sum + g.score, 0) / gameResults.length) 
        : 0

      // 计算综合百分位
      const overallPercentile = Math.round(
        Object.values(dimensionPercentiles).reduce((a, b) => a + b, 0) / Object.keys(dimensionPercentiles).length
      )

      const overallRatingInfo = getRating(overallPercentile)

      // 找出优势和劣势
      const sortedDimensions = Object.entries(dimensionPercentiles)
        .sort((a, b) => b[1] - a[1])

      const strengths = sortedDimensions
        .filter(d => d[1] >= 70)
        .map(d => dimensions.find(dim => dim.code === d[0])?.name || d[0])

      const weaknesses = sortedDimensions
        .filter(d => d[1] < 50)
        .map(d => dimensions.find(dim => dim.code === d[0])?.name || d[0])

      // 生成详细维度分析
      const dimensionDetails = dimensions.map(dim => {
        const score = dimensionScores[dim.code] || 0
        const percentile = dimensionPercentiles[dim.code] || 50
        const ratingInfo = getRating(percentile)

        return {
          dimension: dim.code,
          dimensionName: dim.name,
          score,
          percentile,
          rating: ratingInfo.label,
          level: ratingInfo.color,
          analysis: InitialAssessmentController.generateDimensionAnalysis(dim.code, score, percentile),
          recommendation: InitialAssessmentController.generateRecommendation(dim.code, percentile)
        }
      })

      // 生成训练计划
      const trainingPlan = {
        dailyDuration: ageGroup === '4-5' ? 10 : ageGroup === '6-7' ? 15 : 20,
        focusGames: weaknesses.slice(0, 2).map(w => {
          const dim = dimensions.find(d => d.name === w)
          return dim?.games[0] || 'schulte'
        }),
        priorityDimensions: weaknesses.slice(0, 3),
        weeklySchedule: InitialAssessmentController.generateWeeklySchedule(weaknesses)
      }

      // 生成报告编号
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const seqResult = await queryOne<RowDataPacket>(
        `SELECT COUNT(*) + 1 as seq FROM assessment_report WHERE DATE(created_at) = CURDATE()`
      )
      const reportNo = `RPT${dateStr}${String(seqResult?.seq || 1).padStart(4, '0')}`

      // 保存报告
      await execute(
        `INSERT INTO assessment_report 
         (report_no, assessment_id, child_id, child_name, child_age, child_age_group,
          report_type, overall_score, overall_percentile, overall_rating,
          dimension_scores, dimension_percentiles, dimension_details,
          strengths, weaknesses, summary, recommendations, training_plan, disclaimer)
         VALUES (?, ?, ?, ?, ?, ?, 'initial', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reportNo,
          assessmentId,
          assessment.child_id,
          assessment.name,
          assessment.age,
          ageGroup,
          overallScore,
          overallPercentile,
          overallRatingInfo.label,
          JSON.stringify(dimensionScores),
          JSON.stringify(dimensionPercentiles),
          JSON.stringify(dimensionDetails),
          JSON.stringify(strengths),
          JSON.stringify(weaknesses),
          `综合评估显示该儿童在${strengths.join('、')}方面表现较好，在${weaknesses.join('、')}方面有提升空间。建议针对性训练以提升专注力水平。`,
          JSON.stringify(dimensionDetails.map((d: any) => d.recommendation)),
          JSON.stringify(trainingPlan),
          '⚠️ 重要声明：本测评结果仅供参考，不能替代专业医疗诊断。如有严重注意力困扰，建议咨询专业医生或儿童心理专家。本产品是专注力训练工具，不是医疗诊断或治疗手段。我们不提供任何关于注意缺陷多动障碍（ADHD）或其他神经发育障碍的诊断服务。如对孩子的专注力发展有疑虑，请联系专业医疗机构进行专业评估。'
        ]
      )

      // 更新测评状态
      await execute(
        `UPDATE assessment SET status = 'completed', completed_at = NOW(), actual_duration = TIMESTAMPDIFF(MINUTE, started_at, NOW()) WHERE id = ?`,
        [assessmentId]
      )

      res.json({
        success: true,
        data: {
          reportId: reportNo,
          childId: assessment.child_id,
          childInfo: {
            name: assessment.name,
            age: assessment.age,
            ageGroup: ageGroup
          },
          overallScore,
          percentile: overallPercentile,
          rating: overallRatingInfo.label,
          ratingLevel: overallRatingInfo.color,
          questionnaireScore: totalQuestionnaireScore,
          gameScore: totalGameScore,
          dimensions: dimensionDetails,
          strengths,
          weaknesses,
          summary: `综合评估显示该儿童在${strengths.join('、')}方面表现较好，在${weaknesses.join('、')}方面有提升空间。建议针对性训练以提升专注力水平。`,
          recommendations: dimensionDetails.map((d: any) => d.recommendation),
          trainingPlan,
          disclaimer: '⚠️ 重要声明：本测评结果仅供参考，不能替代专业医疗诊断。如有严重注意力困扰，建议咨询专业医生或儿童心理专家。本产品是专注力训练工具，不是医疗诊断或治疗手段。我们不提供任何关于注意缺陷多动障碍（ADHD）或其他神经发育障碍的诊断服务。如对孩子的专注力发展有疑虑，请联系专业医疗机构进行专业评估。',
          generatedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('生成报告失败:', error)
      res.status(500).json({
        success: false,
        message: '生成报告失败'
      })
    }
  }

  /**
   * 获取报告详情
   * GET /api/assessment/report/:reportId
   */
  static async getReport(req: AuthRequest, res: Response) {
    try {
      const reportId = req.params.reportId

      const report = await queryOne<RowDataPacket>(
        `SELECT * FROM assessment_report WHERE id = ? OR report_no = ?`,
        [reportId, reportId]
      )

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '报告不存在'
        })
      }

      res.json({
        success: true,
        data: {
          report: {
            id: report.id,
            reportNo: report.report_no,
            childId: report.child_id,
            childName: report.child_name,
            childAge: report.child_age,
            childAgeGroup: report.child_age_group,
            reportType: report.report_type,
            overallScore: report.overall_score,
            overallPercentile: report.overall_percentile,
            overallRating: report.overall_rating,
            dimensionScores: typeof report.dimension_scores === 'string' ? JSON.parse(report.dimension_scores) : report.dimension_scores,
            dimensionPercentiles: typeof report.dimension_percentiles === 'string' ? JSON.parse(report.dimension_percentiles) : report.dimension_percentiles,
            dimensionDetails: typeof report.dimension_details === 'string' ? JSON.parse(report.dimension_details) : report.dimension_details,
            strengths: typeof report.strengths === 'string' ? JSON.parse(report.strengths) : report.strengths,
            weaknesses: typeof report.weaknesses === 'string' ? JSON.parse(report.weaknesses) : report.weaknesses,
            summary: report.summary,
            recommendations: typeof report.recommendations === 'string' ? JSON.parse(report.recommendations) : report.recommendations,
            trainingPlan: typeof report.training_plan === 'string' ? JSON.parse(report.training_plan) : report.training_plan,
            disclaimer: report.disclaimer,
            createdAt: report.created_at
          }
        }
      })
    } catch (error) {
      console.error('获取报告失败:', error)
      res.status(500).json({
        success: false,
        message: '获取报告失败'
      })
    }
  }

  /**
   * 获取儿童的历史报告列表
   * GET /api/assessment/reports/:childId
   */
  static async getReportList(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)
      const { page = 1, pageSize = 10 } = req.query

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)

      // 获取报告列表
      const reports = await query<RowDataPacket>(
        `SELECT id, report_no, child_name, child_age, child_age_group, 
                report_type, overall_score, overall_percentile, overall_rating, created_at
         FROM assessment_report
         WHERE child_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [childId, parseInt(pageSize as string), offset]
      )

      // 获取总数
      const totalResult = await queryOne<RowDataPacket>(
        `SELECT COUNT(*) as count FROM assessment_report WHERE child_id = ?`,
        [childId]
      )

      res.json({
        success: true,
        data: {
          reports: reports.map(r => ({
            id: r.id,
            reportNo: r.report_no,
            childName: r.child_name,
            childAge: r.child_age,
            childAgeGroup: r.child_age_group,
            reportType: r.report_type,
            overallScore: r.overall_score,
            overallPercentile: r.overall_percentile,
            overallRating: r.overall_rating,
            createdAt: r.created_at
          })),
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total: totalResult?.count || 0,
            totalPages: Math.ceil((totalResult?.count || 0) / parseInt(pageSize as string))
          }
        }
      })
    } catch (error) {
      console.error('获取报告列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取报告列表失败'
      })
    }
  }

  /**
   * 获取百分位常模数据
   * GET /api/assessment/norm/:dimension/:ageGroup
   */
  static async getNorm(req: AuthRequest, res: Response) {
    try {
      const { dimension, ageGroup } = req.params

      const norm = await queryOne<RowDataPacket>(
        `SELECT * FROM percentile_norm WHERE dimension = ? AND age_group = ?`,
        [dimension, ageGroup]
      )

      if (!norm) {
        return res.status(404).json({
          success: false,
          message: '常模数据不存在'
        })
      }

      res.json({
        success: true,
        data: {
          dimension: norm.dimension,
          dimensionName: norm.dimension_name,
          ageGroup: norm.age_group,
          sampleSize: norm.sample_size,
          mean: norm.mean,
          stdDev: norm.std_dev,
          percentiles: {
            p5: norm.p5,
            p10: norm.p10,
            p20: norm.p20,
            p30: norm.p30,
            p50: norm.p50,
            p60: norm.p60,
            p70: norm.p70,
            p80: norm.p80,
            p90: norm.p90,
            p95: norm.p95
          }
        }
      })
    } catch (error) {
      console.error('获取常模失败:', error)
      res.status(500).json({
        success: false,
        message: '获取常模失败'
      })
    }
  }

  /**
   * 获取游戏难度配置
   * GET /api/assessment/game-config/:gameCode/:ageGroup
   */
  static async getGameConfig(req: AuthRequest, res: Response) {
    try {
      const { gameCode, ageGroup } = req.params

      // 查询默认配置，优先使用 is_default=1 的记录
      let config = await queryOne<RowDataPacket>(
        `SELECT gdc.*, g.game_name, g.description
         FROM game_difficulty_config gdc
         JOIN game g ON gdc.game_id = g.id
         WHERE gdc.game_code = ? AND gdc.age_group = ? AND gdc.is_assessment = 1 AND gdc.is_default = 1`,
        [gameCode, ageGroup]
      )
      
      // 如果没有默认配置，尝试获取任意配置
      if (!config) {
        config = await queryOne<RowDataPacket>(
          `SELECT gdc.*, g.game_name, g.description
           FROM game_difficulty_config gdc
           JOIN game g ON gdc.game_id = g.id
           WHERE gdc.game_code = ? AND gdc.age_group = ? AND gdc.is_assessment = 1
           ORDER BY gdc.is_default DESC, gdc.difficulty_level ASC LIMIT 1`,
          [gameCode, ageGroup]
        )
      }

      if (!config) {
        return res.status(404).json({
          success: false,
          message: '游戏配置不存在'
        })
      }

      const parameters = typeof config.parameters === 'string' 
        ? JSON.parse(config.parameters) 
        : config.parameters

      res.json({
        success: true,
        data: {
          gameCode: config.game_code,
          gameName: config.game_name,
          ageGroup: config.age_group,
          difficultyLevel: config.difficulty_level,
          parameters,
          timeLimit: config.time_limit,
          passThreshold: config.pass_threshold,
          description: config.description
        }
      })
    } catch (error) {
      console.error('获取游戏配置失败:', error)
      res.status(500).json({
        success: false,
        message: '获取游戏配置失败'
      })
    }
  }

  // 辅助方法：根据游戏代码获取维度
  private static getDimensionByGame(gameCode: string): string | null {
    const gameDimensionMap: { [key: string]: string } = {
      'schulte': 'sustained_attention',
      'maze': 'sustained_attention',
      'target_tracking': 'selective_attention',
      'visual_tracking': 'selective_attention',
      'rhythm_tap': 'divided_attention',
      'quick_sort': 'attention_shifting',
      'auditory_memory': 'attention_shifting',
      'pattern_memory': 'working_memory',
      'audio_count': 'working_memory'
    }
    return gameDimensionMap[gameCode] || null
  }

  // 生成维度分析文本
  private static generateDimensionAnalysis(dimension: string, score: number, percentile: number): string {
    const analysisTemplates: { [key: string]: string } = {
      'sustained_attention': score > 70 
        ? '视觉搜索效率较高，能够快速定位目标。'
        : '视觉搜索效率有待提升，建议增加舒尔特方格练习。',
      'selective_attention': percentile > 70 
        ? '在干扰环境中能较好地筛选目标信息。'
        : '在复杂环境中筛选目标的能力需要加强。',
      'divided_attention': percentile > 70 
        ? '能够同时关注多个任务，分配注意力较好。'
        : '同时处理多个任务时有些吃力，建议循序渐进的练习。',
      'attention_shifting': percentile > 70 
        ? '任务切换灵活，能够快速适应规则变化。'
        : '在任务切换时需要更多时间适应，建议多加练习。',
      'working_memory': percentile > 70 
        ? '短时信息存储和加工能力较强。'
        : '工作记忆容量有限，建议通过记忆游戏提升。',
      'impulse_control': percentile > 70 
        ? '能够较好地抑制冲动反应。'
        : '冲动控制能力有待加强，需要更多练习。',
      'reaction_speed': percentile > 70 
        ? '对刺激的反应速度较快。'
        : '反应速度可以进一步通过练习提升。'
    }
    return analysisTemplates[dimension] || '表现一般，有提升空间。'
  }

  // 生成训练建议
  private static generateRecommendation(dimension: string, percentile: number): string {
    const recommendationTemplates: { [key: string]: string } = {
      'sustained_attention': '建议每天进行舒尔特方格训练，从低难度开始逐渐提升。',
      'selective_attention': '建议通过追踪目标游戏练习，提升抗干扰能力。',
      'divided_attention': '建议进行双任务训练，如边听边做动作的练习。',
      'attention_shifting': '建议通过快速分类游戏练习规则切换能力。',
      'working_memory': '建议通过图案记忆和听觉记忆游戏提升工作记忆。',
      'impulse_control': '建议通过节奏点击游戏练习抑制控制能力。',
      'reaction_speed': '建议进行反应速度相关的训练游戏。'
    }
    return recommendationTemplates[dimension] || '建议坚持每日训练，逐步提升能力。'
  }

  // 生成每周训练计划
  private static generateWeeklySchedule(weakDimensions: string[]): { [key: string]: string[] } {
    const gameMap: { [key: string]: string } = {
      '持续注意力': 'schulte',
      '选择性注意力': 'target_tracking',
      '分配注意力': 'rhythm_tap',
      '转移注意力': 'quick_sort',
      '工作记忆': 'auditory_memory',
      '冲动控制': 'rhythm_tap',
      '反应速度': 'schulte'
    }

    const schedule: { [key: string]: string[] } = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': [],
      'Sunday': []
    }

    const gamesToInclude = weakDimensions.slice(0, 3).map(d => gameMap[d] || 'schulte')
    
    // 分配游戏到不同日期
    const days = Object.keys(schedule)
    gamesToInclude.forEach((game, index) => {
      schedule[days[index % days.length]].push(game)
      if (index < gamesToInclude.length - 1) {
        schedule[days[(index + 1) % days.length]].push(game)
      }
    })

    return schedule
  }
}

export default InitialAssessmentController