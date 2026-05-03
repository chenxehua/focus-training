/**
 * 管理员 Controller 测试
 */
import { Request, Response } from 'express'
import * as adminController from '../controllers/adminController'
import { query, queryOne, execute } from '../config/database'

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn()
}))

const mockRequest = (options: any = {}) => {
  const req = {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    userId: options.userId || 1,
    userRole: options.userRole || 'admin'
  } as any
  return req
}

const mockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('AdminController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      ;(queryOne as jest.Mock)
        .mockResolvedValueOnce({ count: 100 }) // users
        .mockResolvedValueOnce({ count: 150 }) // children
        .mockResolvedValueOnce({ count: 50 })  // today training
        .mockResolvedValueOnce({ count: 20, amount: 3980 }) // orders
        .mockResolvedValueOnce({ count: 80 }) // members
      
      ;(query as jest.Mock)
        .mockResolvedValueOnce([
          { date: new Date('2024-01-01'), count: 10 },
          { date: new Date('2024-01-02'), count: 15 }
        ])
        .mockResolvedValueOnce([
          { game_name: '舒尔特方格', game_code: 'schulte', play_count: 500 },
          { game_name: '听声辨数', game_code: 'audio', play_count: 300 }
        ])

      const req = mockRequest()
      const res = mockResponse()

      await adminController.getDashboardStats(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            stats: expect.objectContaining({
              totalUsers: 100,
              totalChildren: 150,
              todayTraining: 50,
              monthOrders: 20,
              monthAmount: 3980,
              activeMembers: 80
            })
          })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      ;(queryOne as jest.Mock).mockRejectedValue(new Error('Database error'))

      const req = mockRequest()
      const res = mockResponse()

      await adminController.getDashboardStats(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1,
          message: '获取统计数据失败'
        })
      )
    })
  })

  describe('getUserList', () => {
    it('should return paginated user list', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue({ total: 50 })
      ;(query as jest.Mock).mockResolvedValue([
        { id: 1, nickname: '张三', phone: '13800138000' },
        { id: 2, nickname: '李四', phone: '13800138001' }
      ])

      const req = mockRequest({ query: { page: '1', pageSize: '20' } })
      const res = mockResponse()

      await adminController.getUserList(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            list: expect.any(Array),
            total: 50,
            page: 1,
            pageSize: 20
          })
        })
      )
    })

    it('should filter by keyword', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue({ total: 10 })
      ;(query as jest.Mock).mockResolvedValue([])

      const req = mockRequest({ query: { page: '1', keyword: '张三' } })
      const res = mockResponse()

      await adminController.getUserList(req, res)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('nickname LIKE'),
        expect.arrayContaining(['%张三%'])
      )
    })
  })

  describe('getUserDetail', () => {
    it('should return user detail with children and order stats', async () => {
      ;(queryOne as jest.Mock)
        .mockResolvedValueOnce({ id: 1, nickname: '张三', role: 'parent' })
        .mockResolvedValueOnce({ total: 5, amount: 995 })
      ;(query as jest.Mock)
        .mockResolvedValueOnce([{ id: 1, name: '小明' }])
        .mockResolvedValueOnce([])

      const req = mockRequest({ params: { id: '1' } })
      const res = mockResponse()

      await adminController.getUserDetail(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            user: expect.any(Object),
            children: expect.any(Array),
            orderStats: expect.any(Object)
          })
        })
      )
    })

    it('should return 404 for non-existent user', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue(null)

      const req = mockRequest({ params: { id: '999' } })
      const res = mockResponse()

      await adminController.getUserDetail(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1,
          message: '用户不存在'
        })
      )
    })
  })

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 1 })

      const req = mockRequest({ params: { id: '1' }, body: { status: 0 } })
      const res = mockResponse()

      await adminController.updateUserStatus(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({ message: '状态更新成功' })
        })
      )
    })

    it('should reject invalid status value', async () => {
      const req = mockRequest({ params: { id: '1' }, body: { status: 5 } })
      const res = mockResponse()

      await adminController.updateUserStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '无效的状态值'
        })
      )
    })
  })

  describe('getOrderList', () => {
    it('should return paginated order list', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue({ total: 100 })
      ;(query as jest.Mock).mockResolvedValue([
        { id: 1, order_no: 'ORDER001', total_amount: 199 },
        { id: 2, order_no: 'ORDER002', total_amount: 199 }
      ])

      const req = mockRequest({ query: { page: '1', pageSize: '20' } })
      const res = mockResponse()

      await adminController.getOrderList(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            list: expect.any(Array),
            total: 100
          })
        })
      )
    })

    it('should filter by status and date range', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue({ total: 20 })
      ;(query as jest.Mock).mockResolvedValue([])

      const req = mockRequest({
        query: {
          status: 'paid',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      })
      const res = mockResponse()

      await adminController.getOrderList(req, res)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("o.status = ?"),
        expect.arrayContaining(['paid', '2024-01-01', '2024-01-31 23:59:59'])
      )
    })
  })

  describe('getMemberList', () => {
    it('should return active members', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue({ total: 50 })
      ;(query as jest.Mock).mockResolvedValue([
        { id: 1, membership_type: 'annual', status: 'active' },
        { id: 2, membership_type: 'monthly', status: 'active' }
      ])

      const req = mockRequest({ query: { status: 'active' } })
      const res = mockResponse()

      await adminController.getMemberList(req, res)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("m.status = 'active'"),
        expect.any(Array)
      )
    })

    it('should return expired members', async () => {
      ;(queryOne as jest.Mock).mockResolvedValue({ total: 10 })
      ;(query as jest.Mock).mockResolvedValue([])

      const req = mockRequest({ query: { status: 'expired' } })
      const res = mockResponse()

      await adminController.getMemberList(req, res)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("m.status != 'active'"),
        expect.any(Array)
      )
    })
  })

  describe('updateMember', () => {
    it('should extend membership days', async () => {
      ;(queryOne as jest.Mock).mockResolvedValueOnce({
        id: 1,
        end_date: new Date('2024-02-01')
      })
      ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 1 })

      const req = mockRequest({ params: { id: '1' }, body: { extendDays: 30 } })
      const res = mockResponse()

      await adminController.updateMember(req, res)

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("end_date = ?"),
        expect.any(Array)
      )
    })

    it('should update membership status', async () => {
      ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 1 })

      const req = mockRequest({ params: { id: '1' }, body: { status: 'frozen' } })
      const res = mockResponse()

      await adminController.updateMember(req, res)

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("status = ?"),
        expect.arrayContaining(['frozen', 1])
      )
    })
  })

  describe('Article Management', () => {
    describe('getArticleList', () => {
      it('should return paginated article list', async () => {
        ;(queryOne as jest.Mock).mockResolvedValue({ total: 30 })
        ;(query as jest.Mock).mockResolvedValue([
          { id: 1, title: '如何培养专注力', category_name: '学习方法' },
          { id: 2, title: '注意力训练技巧', category_name: '训练技巧' }
        ])

        const req = mockRequest({ query: { page: '1', pageSize: '20' } })
        const res = mockResponse()

        await adminController.getArticleList(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({
              list: expect.any(Array),
              total: 30
            })
          })
        )
      })

      it('should filter by category', async () => {
        ;(queryOne as jest.Mock).mockResolvedValue({ total: 5 })
        ;(query as jest.Mock).mockResolvedValue([])

        const req = mockRequest({ query: { categoryId: '1' } })
        const res = mockResponse()

        await adminController.getArticleList(req, res)

        expect(query).toHaveBeenCalledWith(
          expect.stringContaining('category_id = ?'),
          expect.arrayContaining([1])
        )
      })
    })

    describe('createArticle', () => {
      it('should create article successfully', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ insertId: 100 })

        const req = mockRequest({
          body: {
            title: '新文章标题',
            content: '文章内容...',
            summary: '摘要',
            categoryId: 1,
            isPublished: true
          }
        })
        const res = mockResponse()

        await adminController.createArticle(req, res)

        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({ id: 100 })
          })
        )
      })

      it('should reject missing required fields', async () => {
        const req = mockRequest({ body: { title: '标题' } })
        const res = mockResponse()

        await adminController.createArticle(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '请填写完整信息'
          })
        )
      })
    })

    describe('updateArticle', () => {
      it('should update article successfully', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 1 })

        const req = mockRequest({
          params: { id: '1' },
          body: { title: '更新后的标题', content: '更新内容' }
        })
        const res = mockResponse()

        await adminController.updateArticle(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({ message: '更新成功' })
          })
        )
      })

      it('should return 404 for non-existent article', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 0 })

        const req = mockRequest({ params: { id: '999' }, body: { title: '测试' } })
        const res = mockResponse()

        await adminController.updateArticle(req, res)

        expect(res.status).toHaveBeenCalledWith(404)
      })
    })

    describe('deleteArticle', () => {
      it('should soft delete article', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 1 })

        const req = mockRequest({ params: { id: '1' } })
        const res = mockResponse()

        await adminController.deleteArticle(req, res)

        expect(execute).toHaveBeenCalledWith(
          expect.stringContaining('is_deleted = 1'),
          [1]
        )
      })
    })
  })

  describe('Question Management', () => {
    describe('getQuestionList', () => {
      it('should return paginated question list', async () => {
        ;(queryOne as jest.Mock).mockResolvedValue({ total: 20 })
        ;(query as jest.Mock).mockResolvedValue([
          { id: 1, title: '孩子注意力不集中怎么办', user_name: '张三' },
          { id: 2, title: '训练时间多长合适', user_name: '李四' }
        ])

        const req = mockRequest({ query: { page: '1' } })
        const res = mockResponse()

        await adminController.getQuestionList(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({
              list: expect.any(Array),
              total: 20
            })
          })
        )
      })

      it('should filter pending questions', async () => {
        ;(queryOne as jest.Mock).mockResolvedValue({ total: 5 })
        ;(query as jest.Mock).mockResolvedValue([])

        const req = mockRequest({ query: { status: 'pending' } })
        const res = mockResponse()

        await adminController.getQuestionList(req, res)

        expect(query).toHaveBeenCalledWith(
          expect.stringContaining('NOT EXISTS'),
          expect.any(Array)
        )
      })
    })

    describe('answerQuestion', () => {
      it('should add answer to question', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ insertId: 50 })

        const req = mockRequest({
          params: { id: '1' },
          body: { content: '这是专家回答内容', isExpert: true }
        })
        const res = mockResponse()

        await adminController.answerQuestion(req, res)

        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({ id: 50 })
          })
        )
      })

      it('should reject empty content', async () => {
        const req = mockRequest({ params: { id: '1' }, body: { content: '' } })
        const res = mockResponse()

        await adminController.answerQuestion(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '请填写回答内容'
          })
        )
      })
    })
  })

  describe('Game Management', () => {
    describe('getGameList', () => {
      it('should return all games', async () => {
        ;(query as jest.Mock).mockResolvedValue([
          { id: 1, game_name: '舒尔特方格', game_code: 'schulte' },
          { id: 2, game_name: '听声辨数', game_code: 'audio' }
        ])

        const req = mockRequest()
        const res = mockResponse()

        await adminController.getGameList(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.arrayContaining([
              expect.objectContaining({ game_name: '舒尔特方格' })
            ])
          })
        )
      })
    })

    describe('updateGame', () => {
      it('should update game configuration', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 1 })

        const req = mockRequest({
          params: { id: '1' },
          body: {
            game_name: '舒尔特方格',
            description: '更新后的描述',
            is_free: false
          }
        })
        const res = mockResponse()

        await adminController.updateGame(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({ message: '更新成功' })
          })
        )
      })

      it('should return 404 for non-existent game', async () => {
        ;(execute as jest.Mock).mockResolvedValue({ affectedRows: 0 })

        const req = mockRequest({ params: { id: '999' }, body: { game_name: '测试' } })
        const res = mockResponse()

        await adminController.updateGame(req, res)

        expect(res.status).toHaveBeenCalledWith(404)
      })
    })
  })

  describe('Analytics', () => {
    describe('getTrainingAnalytics', () => {
      it('should return training analytics data', async () => {
        ;(query as jest.Mock)
          .mockResolvedValueOnce([
            { date: new Date('2024-01-01'), total_count: 100, avg_accuracy: 0.85 }
          ])
          .mockResolvedValueOnce([
            { age_group: '4-6', count: 50, avg_accuracy: 0.80 }
          ])
          .mockResolvedValueOnce([
            { id: 1, game_name: '舒尔特方格', play_count: 500 }
          ])

        const req = mockRequest({ query: { days: '30' } })
        const res = mockResponse()

        await adminController.getTrainingAnalytics(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({
              dailyTrend: expect.any(Array),
              ageGroupStats: expect.any(Array),
              gameStats: expect.any(Array)
            })
          })
        )
      })
    })

    describe('getRetentionAnalytics', () => {
      it('should return user retention data', async () => {
        ;(query as jest.Mock).mockResolvedValue([
          { date: new Date('2024-01-01'), new_users: 20, d1_retained: 15, d7_retained: 10 },
          { date: new Date('2024-01-02'), new_users: 25, d1_retained: 20, d7_retained: 12 }
        ])

        const req = mockRequest()
        const res = mockResponse()

        await adminController.getRetentionAnalytics(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.arrayContaining([
              expect.objectContaining({
                date: expect.any(Date),
                new_users: expect.any(Number),
                d1_retained: expect.any(Number),
                d7_retained: expect.any(Number)
              })
            ])
          })
        )
      })
    })
  })

  describe('Child Management', () => {
    describe('getChildList', () => {
      it('should return paginated child list with parent info', async () => {
        ;(queryOne as jest.Mock).mockResolvedValue({ total: 80 })
        ;(query as jest.Mock).mockResolvedValue([
          { id: 1, name: '小明', parent_name: '张三', training_count: 50 },
          { id: 2, name: '小红', parent_name: '李四', training_count: 30 }
        ])

        const req = mockRequest({ query: { page: '1', pageSize: '20' } })
        const res = mockResponse()

        await adminController.getChildList(req, res)

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 0,
            data: expect.objectContaining({
              list: expect.any(Array),
              total: 80,
              page: 1,
              pageSize: 20
            })
          })
        )
      })

      it('should filter by age group', async () => {
        ;(queryOne as jest.Mock).mockResolvedValue({ total: 10 })
        ;(query as jest.Mock).mockResolvedValue([])

        const req = mockRequest({ query: { ageGroup: '4-6' } })
        const res = mockResponse()

        await adminController.getChildList(req, res)

        expect(query).toHaveBeenCalledWith(
          expect.stringContaining('c.age_group = ?'),
          expect.arrayContaining(['4-6'])
        )
      })
    })
  })
})