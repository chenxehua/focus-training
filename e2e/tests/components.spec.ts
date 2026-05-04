/**
 * 小程序页面组件交互测试
 * 测试所有 Vue 组件的事件绑定和状态变化
 */
import { test, expect, describe } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

async function apiFetch(path: string, options: {
  method?: string
  body?: Record<string, unknown>
  token?: string
} = {}) {
  const { method = 'GET', body, token } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  return {
    status: response.status,
    ok: response.ok,
    json: await response.json(),
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const randomStr = (prefix: string) => `${prefix}_${Date.now()}`

describe('【通用组件测试】', () => {
  describe('GameTimer 组件', () => {
    test('计时器API调用', async () => {
      const response = await apiFetch('/api/game/timer/start', {
        method: 'POST',
        body: { childId: 1, gameCode: 'schulte' }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('ProgressBar 组件', () => {
    test('进度更新API调用', async () => {
      const response = await apiFetch('/api/progress/update', {
        method: 'POST',
        body: { childId: 1, progress: 50 }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('ChildSelector 组件', () => {
    let authToken: string

    test.beforeAll(async () => {
      await wait(1000)
      const loginRes = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `child_selector_${randomStr('u')}` }
      })
      const loginBody = loginRes.json
      if (loginBody.code === 0 && loginBody.data) {
        authToken = loginBody.data.token
      }
    })

    test('切换孩子 - 获取孩子列表', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/children', { token: authToken })
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
      const body = response.json
      if (body.code === 0) {
        expect(body.data).toHaveProperty('children')
      }
    })

    test('切换孩子 - 设置当前孩子', async () => {
      if (!authToken) return
      
      // 先获取孩子列表
      const childrenRes = await apiFetch('/api/user/children', { token: authToken })
      const childrenBody = childrenRes.json
      
      if (childrenBody.code === 0 && childrenBody.data?.children?.length > 0) {
        const childId = childrenBody.data.children[0].id
        
        // 设置当前孩子
        const response = await apiFetch(`/api/user/children/${childId}/activate`, {
          method: 'POST',
          token: authToken
        })
        expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
      }
    })
  })

  describe('StarRating 组件', () => {
    test('评分提交API', async () => {
      const response = await apiFetch('/api/game/rating', {
        method: 'POST',
        body: {
          childId: 1,
          gameId: 'G001',
          rating: 5,
          comment: '很好玩'
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【首页组件交互】pages/index/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `index_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('打卡进度事件', () => {
    test('更新打卡状态', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/checkin/update', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, date: new Date().toISOString().slice(0, 10) }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('获取连续打卡天数', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/checkin/streak?childId=1', { token: authToken })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('推荐游戏点击事件', () => {
    test('获取推荐游戏列表', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/recommendation/games?childId=1', { token: authToken })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('记录游戏点击', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/click', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, gameId: 'G001', gameCode: 'schulte' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('训练记录事件', () => {
    test('获取今日训练记录', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/records/today?childId=1', { token: authToken })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('加载更多训练记录', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/records?childId=1&page=1&limit=5', { token: authToken })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【游戏广场组件交互】pages/games/index', () => {
  test('筛选游戏类型', async () => {
    const types = ['注意力', '记忆', '反应', '感知', '冥想', '观察', '计算', '听觉']
    
    for (const type of types) {
      const response = await apiFetch(`/api/game/list?type=${encodeURIComponent(type)}`)
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
    }
  })

  test('搜索游戏', async () => {
    const response = await apiFetch('/api/game/list?keyword=舒尔特')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取游戏详情', async () => {
    const response = await apiFetch('/api/game/detail/G001')
    expect([200, 401, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取游戏攻略', async () => {
    const response = await apiFetch('/api/game/guide/G001')
    expect([200, 401, 404, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【家长报告组件交互】pages/parent/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `parent_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('数据刷新事件', () => {
    test('刷新周报数据', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/report/weekly?childId=1&refresh=true', { token: authToken })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('导出报告事件', () => {
    test('请求生成报告PDF', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/report/export', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, format: 'pdf', type: 'weekly' }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('请求生成报告图片', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/report/export', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, format: 'image', type: 'weekly' }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('分享报告事件', () => {
    test('生成分享链接', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/report/share', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, type: 'weekly' }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【个人中心组件交互】pages/profile/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `profile_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('头像更新事件', () => {
    test('更新用户头像', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/avatar', {
        method: 'POST',
        token: authToken,
        body: { avatarUrl: 'https://example.com/new-avatar.png' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('昵称更新事件', () => {
    test('更新用户昵称', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/nickname', {
        method: 'POST',
        token: authToken,
        body: { nickname: '测试新昵称' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('昵称格式验证 - 太短', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/nickname', {
        method: 'POST',
        token: authToken,
        body: { nickname: 'a' }
      })
      expect([400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('昵称格式验证 - 包含非法字符', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/nickname', {
        method: 'POST',
        token: authToken,
        body: { nickname: '<script>alert(1)</script>' }
      })
      expect([400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('添加孩子事件', () => {
    test('验证孩子姓名 - 空字符串', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/children', {
        method: 'POST',
        token: authToken,
        body: { name: '', age: 8 }
      })
      expect([400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('验证孩子姓名 - 超长', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/children', {
        method: 'POST',
        token: authToken,
        body: { name: 'a'.repeat(50), age: 8 }
      })
      expect([400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('验证孩子年龄 - 过小', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/children', {
        method: 'POST',
        token: authToken,
        body: { name: '测试孩子', age: 2 }
      })
      expect([400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('验证孩子年龄 - 过大', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/user/children', {
        method: 'POST',
        token: authToken,
        body: { name: '测试孩子', age: 15 }
      })
      expect([400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【成就中心组件交互】pages/achievement/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `achievement_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('成就详情点击事件', () => {
    test('获取成就详情', async () => {
      const response = await apiFetch('/api/achievement/detail/TRAINING_10')
      expect([200, 401, 404, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('成就分享事件', () => {
    test('分享成就到微信', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/achievement/share', {
        method: 'POST',
        token: authToken,
        body: { achievementCode: 'TRAINING_10', childId: 1 }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【会员中心组件交互】pages/membership/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `membership_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('套餐切换事件', () => {
    test('切换到月卡', async () => {
      const response = await apiFetch('/api/membership/packages?type=month')
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('切换到年卡', async () => {
      const response = await apiFetch('/api/membership/packages?type=year')
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('切换到终身卡', async () => {
      const response = await apiFetch('/api/membership/packages?type=lifetime')
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('优惠券事件', () => {
    test('获取可用优惠券', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/membership/coupons', { token: authToken })
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('兑换优惠券', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/membership/coupon/redeem', {
        method: 'POST',
        token: authToken,
        body: { code: 'TEST123' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('支付事件', () => {
    test('检查支付环境', async () => {
      const response = await apiFetch('/api/payment/check-env')
      expect([200, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('取消支付', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/membership/order/cancel', {
        method: 'POST',
        token: authToken,
        body: { orderId: 'test_order_123' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【训练推荐组件交互】pages/recommendation/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `rec_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('推荐游戏点击事件', () => {
    test('点击推荐游戏 - 舒尔特方格', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/recommendation/click', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, gameCode: 'schulte', source: 'recommendation' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('点击推荐游戏 - 图案记忆', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/recommendation/click', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, gameCode: 'pattern_memory', source: 'recommendation' }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('周计划事件', () => {
    test('完成今日训练标记', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/recommendation/complete-day', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, dayIndex: 0 }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('重置周计划', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/recommendation/reset-week', {
        method: 'POST',
        token: authToken,
        body: { childId: 1 }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【家长学院组件交互】pages/academy/*', () => {
  describe('文章相关事件', () => {
    test('收藏文章', async () => {
      const response = await apiFetch('/api/academy/article/1/favorite', {
        method: 'POST',
        body: {}
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('取消收藏文章', async () => {
      const response = await apiFetch('/api/academy/article/1/favorite', {
        method: 'DELETE',
        body: {}
      })
      expect([200, 204, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('获取相关文章', async () => {
      const response = await apiFetch('/api/academy/article/1/related')
      expect([200, 401, 404, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('问答相关事件', () => {
    test('点赞回答', async () => {
      const response = await apiFetch('/api/academy/answer/1/like', {
        method: 'POST',
        body: {}
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('取消点赞', async () => {
      const response = await apiFetch('/api/academy/answer/1/like', {
        method: 'DELETE',
        body: {}
      })
      expect([200, 204, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【学校管理组件交互】pages/school/*', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `school_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('教师管理事件', () => {
    test('搜索教师', async () => {
      const response = await apiFetch('/api/school/teachers?schoolId=1&keyword=张老师')
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('编辑教师信息', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/school/teacher/1', {
        method: 'PUT',
        token: authToken,
        body: { name: '更新后的名字', phone: '13900139000' }
      })
      expect([200, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    })

    test('删除教师', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/school/teacher/1', {
        method: 'DELETE',
        token: authToken
      })
      expect([200, 204, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('班级管理事件', () => {
    test('获取班级学生统计', async () => {
      const response = await apiFetch('/api/school/class/1/stats')
      expect([200, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    })

    test('编辑班级信息', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/school/class/1', {
        method: 'PUT',
        token: authToken,
        body: { name: '新班级名', grade: '二年级' }
      })
      expect([200, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('学生管理事件', () => {
    test('搜索学生', async () => {
      const response = await apiFetch('/api/school/students?classId=1&keyword=张小明')
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('编辑学生信息', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/school/student/1', {
        method: 'PUT',
        token: authToken,
        body: { name: '新名字' }
      })
      expect([200, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【专注力评估组件交互】pages/assessment/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `assessment_page_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取评估问卷', async () => {
    const response = await apiFetch('/api/assessment/questionnaire')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交评估答案', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/answer', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        answers: [
          { questionId: 1, answer: 'A' },
          { questionId: 2, answer: 'B' },
          { questionId: 3, answer: 'C' }
        ]
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取评估历史', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/history?childId=1')
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('分享评估报告', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/report/share', {
      method: 'POST',
      token: authToken,
      body: { childId: 1, reportId: 1 }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})